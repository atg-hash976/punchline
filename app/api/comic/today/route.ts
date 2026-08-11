import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, hasForfeited } from "@/lib/session";
import { computeStreak } from "@/lib/streak";

export async function GET() {
  const now = new Date();

  // "Today's" comic = the most recent one whose releaseAt has passed.
  const comic = await prisma.comic.findFirst({
    where: { releaseAt: { lte: now } },
    orderBy: { releaseAt: "desc" },
  });

  if (!comic) {
    return NextResponse.json({ error: "No comic available yet" }, { status: 404 });
  }

  // Resolve this session's own state server-side, so a page reload doesn't
  // forget that this session already opened/submitted/forfeited today's comic.
  const sessionId = getOrCreateSessionId();
  const [open, ownCaption, streak] = await Promise.all([
    prisma.comicOpen.findUnique({
      where: { comicId_sessionId: { comicId: comic.id, sessionId } },
    }),
    prisma.caption.findFirst({ where: { comicId: comic.id, sessionId } }),
    computeStreak(sessionId),
  ]);

  return NextResponse.json({
    comic,
    openedAt: open?.openedAt ?? null,
    unlocked: Boolean(ownCaption) || hasForfeited(comic.id),
    streak,
  });
}
