import { prisma } from "./prisma";
import { wilsonLowerBound } from "./ranking";

/**
 * Finds every comic whose freezeAt has passed and doesn't yet have a
 * snapshot, computes final head-to-head standings, and writes a permanent
 * LeaderboardSnapshot — the official record of the day's winner, independent
 * of live (mutable) Matchup rows. Rank order uses the Wilson score lower
 * bound (see lib/ranking.ts), same as the live Top/Leaderboard tabs, so the
 * frozen #1 matches what players saw while voting.
 *
 * Idempotent and safe to call as often as you like — `snapshots: { none: {} }`
 * means an already-frozen comic is a no-op, so a cron running more often
 * than strictly necessary (or two overlapping triggers) can't double-freeze.
 * Shared by the CLI script (scripts/freeze-leaderboard.ts) and the cron
 * endpoint (app/api/cron/freeze/route.ts) so there's one source of truth.
 */
export async function freezeEligibleComics(): Promise<{ comicId: string; count: number }[]> {
  const now = new Date();

  const comicsToFreeze = await prisma.comic.findMany({
    where: {
      freezeAt: { lte: now },
      snapshots: { none: {} },
    },
    include: { captions: { include: { matchupsWon: true, matchupsLost: true } } },
  });

  const frozen: { comicId: string; count: number }[] = [];

  for (const comic of comicsToFreeze) {
    const ranked = comic.captions
      .map((c) => {
        const winCount = c.matchupsWon.length;
        const matchCount = winCount + c.matchupsLost.length;
        return {
          captionId: c.id,
          winCount,
          matchCount,
          winRate: matchCount > 0 ? winCount / matchCount : 0,
        };
      })
      .sort(
        (a, b) =>
          wilsonLowerBound(b.winCount, b.matchCount) - wilsonLowerBound(a.winCount, a.matchCount) ||
          b.matchCount - a.matchCount
      );

    await prisma.leaderboardSnapshot.createMany({
      data: ranked.map((r, i) => ({
        comicId: comic.id,
        captionId: r.captionId,
        winCount: r.winCount,
        matchCount: r.matchCount,
        winRate: r.winRate,
        rank: i + 1,
      })),
    });

    frozen.push({ comicId: comic.id, count: ranked.length });
  }

  return frozen;
}
