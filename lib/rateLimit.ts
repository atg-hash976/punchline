import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------
// IP-keyed rate limiting — the backstop for endpoints where the session
// cookie (this app's only other identity signal) isn't enough on its own,
// since it's cleared in one click. Backed by Postgres rather than a new
// service (Redis/Upstash/etc.) — this app's traffic doesn't come close to
// where that tradeoff would matter, and it means nothing new to set up or
// pay for before launch.
//
// Fixed-lookback-window algorithm: "how many hits for this key in the last
// N ms" rather than a running counter, so there's no read-modify-write race
// to worry about under concurrent requests — each request just counts, then
// (if allowed) inserts its own row.
// ---------------------------------------------------------------------

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowStart = new Date(Date.now() - windowMs);
  const count = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } });

  if (count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  await prisma.rateLimitHit.create({ data: { key } });
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort real client IP behind Vercel's (or any reverse proxy's) edge —
 * `x-forwarded-for` is a client-supplied header in general, but Vercel
 * overwrites it with the actual connecting IP rather than passing through
 * whatever the client sent, so it's trustworthy in that deployment context.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests — please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

/**
 * Every window used in this app is <=24h, so anything older than that is
 * dead weight — called once a day from the freeze cron (already scheduled,
 * already secured) rather than needing a cron entry of its own.
 */
export async function cleanupOldRateLimitHits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
