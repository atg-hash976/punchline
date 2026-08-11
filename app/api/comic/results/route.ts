import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";

// ---------------------------------------------------------------------
// GET /api/comic/results?comicId=xxx
// Reads the permanent LeaderboardSnapshot (written once by
// scripts/freeze-leaderboard.ts) — never live Matchup data — so results
// are genuinely final and never shift after the reveal is shown.
// ---------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const comicId = req.nextUrl.searchParams.get("comicId");
  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });

  const sessionId = getOrCreateSessionId();

  const comic = await prisma.comic.findUnique({
    where: { id: comicId },
    select: { imageUrl: true, releaseAt: true, artistName: true },
  });
  if (!comic) return NextResponse.json({ error: "Comic not found" }, { status: 404 });

  const snapshots = await prisma.leaderboardSnapshot.findMany({
    where: { comicId },
    orderBy: { rank: "asc" },
    include: { caption: { include: { _count: { select: { hearts: true } } } } },
  });

  if (snapshots.length === 0) {
    return NextResponse.json({ frozen: false, comic });
  }

  const results = snapshots.map((s) => ({
    id: s.captionId,
    rank: s.rank,
    winCount: s.winCount,
    matchCount: s.matchCount,
    winRate: s.winRate,
    username: s.caption.username,
    city: s.caption.city,
    text: s.caption.text,
    isYou: s.caption.sessionId === sessionId,
    heartCount: s.caption._count.hearts,
  }));

  return NextResponse.json({ frozen: true, comic, results });
}
