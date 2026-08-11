import { NextRequest, NextResponse } from "next/server";
import { freezeEligibleComics } from "@/lib/freeze";
import { cleanupOldRateLimitHits } from "@/lib/rateLimit";

// Never cache — every invocation must actually check current state.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// GET /api/cron/freeze
// Hit this on a schedule (Vercel Cron is wired up in vercel.json; any other
// scheduler — cron-job.org, GitHub Actions, a plain crontab with curl — works
// too, as long as it sends `Authorization: Bearer $CRON_SECRET`). Vercel Cron
// adds that header automatically when CRON_SECRET is set as an env var.
//
// Comics carry their own DST-correct freezeAt (computed in CT at upload
// time — see lib/timezone.ts), so this endpoint doesn't need to run at an
// exact instant; it just needs to run *sometime* after each comic's freezeAt.
// It's idempotent (see lib/freeze.ts), so firing it more often than needed,
// or twice in a row, is harmless.
// ---------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server not configured: set CRON_SECRET" },
      { status: 500 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const frozen = await freezeEligibleComics();
  const rateLimitHitsPurged = await cleanupOldRateLimitHits();
  return NextResponse.json({ frozen, rateLimitHitsPurged });
}
