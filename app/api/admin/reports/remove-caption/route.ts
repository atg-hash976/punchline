import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// ---------------------------------------------------------------------
// POST /api/admin/reports/remove-caption  { captionId }
// Removes a reported caption entirely (and its Matchup/Report rows).
// Blocked once a caption is part of a frozen LeaderboardSnapshot — that
// record is meant to be permanent (see lib/freeze.ts), so a caption that
// slipped through until freeze has to stay in the historical record.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { captionId } = await req.json();
  if (!captionId) return NextResponse.json({ error: "captionId required" }, { status: 400 });

  const frozen = await prisma.leaderboardSnapshot.findFirst({ where: { captionId } });
  if (frozen) {
    return NextResponse.json(
      { error: "Can't remove a caption that's already part of a finalized leaderboard." },
      { status: 409 }
    );
  }

  await prisma.matchup.deleteMany({
    where: { OR: [{ winnerCaptionId: captionId }, { loserCaptionId: captionId }] },
  });
  await prisma.report.deleteMany({ where: { captionId } });
  await prisma.caption.delete({ where: { id: captionId } });

  return NextResponse.json({ ok: true });
}
