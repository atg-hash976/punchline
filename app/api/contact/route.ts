import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------
// POST /api/contact  { name, email, message }
// Illustrator "get in touch" submissions from the footer. Just persisted —
// no email is sent, this is checked manually for now.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const contactLimit = await checkRateLimit(`contact:${getClientIp(req)}`, 5, 24 * 60 * 60 * 1000);
  if (!contactLimit.allowed) return rateLimitedResponse(contactLimit.retryAfterSeconds);

  const { name, email, message } = await req.json();

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await prisma.illustratorInquiry.create({
    data: { name: name.trim(), email: email.trim(), message: message.trim() },
  });

  return NextResponse.json({ ok: true });
}
