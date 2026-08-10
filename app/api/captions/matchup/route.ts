import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId } from "@/lib/session";

// ---------------------------------------------------------------------
// GET /api/captions/matchup?comicId=xxx&excludeIds=a,b&count=1
// Returns up to `count` random challenger captions — never the caller's own,
// never one already in excludeIds (the pair currently on screen).
// ---------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const comicId = req.nextUrl.searchParams.get("comicId");
  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });

  const excludeIds = (req.nextUrl.searchParams.get("excludeIds") ?? "")
    .split(",")
    .filter(Boolean);
  const count = Math.min(2, Math.max(1, Number(req.nextUrl.searchParams.get("count")) || 1));

  const sessionId = getOrCreateSessionId();
  const ownCaption = await prisma.caption.findFirst({ where: { comicId, sessionId } });

  const eligible = await prisma.caption.findMany({
    where: {
      comicId,
      id: { notIn: [...excludeIds, ...(ownCaption ? [ownCaption.id] : [])] },
    },
    select: { id: true, username: true, city: true, text: true },
  });

  // Fisher-Yates shuffle, then take the front — keeps matchups unpredictable.
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  return NextResponse.json({ captions: eligible.slice(0, count) });
}

// ---------------------------------------------------------------------
// POST /api/captions/matchup  { comicId, winnerCaptionId, loserCaptionId }
// Records one head-to-head vote. Only sessions that submitted a caption for
// this comic get to judge — matches the "help decide today's winner" prompt
// that only appears right after submitting.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const { comicId, winnerCaptionId, loserCaptionId } = await req.json();
  if (!comicId || !winnerCaptionId || !loserCaptionId) {
    return NextResponse.json(
      { error: "comicId, winnerCaptionId, and loserCaptionId are required" },
      { status: 400 }
    );
  }
  if (winnerCaptionId === loserCaptionId) {
    return NextResponse.json({ error: "winner and loser must differ" }, { status: 400 });
  }

  const sessionId = getOrCreateSessionId();
  const ownCaption = await prisma.caption.findFirst({ where: { comicId, sessionId } });
  if (!ownCaption) {
    return NextResponse.json(
      { error: "Submit a caption before judging matchups." },
      { status: 403 }
    );
  }
  if (winnerCaptionId === ownCaption.id || loserCaptionId === ownCaption.id) {
    return NextResponse.json({ error: "You can't vote on your own caption." }, { status: 403 });
  }

  const [winner, loser] = await Promise.all([
    prisma.caption.findUnique({ where: { id: winnerCaptionId } }),
    prisma.caption.findUnique({ where: { id: loserCaptionId } }),
  ]);
  if (!winner || winner.comicId !== comicId || !loser || loser.comicId !== comicId) {
    return NextResponse.json({ error: "Both captions must belong to this comic." }, { status: 400 });
  }

  await prisma.matchup.create({ data: { comicId, winnerCaptionId, loserCaptionId, sessionId } });

  return NextResponse.json({ ok: true });
}
