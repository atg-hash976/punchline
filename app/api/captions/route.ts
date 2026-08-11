import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, hasForfeited } from "@/lib/session";
import { normalizeCaption, isDuplicate } from "@/lib/duplicate";
import { checkUsername, checkCaptionText } from "@/lib/moderation";
import { isWithinSubmissionWindow, SUBMISSION_WINDOW_MINUTES } from "@/lib/timing";
import { wilsonLowerBound } from "@/lib/ranking";

const RISING_WINDOW_MINUTES = 30;

// ---------------------------------------------------------------------
// GET /api/captions?comicId=xxx&tab=rising|new|top
// Ranking is driven by head-to-head matchups — see /api/captions/matchup —
// not raw like counts. Top sorts by Wilson score lower bound (confidence-
// adjusted win-rate, see lib/ranking.ts), not plain win-rate, so a caption
// that's 9-for-10 outranks one that's 1-for-1.
// ---------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const comicId = req.nextUrl.searchParams.get("comicId");
  const tab = req.nextUrl.searchParams.get("tab") ?? "rising";
  if (!comicId) return NextResponse.json({ error: "comicId required" }, { status: 400 });

  const sessionId = getOrCreateSessionId();

  // Visibility gate: must have submitted a caption for this comic, or forfeited.
  const ownCaption = await prisma.caption.findFirst({
    where: { comicId, sessionId },
  });
  const unlocked = Boolean(ownCaption) || hasForfeited(comicId);

  if (!unlocked) {
    return NextResponse.json({ locked: true, captions: [] });
  }

  const captions = await prisma.caption.findMany({
    where: { comicId, withinWindow: true },
    include: { matchupsWon: true, matchupsLost: true },
  });

  const shaped = captions.map((c) => {
    const wins = c.matchupsWon.length;
    const losses = c.matchupsLost.length;
    const matches = wins + losses;
    return {
      id: c.id,
      username: c.username,
      city: c.city,
      text: c.text,
      submittedAt: c.submittedAt,
      wins,
      matches,
      winRate: matches > 0 ? wins / matches : 0,
      isYou: c.sessionId === sessionId,
    };
  });

  let sorted;
  if (tab === "top") {
    sorted = shaped.sort(
      (a, b) =>
        wilsonLowerBound(b.wins, b.matches) - wilsonLowerBound(a.wins, a.matches) ||
        b.matches - a.matches
    );
  } else if (tab === "new") {
    sorted = shaped.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } else {
    // rising: net wins (wins - losses) in last RISING_WINDOW_MINUTES / minutes since posted —
    // the win-rate analog of the old "recent likes / time" formula.
    const now = Date.now();
    sorted = shaped
      .map((c) => {
        const caption = captions.find((full) => full.id === c.id)!;
        const isRecent = (createdAt: Date) =>
          now - new Date(createdAt).getTime() <= RISING_WINDOW_MINUTES * 60 * 1000;
        const recentNet =
          caption.matchupsWon.filter((m) => isRecent(m.createdAt)).length -
          caption.matchupsLost.filter((m) => isRecent(m.createdAt)).length;
        const minutesSincePosted = Math.max(
          1,
          (now - new Date(c.submittedAt).getTime()) / 60000
        );
        return { ...c, risingScore: recentNet / minutesSincePosted };
      })
      .sort((a, b) => b.risingScore - a.risingScore);
  }

  return NextResponse.json({ locked: false, captions: sorted });
}

// ---------------------------------------------------------------------
// POST /api/captions  { comicId, username, city?, text }
// ---------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const { comicId, username, city, text } = await req.json();

  if (!comicId || !username || !text) {
    return NextResponse.json({ error: "comicId, username, and text are required" }, { status: 400 });
  }
  if (text.length > 250) {
    return NextResponse.json({ error: "Captions are limited to 250 characters." }, { status: 422 });
  }

  const sessionId = getOrCreateSessionId();

  // 1. Submission window check — must have opened this comic, and be within
  // SUBMISSION_WINDOW_MINUTES.
  const open = await prisma.comicOpen.findUnique({
    where: { comicId_sessionId: { comicId, sessionId } },
  });
  if (!open) {
    return NextResponse.json({ error: "Open today's comic before submitting." }, { status: 403 });
  }
  if (!isWithinSubmissionWindow(open.openedAt)) {
    return NextResponse.json(
      { error: `Your ${SUBMISSION_WINDOW_MINUTES}-minute window for this comic has closed.` },
      { status: 403 }
    );
  }

  // 2. One caption per session per comic.
  const existingOwn = await prisma.caption.findFirst({ where: { comicId, sessionId } });
  if (existingOwn) {
    return NextResponse.json({ error: "You've already submitted a caption today." }, { status: 409 });
  }

  // 3. Username moderation (strict — no mild profanity allowed here).
  const usernameCheck = checkUsername(username);
  if (!usernameCheck.allowed) {
    return NextResponse.json({ error: usernameCheck.reason }, { status: 422 });
  }

  // 3b. Username uniqueness — scoped to today's comic, resets daily by design.
  const usernameTaken = await prisma.caption.findFirst({
    where: { comicId, username: { equals: username } },
  });
  if (usernameTaken) {
    return NextResponse.json({ error: "Username unavailable, try again." }, { status: 409 });
  }

  // 4. Caption moderation (slurs hard-blocked; mild profanity allowed; gratuitous/spam blocked).
  const captionCheck = checkCaptionText(text);
  if (!captionCheck.allowed) {
    return NextResponse.json({ error: captionCheck.reason }, { status: 422 });
  }

  // 5. Duplicate check — exact match after normalization, scoped to this comic.
  const normalizedText = normalizeCaption(text);
  const existing = await prisma.caption.findMany({
    where: { comicId },
    select: { normalizedText: true },
  });
  if (isDuplicate(normalizedText, existing.map((e) => e.normalizedText))) {
    return NextResponse.json(
      { error: "That caption's already been submitted. Try again!" },
      { status: 409 }
    );
  }

  const caption = await prisma.caption.create({
    data: {
      comicId,
      username,
      city: city || null,
      text,
      normalizedText,
      sessionId,
      withinWindow: true,
    },
  });

  return NextResponse.json({ caption });
}
