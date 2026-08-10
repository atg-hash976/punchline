import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";

/**
 * Called the moment a user taps to reveal the blurred comic.
 * Idempotent: if this session already opened this comic, returns the
 * original openedAt rather than resetting the clock (prevents re-opening
 * for a fresh 10 minutes by re-navigating to the page).
 */
export async function POST(req: NextRequest) {
  const { comicId } = await req.json();
  if (!comicId) {
    return NextResponse.json({ error: "comicId required" }, { status: 400 });
  }

  const sessionId = getOrCreateSessionId();

  const open = await prisma.comicOpen.upsert({
    where: { comicId_sessionId: { comicId, sessionId } },
    update: {}, // no-op if it already exists — clock doesn't reset
    create: { comicId, sessionId },
  });

  return NextResponse.json({ openedAt: open.openedAt });
}
