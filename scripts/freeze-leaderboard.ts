/**
 * Manual/local CLI entry point for freezing leaderboards — see lib/freeze.ts
 * for the actual logic and lib/freeze.ts's doc comment for why it's safe to
 * run repeatedly. In production this runs on a schedule via the cron-secured
 * endpoint at app/api/cron/freeze/route.ts, wired up in vercel.json — this
 * script is for testing that same logic locally without waiting on a cron.
 */
import { freezeEligibleComics } from "../lib/freeze";

async function main() {
  const frozen = await freezeEligibleComics();

  if (frozen.length === 0) {
    console.log("Nothing to freeze right now.");
    return;
  }

  for (const { comicId, count } of frozen) {
    console.log(`Froze leaderboard for comic ${comicId}: ${count} captions ranked.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
