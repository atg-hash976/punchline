"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import ComicCard from "@/components/ComicCard";
import CountdownTimer from "@/components/CountdownTimer";
import SubmitCaptionForm from "@/components/SubmitCaptionForm";
import CaptionFeed from "@/components/CaptionFeed";
import ShareModal from "@/components/ShareModal";
import VotingArena from "@/components/VotingArena";
import ResultsReveal from "@/components/ResultsReveal";
import LandingHero from "@/components/LandingHero";
import { isWithinSubmissionWindow, formatComicDate } from "@/lib/timing";

type Comic = { id: string; imageUrl: string; releaseAt: string; freezeAt: string };
type SubmittedCaption = { username: string; city?: string; text: string };
type Result = {
  rank: number;
  winCount: number;
  matchCount: number;
  winRate: number;
  username: string;
  city?: string | null;
  text: string;
  isYou: boolean;
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
  // The landing teaser only greets a genuinely fresh visitor — anyone who
  // already opened/submitted/forfeited today resumes straight into the game.
  const [showLanding, setShowLanding] = useState(false);
  const [yesterday, setYesterday] = useState<Yesterday>(null);

  useEffect(() => {
    fetch("/api/comic/today")
      .then((r) => r.json())
      .then((d) => {
        setComic(d.comic ?? null);
        // Resume this session's real state (server-side truth) instead of
        // always starting from scratch on a page reload.
        setOpenedAt(d.openedAt ?? null);
        setUnlocked(Boolean(d.unlocked));
        setShowLanding(!d.openedAt && !d.unlocked);

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

  if (!comic) {
    return (
      <main className="max-w-lg mx-auto p-6 pt-32 text-center">
        <p className="font-mono text-xs tracking-widest uppercase text-ink-muted">
          Daily Caption Contest
        </p>
        <p className="mt-3 text-ink-muted">No comic available yet — check back at 10am CT!</p>
      </main>
    );
  }

  const windowExpired = openedAt ? !isWithinSubmissionWindow(new Date(openedAt), new Date(now)) : false;

  async function handleForfeit() {
    await fetch("/api/comic/forfeit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic!.id }),
    });
    setUnlocked(true);
  }

  function handleSubmitted(caption: SubmittedCaption) {
    setSubmitted(caption);
    setUnlocked(true);
    setShowShare(true);
  }

  function handlePlayNow() {
    setShowLanding(false);
  }

  async function handleBrowseFromLanding() {
    // Reveal the comic (so there's something to browse captions *about*) but
    // forfeit in the same breath, so the submit form never appears — this is
    // an explicit "I don't want to play" choice, same as the in-game one.
    const res = await fetch("/api/comic/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId: comic!.id }),
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
        <p className="font-mono text-[11px] text-ink-faint">{formatComicDate(new Date(comic.releaseAt))}</p>
        <h1 className="font-display text-3xl font-bold text-ink">Punchline</h1>
        {!showLanding && (
          <Link
            href="/archive"
            className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
          >
            Past winners →
          </Link>
        )}
      </header>

      {results ? (
        <ResultsReveal
          imageUrl={comic.imageUrl}
          results={results}
          footer={
            <p className="text-center text-xs text-ink-muted">
              New comic tomorrow at 10am CT. <Link href="/archive" className="underline decoration-ink-faint underline-offset-2 hover:text-ink transition">Browse past days →</Link>
            </p>
          }
        />
      ) : showLanding ? (
        <LandingHero yesterday={yesterday} onPlay={handlePlayNow} onBrowse={handleBrowseFromLanding} />
      ) : (
        <>
          <ComicCard
            comicId={comic.id}
            imageUrl={comic.imageUrl}
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
              />
            </>
          )}

          {!openedAt && !unlocked && (
            <button
              onClick={handleBrowseFromLanding}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
            >
              <Eye size={13} strokeWidth={2.25} />
              Or, just browse and see what others have said today
            </button>
          )}

          {showVoting ? (
            <VotingArena
              comicId={comic.id}
              onDone={() => setShowVoting(false)}
              exitLabel={submitted ? undefined : "Just browse instead"}
            />
          ) : unlocked ? (
            <CaptionFeed comicId={comic.id} onStartVoting={() => setShowVoting(true)} />
          ) : null}
        </>
      )}

      {showShare && submitted && (
        <ShareModal
          caption={submitted}
          imageUrl={comic.imageUrl}
          onClose={() => {
            setShowShare(false);
            setShowVoting(true);
          }}
        />
      )}
    </main>
  );
}
