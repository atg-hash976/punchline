import { prisma } from "@/lib/prisma";
import { dateStringInCT, dateInCT } from "@/lib/timezone";

/**
 * Consecutive-day play streak for a session, Wordle-style. A ComicOpen row
 * only ever gets created for the comic that's live at the moment it's
 * opened (practice captions on old comics don't create one), so the CT
 * calendar date of each open IS the day that comic's contest was played —
 * no join back to Comic.releaseAt needed.
 *
 * Grace period: if today hasn't been played yet but yesterday was, the
 * streak still counts (so it reads as "keep it alive," not reset at the
 * stroke of midnight before you've had a chance to play).
 */
export async function computeStreak(sessionId: string): Promise<number> {
  const opens = await prisma.comicOpen.findMany({
    where: { sessionId },
    select: { openedAt: true },
  });
  if (opens.length === 0) return 0;

  const playedDates = new Set(opens.map((o) => dateStringInCT(o.openedAt)));

  const today = dateInCT(0);
  const yesterday = dateInCT(-1);

  let dayOffset: number;
  if (playedDates.has(today)) {
    dayOffset = 0;
  } else if (playedDates.has(yesterday)) {
    dayOffset = -1;
  } else {
    return 0;
  }

  let streak = 0;
  while (playedDates.has(dateInCT(dayOffset))) {
    streak++;
    dayOffset--;
  }
  return streak;
}
