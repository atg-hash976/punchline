// 95% confidence lower bound — the standard choice for this formula
// (see Evan Miller, "How Not To Sort By Average Rating").
const Z = 1.96;

/** Cap on how many matchups a single session can judge per comic per day. */
export const MAX_VOTES_PER_DAY = 10;

/**
 * Wilson score lower bound for a binomial proportion. Ranking by this instead
 * of raw win-rate means a caption with 9/10 wins outranks one that's 1/1 —
 * a single lucky win shouldn't beat a caption that's proven itself over more
 * matchups. Returns 0 for captions with no matchups yet (no evidence either way).
 */
export function wilsonLowerBound(wins: number, total: number): number {
  if (total === 0) return 0;
  const phat = wins / total;
  const z2 = Z * Z;
  const denominator = 1 + z2 / total;
  const center = phat + z2 / (2 * total);
  const margin = Z * Math.sqrt((phat * (1 - phat) + z2 / (4 * total)) / total);
  return (center - margin) / denominator;
}

/**
 * Picks `count` items without replacement, weighting toward items with fewer
 * matchups (weight = 1 / (matchCount + 1)). This is what keeps voting from
 * snowballing onto whichever captions already happen to be on top — a caption
 * with 0 matchups is far more likely to be picked than one with 10, so every
 * caption accumulates enough head-to-head data for its Wilson score to mean
 * something. As matchCounts converge, weights converge too, so it self-levels
 * rather than needing a fixed schedule.
 */
export function weightedSampleByUndersampling<T>(
  items: { item: T; matchCount: number }[],
  count: number
): T[] {
  const pool = items.map((i) => ({ item: i.item, weight: 1 / (i.matchCount + 1) }));
  const picked: T[] = [];

  for (let n = 0; n < count && pool.length > 0; n++) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    picked.push(pool[idx].item);
    pool.splice(idx, 1);
  }

  return picked;
}
