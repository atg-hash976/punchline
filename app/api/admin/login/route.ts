import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Server not configured: set ADMIN_PASSWORD in .env" },
      { status: 500 }
    );
  }

  const { password } = await req.json();
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
