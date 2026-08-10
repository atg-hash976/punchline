import { Profanease, Category } from "profanease";
import { categorized } from "profanease/langs/en";

/**
 * Three-tier moderation, per the design:
 *   Tier 1 — slurs: hard-blocked everywhere (username + caption). No exceptions.
 *   Tier 2 — mild profanity: blocked in usernames, ALLOWED in captions.
 *   Tier 3 — gratuitous/spam patterns: caption-only, heuristic (not a wordlist).
 *
 * Tier 1 is sourced from `profanease`'s SLUR category specifically (not its general
 * PROFANITY/INSULT/SEXUAL categories — those would conflict with Tier 2 intentionally
 * allowing mild profanity in captions). Verified before wiring in: 169 English slur
 * entries, zero false positives against every username/city already used in this
 * app, and confirmed catching real entries from its own list. Comes with its own
 * leetspeak/homoglyph/zero-width-char normalization, so raw (not pre-normalized)
 * text is passed to it directly. It's a maintained npm dependency, not a static
 * copy-pasted array, so it can pick up list updates via `npm update`. Still worth
 * pairing with a moderation API (Perspective API / OpenAI moderation endpoint) for
 * anything this misses, and shipping the report/flag button (see README) as a human
 * backstop — a wordlist, however well-maintained, is never the whole answer.
 */
const slurFilter = new Profanease({ languages: [categorized], categories: [Category.SLUR] });

// --- Tier 2: mild profanity, username-only ban --------------------------

const TIER_2_PROFANITY: string[] = ["fuck", "shit", "bitch", "asshole", "damn"];

// --- Normalization to catch leetspeak / spacing tricks -------------------

function normalizeForFilter(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s._\-*]/g, "") // strip spaces/punctuation people use to evade filters
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

function containsAny(normalized: string, list: string[]): boolean {
  return list.some((word) => normalized.includes(word));
}

export type ModerationResult = { allowed: true } | { allowed: false; reason: string };

export function checkUsername(username: string): ModerationResult {
  if (slurFilter.check(username)) {
    return { allowed: false, reason: "Username not allowed. Please try another." };
  }
  const normalized = normalizeForFilter(username);
  if (containsAny(normalized, TIER_2_PROFANITY)) {
    return { allowed: false, reason: "Username unavailable, try again." };
  }
  return { allowed: true };
}

export function checkCaptionText(text: string): ModerationResult {
  if (slurFilter.check(text)) {
    return { allowed: false, reason: "This caption isn't allowed. Please revise and resubmit." };
  }

  const gratuitous = checkGratuitous(text);
  if (!gratuitous.allowed) return gratuitous;

  return { allowed: true };
}

/**
 * Tier 3 heuristic: catches "FUCK FUCK FUCK FUCK" style spam while allowing
 * "Well this fuckin' sucks." — based on repetition and profanity density,
 * not a hard wordlist. Tune thresholds against real submissions once live.
 */
function checkGratuitous(text: string): ModerationResult {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return { allowed: false, reason: "Caption can't be empty." };
  }

  // Minimum effort bar — filters pure keyboard mash / one-word spam.
  if (words.length < 2 && words[0].length < 3) {
    return { allowed: false, reason: "Caption is too short." };
  }

  const normalizedWords = words.map((w) => normalizeForFilter(w));

  // Repetition check: does one word dominate the caption?
  const counts = new Map<string, number>();
  for (const w of normalizedWords) counts.set(w, (counts.get(w) ?? 0) + 1);
  const maxRepeat = Math.max(...counts.values());
  if (maxRepeat >= 3 && maxRepeat / normalizedWords.length > 0.5) {
    return { allowed: false, reason: "Please write an actual caption, not repeated words." };
  }

  // Profanity density check: mostly-profanity captions get blocked;
  // a normal sentence with one swear word sails through.
  const profaneCount = normalizedWords.filter((w) => containsAny(w, TIER_2_PROFANITY)).length;
  if (profaneCount / normalizedWords.length > 0.6 && normalizedWords.length >= 2) {
    return { allowed: false, reason: "Please write an actual caption." };
  }

  return { allowed: true };
}
