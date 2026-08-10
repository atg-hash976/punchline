import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Reads no request-scoped API (no cookies()/headers()), so Next.js would
// otherwise statically optimize this at build time and freeze the response
// forever — force it dynamic so every request re-checks the database.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// GET /api/comic/archive
// Past comics that have a frozen leaderboard — today's comic is excluded
// even if it happens to already be frozen, so the archive only ever shows
// *past* days, like a Wordle back-catalog.
// ---------------------------------------------------------------------
export async function GET() {
  const now = new Date();

  const today = await prisma.comic.findFirst({
    where: { releaseAt: { lte: now } },
    orderBy: { releaseAt: "desc" },
  });

  const comics = await prisma.comic.findMany({
    where: {
      id: today ? { not: today.id } : undefined,
      snapshots: { some: { rank: 1 } },
    },
    orderBy: { releaseAt: "desc" },
    include: {
      snapshots: {
        where: { rank: 1 },
        include: { caption: true },
      },
    },
  });

  const archive = comics.map((c) => ({
    id: c.id,
    imageUrl: c.imageUrl,
    releaseAt: c.releaseAt,
    champion: c.snapshots[0]
      ? {
          username: c.snapshots[0].caption.username,
          city: c.snapshots[0].caption.city,
          text: c.snapshots[0].caption.text,
          winCount: c.snapshots[0].winCount,
          matchCount: c.snapshots[0].matchCount,
          winRate: c.snapshots[0].winRate,
        }
      : null,
  }));

  return NextResponse.json({ archive });
}
