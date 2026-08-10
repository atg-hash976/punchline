// 95% confidence lower bound — the standard choice for this formula
// (see Evan Miller, "How Not To Sort By Average Rating").
const Z = 1.96;

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
