import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

// ---------------------------------------------------------------------
// POST /api/captions/report  { captionId }
// The human backstop for whatever automated moderation misses. No
// unlock-gate — anyone who can see a caption can flag it, unlike voting
// which is restricted to submitters. Idempotent: repeat taps from the same
// session on the same caption don't inflate the count.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Caps how fast one IP can flag captions — the concern isn't a genuine
  // heavy user, it's a cleared-cookie script mass-reporting someone's
  // caption off the board through the admin removal queue.
  const reportLimit = await checkRateLimit(`report:${getClientIp(req)}`, 20, 24 * 60 * 60 * 1000);
  if (!reportLimit.allowed) return rateLimitedResponse(reportLimit.retryAfterSeconds);

  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  const caption = await prisma.caption.findUnique({ where: { id: captionId } });
  if (!caption) return NextResponse.json({ error: "Caption not found" }, { status: 404 });

  const sessionId = getOrCreateSessionId();

  await prisma.report.upsert({
    where: { captionId_sessionId: { captionId, sessionId } },
    update: {},
    create: { captionId, sessionId },
  });

  return NextResponse.json({ reported: true });
}

// ---------------------------------------------------------------------
// DELETE /api/captions/report  { captionId }
// Un-reports — lets someone correct a misclick. Idempotent: deleting a
// report that isn't there (already undone, or never existed) is a no-op.
// ---------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  const sessionId = getOrCreateSessionId();

  await prisma.report.deleteMany({ where: { captionId, sessionId } });

  return NextResponse.json({ reported: false });
}
