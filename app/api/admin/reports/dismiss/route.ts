import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// ---------------------------------------------------------------------
// POST /api/admin/reports/dismiss  { captionId }
// "I looked at this, it's fine" — clears the reports, caption stays live.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  await prisma.report.deleteMany({ where: { captionId } });
  return NextResponse.json({ ok: true });
}
