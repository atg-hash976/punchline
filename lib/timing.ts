export const SUBMISSION_WINDOW_MINUTES = 10;

/**
 * Given when a session opened a comic, returns whether "now" is still within
 * their personal 10-minute submission window.
 */
export function isWithinSubmissionWindow(openedAt: Date, now: Date = new Date()): boolean {
  const elapsedMs = now.getTime() - openedAt.getTime();
  return elapsedMs >= 0 && elapsedMs <= SUBMISSION_WINDOW_MINUTES * 60 * 1000;
}

export function secondsRemaining(openedAt: Date, now: Date = new Date()): number {
  const elapsedMs = now.getTime() - openedAt.getTime();
  const remainingMs = SUBMISSION_WINDOW_MINUTES * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/** Is this comic currently released (visible) and not yet frozen? */
export function isComicLive(releaseAt: Date, freezeAt: Date, now: Date = new Date()): boolean {
  return now >= releaseAt && now < freezeAt;
}
