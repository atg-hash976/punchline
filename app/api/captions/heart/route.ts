import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

// ---------------------------------------------------------------------
// POST /api/captions/heart  { captionId }
// A lightweight "like" — purely a social signal, entirely separate from
// head-to-head voting and never factored into ranking. Same no-unlock-gate
// as reporting: anyone who can see a caption can heart it. Idempotent:
// repeat taps from the same session don't inflate the count.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const heartLimit = await checkRateLimit(`heart:${getClientIp(req)}`, 60, 60 * 60 * 1000);
  if (!heartLimit.allowed) return rateLimitedResponse(heartLimit.retryAfterSeconds);

  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  const caption = await prisma.caption.findUnique({ where: { id: captionId } });
  if (!caption) return NextResponse.json({ error: "Caption not found" }, { status: 404 });

  const sessionId = getOrCreateSessionId();

  await prisma.heart.upsert({
    where: { captionId_sessionId: { captionId, sessionId } },
    update: {},
    create: { captionId, sessionId },
  });

  return NextResponse.json({ hearted: true });
}

// ---------------------------------------------------------------------
// DELETE /api/captions/heart  { captionId }
// Un-hearts — lets someone correct a misclick. Idempotent.
// ---------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  const sessionId = getOrCreateSessionId();

  await prisma.heart.deleteMany({ where: { captionId, sessionId } });

  return NextResponse.json({ hearted: false });
}
