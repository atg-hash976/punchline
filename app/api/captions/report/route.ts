import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";

// ---------------------------------------------------------------------
// POST /api/captions/report  { captionId }
// The human backstop for whatever automated moderation misses. No
// unlock-gate — anyone who can see a caption can flag it, unlike voting
// which is restricted to submitters. Idempotent: repeat taps from the same
// session on the same caption don't inflate the count.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
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
