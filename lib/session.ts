import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE = "cc_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Gets (or creates) the anonymous session id for the current visitor.
 * This is our lightweight, no-login-required identity for:
 *   - rate limiting submissions per comic
 *   - identifying which captions are "yours" for head-to-head matchup judging
 *   - NOT a security boundary — a cleared cookie resets someone's limits.
 *     We accept that tradeoff for accessibility; see IP-based backstop in route handlers.
 */
export function getOrCreateSessionId(): string {
  const store = cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = uuidv4();
  store.set(SESSION_COOKIE, id, {
    maxAge: ONE_YEAR,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return id;
}

/**
 * "Forfeit" = user chose to browse captions without submitting their own today.
 * Tracked per-comic so forfeiting today doesn't affect tomorrow's comic.
 */
function forfeitCookieName(comicId: string) {
  return `cc_forfeit_${comicId}`;
}

export function markForfeited(comicId: string) {
  cookies().set(forfeitCookieName(comicId), "1", {
    maxAge: 60 * 60 * 24, // one day is plenty — new comic tomorrow
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function hasForfeited(comicId: string): boolean {
  return cookies().get(forfeitCookieName(comicId))?.value === "1";
}
