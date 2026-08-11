import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, hasForfeited } from "@/lib/session";
import { weightedSampleByUndersampling, MAX_VOTES_PER_DAY } from "@/lib/ranking";
import { checkRateLimit, getClientIp, rateLimitedResponse } from "@/lib/rateLimit";

// ---------------------------------------------------------------------
// GET /api/captions/matchup?comicId=xxx&excludeIds=a,b&count=1
// Returns up to `count` challenger captions — never the caller's own, never
// one already in excludeIds (the pair currently on screen). Weighted toward
// captions with fewer matchups so every caption gets judged enough times for
// a reliable Wilson score, instead of the same leaders getting shown
// (and voted for) over and over.
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

  // Voting is open to anyone who has unlocked the feed (submitted or
  // forfeited today), not just people who submitted a caption.
  const unlocked = Boolean(ownCaption) || hasForfeited(comicId);
  if (!unlocked) {
    return NextResponse.json({ captions: [] });
  }

  const eligible = await prisma.caption.findMany({
    where: {
      comicId,
      id: { notIn: [...excludeIds, ...(ownCaption ? [ownCaption.id] : [])] },
    },
    select: {
      id: true,
      username: true,
      city: true,
      text: true,
      _count: { select: { matchupsWon: true, matchupsLost: true } },
    },
  });

  const picked = weightedSampleByUndersampling(
    eligible.map((c) => ({
      item: { id: c.id, username: c.username, city: c.city, text: c.text },
      matchCount: c._count.matchupsWon + c._count.matchupsLost,
    })),
    count
  );

  return NextResponse.json({ captions: picked });
}

// ---------------------------------------------------------------------
// POST /api/captions/matchup  { comicId, winnerCaptionId, loserCaptionId }
// Records one head-to-head vote. Anyone who has unlocked the feed today
// (submitted a caption or forfeited to browse) can judge — not just
// submitters, so lurkers help build reliable ranking data too.
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Backstop above MAX_VOTES_PER_DAY's per-session cap (10) — sized to give
  // a few genuine people sharing one IP (a household, an office) headroom,
  // while still stopping a cleared-cookie script from vote-stuffing.
  const voteLimit = await checkRateLimit(`vote:${getClientIp(req)}`, 40, 24 * 60 * 60 * 1000);
  if (!voteLimit.allowed) return rateLimitedResponse(voteLimit.retryAfterSeconds);

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
  const unlocked = Boolean(ownCaption) || hasForfeited(comicId);
  if (!unlocked) {
    return NextResponse.json(
      { error: "Submit a caption or browse today's captions before judging matchups." },
      { status: 403 }
    );
  }
  if (ownCaption && (winnerCaptionId === ownCaption.id || loserCaptionId === ownCaption.id)) {
    return NextResponse.json({ error: "You can't vote on your own caption." }, { status: 403 });
  }

  const votesSoFar = await prisma.matchup.count({ where: { comicId, sessionId } });
  if (votesSoFar >= MAX_VOTES_PER_DAY) {
    return NextResponse.json(
      { error: "You've already judged the maximum number of matchups today." },
      { status: 403 }
    );
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
