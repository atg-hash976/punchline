"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ComicCard, { COLOR_REVEAL_MS } from "@/components/ComicCard";
import CountdownTimer from "@/components/CountdownTimer";
import SubmitCaptionForm from "@/components/SubmitCaptionForm";
import PreFillForm from "@/components/PreFillForm";
import CaptionFeed from "@/components/CaptionFeed";
import OwnCaptionCard from "@/components/OwnCaptionCard";
import ShareModal from "@/components/ShareModal";
import Confetti from "@/components/Confetti";
import PunchlineLogo from "@/components/PunchlineLogo";
import VotingArena from "@/components/VotingArena";
import ResultsReveal from "@/components/ResultsReveal";
import LandingHero from "@/components/LandingHero";
import { isWithinSubmissionWindow, formatComicDate } from "@/lib/timing";

type Comic = {
  id: string;
  imageUrl: string;
  colorImageUrl: string | null;
  releaseAt: string;
  freezeAt: string;
};
type SubmittedCaption = { username: string; city?: string; text: string };
type Result = {
  id: string;
  rank: number;
  winCount: number;
  matchCount: number;
  winRate: number;
  username: string;
  city?: string | null;
  text: string;
  isYou: boolean;
  heartCount: number;
};
type Yesterday = {
  id: string;
  imageUrl: string;
  champion: {
    username: string;
    city?: string | null;
    text: string;
    winCount: number;
    matchCount: number;
    winRate: number;
  } | null;
} | null;

