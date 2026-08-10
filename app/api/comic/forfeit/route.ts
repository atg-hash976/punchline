import { NextRequest, NextResponse } from "next/server";
import { markForfeited } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { comicId } = await req.json();
  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });
  markForfeited(comicId);
  return NextResponse.json({ forfeited: true });
}
