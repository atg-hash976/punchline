/**
 * Normalizes caption text for duplicate detection.
 * "Well, this is fine!!" and "well this is fine" should collide.
 *
 * Steps:
 *  1. Lowercase
 *  2. Trim + collapse internal whitespace
 *  3. Strip punctuation entirely (so "fine!!" === "fine" === "fine.")
 */
export function normalizeCaption(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[.,!?;:'"()\-_—–…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks a candidate caption against existing normalized captions for this comic.
 * Call site is responsible for querying existing normalizedText values for the comic
 * (see app/api/captions/route.ts) — this just does the comparison.
 */
export function isDuplicate(candidateNormalized: string, existingNormalized: string[]): boolean {
  return existingNormalized.includes(candidateNormalized);
}