export default function Home() {
  const [comic, setComic] = useState<Comic | null>(null);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false); // submitted or forfeited
  const [submitted, setSubmitted] = useState<SubmittedCaption | null>(null);
  const [showShare, setShowShare] = useState(false);
  // Only sessions that *just* submitted (this page load) get the head-to-head
  // prompt — it appears once, right after the share modal, then never again.
  const [showVoting, setShowVoting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [results, setResults] = useState<Result[] | null>(null); // non-null once frozen
  // Defaults true — a fresh visitor (the common case, e.g. arriving from a
  // share link) sees the landing hero on first paint with no loading flash;
  // this gets corrected the moment real server state comes back, for the
  // rarer case of a same-day returning visitor resuming mid-game.
  const [showLanding, setShowLanding] = useState(true);
  // Starts false (optimistic, matches showLanding's default) — flips true
  // only once the fetch actually confirms there's genuinely no comic today,
  // as opposed to just not having loaded yet.
  const [noComicYet, setNoComicYet] = useState(false);
  const [yesterday, setYesterday] = useState<Yesterday>(null);
  // Filled in before the comic is revealed, so typing your name doesn't
  // eat into the caption clock — SubmitCaptionForm picks up from here.
  const [prefillUsername, setPrefillUsername] = useState("");
  const [prefillCity, setPrefillCity] = useState("");
  const [streak, setStreak] = useState(0);
  // How many matchups this session has judged today — server-truth, so it
  // survives leaving and re-entering the voting arena (or reloading).
  const [votesCast, setVotesCast] = useState(0);
  // Distinct from `unlocked` — forfeiting also unlocks the feed, but only an
  // actual submission reveals the comic's color version.
  const [hasSubmittedCaption, setHasSubmittedCaption] = useState(false);
  // True for the moment right after submitting, while the comic's color
  // wipe plays — the share card waits until that finishes instead of
  // popping up instantly and covering the very moment it's celebrating.
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    fetch("/api/comic/today")
      .then((r) => r.json())
      .then((d) => {
        setComic(d.comic ?? null);
        setNoComicYet(!d.comic);
        // Resume this session's real state (server-side truth) instead of
        // always starting from scratch on a page reload.
        setOpenedAt(d.openedAt ?? null);
        setUnlocked(Boolean(d.unlocked));
        setShowLanding(Boolean(d.comic) && !d.openedAt && !d.unlocked);
        setStreak(d.streak ?? 0);
        setVotesCast(d.votesCast ?? 0);
        setHasSubmittedCaption(Boolean(d.hasSubmitted));

        if (d.comic) {
          fetch(`/api/comic/results?comicId=${d.comic.id}`)
            .then((r) => r.json())
            .then((rd) => setResults(rd.frozen ? rd.results : null));
        }
      });

    fetch("/api/comic/archive")
      .then((r) => r.json())
      .then((d) => setYesterday(d.archive?.[0] ?? null));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const windowExpired = openedAt ? !isWithinSubmissionWindow(new Date(openedAt), new Date(now)) : false;
  // Lurkers only ever see black-and-white — the color version is the
  // submission reward, so it's only used once this session has one.
  // Both fall back safely for the brief window before the initial fetch
  // resolves (comic is still null then, since the landing hero — the
  // default view — doesn't need either of these).
  const shareImageUrl = comic ? (hasSubmittedCaption ? comic.colorImageUrl ?? comic.imageUrl : comic.imageUrl) : "";
  const comicDate = comic ? formatComicDate(new Date(comic.releaseAt)) : "";

  async function handleForfeit() {
    if (!comic) return;
    await fetch("/api/comic/forfeit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic.id }),
    });
    setUnlocked(true);
  }

  function handleSubmitted(caption: SubmittedCaption) {
    setSubmitted(caption);
    setUnlocked(true);
    setHasSubmittedCaption(true); // triggers ComicCard's color wipe now
    setCelebrating(true);
    // Let the wipe + confetti actually play before the share card covers
    // the screen — a little past COLOR_REVEAL_MS so the sweep visibly finishes.
    setTimeout(() => {
      setCelebrating(false);
      setShowShare(true);
    }, COLOR_REVEAL_MS + 300);
  }

  function handlePlayNow() {
    if (!comic) return;
    setShowLanding(false);
  }

  // Re-checks the server's vote tally so the "Judge two captions" button
  // reflects however many were actually cast, whether the arena was exited
  // early or ran all the way to the celebration screen.
  async function handleVotingDone() {
    setShowVoting(false);
    const res = await fetch("/api/comic/today");
    const d = await res.json();
    setVotesCast(d.votesCast ?? 0);
  }

  async function handleBrowseFromLanding() {
    if (!comic) return;
    // Reveal the comic (so there's something to browse captions *about*) but
    // forfeit in the same breath, so the submit form never appears — this is
    // an explicit "I don't want to play" choice, same as the in-game one.
    const res = await fetch("/api/comic/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic.id }),
    });
    const data = await res.json();
    setOpenedAt(data.openedAt);
    await handleForfeit();
    setShowLanding(false);
    // Land lurkers in the voting arena first, not straight into the feed —
    // one extra tap solicits a vote or two before they bail to just browse.
    setShowVoting(true);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
      <header className="text-center space-y-1">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark">
          Daily Caption Contest
        </p>
        {comic && <p className="font-mono text-[11px] text-ink-faint">{comicDate}</p>}
        <h1 className="font-display text-3xl font-bold">
          <PunchlineLogo />
          <sup className="ml-1 align-super font-mono text-[11px] font-normal text-ink-faint">BETA</sup>
        </h1>
        {!showLanding && (
          <Link
            href="/archive"
            className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
          >
            Past winners →
          </Link>
        )}
      </header>

      {results && comic ? (
        <ResultsReveal
          imageUrl={comic.imageUrl}
          results={results}
          footer={
            <p className="text-center text-xs text-ink-muted">
              New comic tomorrow at 10am CT. <Link href="/archive" className="underline decoration-ink-faint underline-offset-2 hover:text-ink transition">Browse past days →</Link>
            </p>
          }
        />
      ) : noComicYet ? (
        <p className="text-center text-ink-muted mt-3">No comic available yet — check back at 10am CT!</p>
      ) : showLanding ? (
        <LandingHero
          yesterday={yesterday}
          streak={streak}
          onPlay={handlePlayNow}
          onBrowse={handleBrowseFromLanding}
        />
      ) : comic ? (
        <>
          <ComicCard
            comicId={comic.id}
            imageUrl={comic.imageUrl}
            colorImageUrl={comic.colorImageUrl}
            showColor={hasSubmittedCaption}
            initialOpenedAt={openedAt}
            onOpened={setOpenedAt}
          />

          {openedAt && !unlocked && (
            <>
              <CountdownTimer openedAt={openedAt} />
              <SubmitCaptionForm
                comicId={comic.id}
                windowExpired={windowExpired}
                onSubmitted={handleSubmitted}
                onForfeit={handleForfeit}
                initialUsername={prefillUsername}
                initialCity={prefillCity}
              />
            </>
          )}

          {!openedAt && !unlocked && (
            <>
              <PreFillForm
                username={prefillUsername}
                city={prefillCity}
                onUsernameChange={setPrefillUsername}
                onCityChange={setPrefillCity}
              />
              <button
                onClick={handleBrowseFromLanding}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
              >
                Don't feel like playing today? Just browse and see what others have said today.
              </button>
            </>
          )}

          {showVoting ? (
            <VotingArena
              comicId={comic.id}
              initialVotesCast={votesCast}
              onDone={handleVotingDone}
              exitLabel={submitted ? undefined : "Just browse instead"}
            />
          ) : unlocked ? (
            <>
              {hasSubmittedCaption && (
                <OwnCaptionCard comicId={comic.id} shareImageUrl={shareImageUrl} comicDate={comicDate} />
              )}
              <CaptionFeed
                comicId={comic.id}
                votesCast={votesCast}
                shareImageUrl={shareImageUrl}
                comicDate={comicDate}
                onStartVoting={() => setShowVoting(true)}
              />
            </>
          ) : null}
        </>
      ) : null}

      {celebrating && <Confetti />}

      {showShare && submitted && (
        <ShareModal
          caption={{ ...submitted, isYou: true }}
          imageUrl={shareImageUrl}
          comicDate={comicDate}
          celebrate={false}
          onClose={() => {
            setShowShare(false);
            setShowVoting(true);
          }}
        />
      )}
    </main>
  );
}
