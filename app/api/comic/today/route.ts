import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, hasForfeited } from "@/lib/session";
import { computeStreak } from "@/lib/streak";

// The "no comic yet" branch below returns before ever touching cookies(),
// so Next.js's static-vs-dynamic detection can miss that this route needs
// to be dynamic — and cache that early response forever (see the same fix
// in /api/comic/archive). Force it explicitly so every request re-checks
// the database instead of serving a stale answer once a comic goes live.
export const dynamic = "force-dynamic";

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
  const [open, ownCaption, streak, votesCast] = await Promise.all([
    prisma.comicOpen.findUnique({
      where: { comicId_sessionId: { comicId: comic.id, sessionId } },
    }),
    prisma.caption.findFirst({ where: { comicId: comic.id, sessionId } }),
    computeStreak(sessionId),
    prisma.matchup.count({ where: { comicId: comic.id, sessionId } }),
  ]);

  return NextResponse.json({
    comic,
    openedAt: open?.openedAt ?? null,
    unlocked: Boolean(ownCaption) || hasForfeited(comic.id),
    // Distinct from `unlocked`: forfeiting also unlocks the feed, but only
    // an actual submission reveals the color version (see ComicCard).
    hasSubmitted: Boolean(ownCaption),
    streak,
    votesCast,
  });
}
