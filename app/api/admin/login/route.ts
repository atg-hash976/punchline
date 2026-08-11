import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminSessionCookie } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Server not configured: set ADMIN_PASSWORD in .env" },
      { status: 500 }
    );
  }

  // Tightest limit in the app — this is the single password gate to the
  // whole admin panel, so it's the one endpoint worth protecting against
  // brute force specifically, not just spam.
  const loginLimit = await checkRateLimit(`admin-login:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!loginLimit.allowed) return rateLimitedResponse(loginLimit.retryAfterSeconds);

  const { password } = await req.json();
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
