"use client";

import { useEffect, useState } from "react";
import { Swords, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReportButton from "./ReportButton";

type Challenger = { id: string; username: string; city?: string | null; text: string };

type Props = {
  comicId: string;
  onDone: () => void;
  exitLabel?: string;
};

const DOTS_PER_SET = 5;

export default function VotingArena({ comicId, onDone, exitLabel = "Done voting — browse captions" }: Props) {
  const [pair, setPair] = useState<Challenger[] | null>(null);
  const [round, setRound] = useState(1);
  const [voting, setVoting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // The picked card holds a green "burst" for a beat before the loser gets
  // replaced — purely a feel/feedback delay, not tied to the actual request.
  const [winningId, setWinningId] = useState<string | null>(null);
  // Ephemeral, this-visit-only tally — gives voters a small, achievable goal
  // (fill 5 dots) rather than an open-ended "keep voting forever" ask. Once
  // a set fills, it slides away and a fresh empty one takes its place.
  const [votesCast, setVotesCast] = useState(0);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    fetch(`/api/captions/matchup?comicId=${comicId}&count=2`)
      .then((r) => r.json())
      .then((data) => {
        if ((data.captions ?? []).length < 2) setUnavailable(true);
        else setPair(data.captions);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePick(winner: Challenger, loser: Challenger) {
    if (voting || !pair) return;
    setVoting(true);
    setWinningId(winner.id);
    try {
      // Let the burst animation actually play before the loser gets swapped out.
      await new Promise((resolve) => setTimeout(resolve, 420));

      await fetch("/api/captions/matchup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId, winnerCaptionId: winner.id, loserCaptionId: loser.id }),
      });

      setVotesCast((v) => {
        if (v === 0) {
          setShowThanks(true);
          setTimeout(() => setShowThanks(false), 2200);
        }
        return v + 1;
      });

      const excludeIds = pair.map((c) => c.id).join(",");
      const res = await fetch(
        `/api/captions/matchup?comicId=${comicId}&excludeIds=${excludeIds}&count=1`
      );
      const data = await res.json();
      const replacement: Challenger | undefined = (data.captions ?? [])[0];

      if (!replacement) {
        setUnavailable(true);
        return;
      }
      setPair((prev) => prev!.map((c) => (c.id === loser.id ? replacement : c)));
      setRound((r) => r + 1);
    } finally {
      setVoting(false);
      setWinningId(null);
    }
  }

  if (unavailable) {
    return (
      <div className="text-center space-y-3 p-5 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5">
        <p className="text-sm text-ink-muted">
          Not enough other captions yet to judge — check back soon!
        </p>
        <button
          onClick={onDone}
          className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm font-semibold hover:opacity-90 active:scale-95 transition"
        >
          Browse captions
        </button>
      </div>
    );
  }

  if (!pair) {
    return <div className="text-center text-ink-muted text-sm p-8">Loading matchup…</div>;
  }

  const [a, b] = pair;
  const setIndex = Math.floor(votesCast / DOTS_PER_SET);
  const filledDots = votesCast % DOTS_PER_SET;

  return (
    <div className="space-y-3">
      <header className="text-center space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.15em] uppercase text-blue-dark">
          <Swords size={13} strokeWidth={2.5} />
          Round {round}
        </p>
        <h2 className="font-display text-xl font-bold text-ink">Help decide today's winner</h2>
        <p className="text-xs text-ink-muted">Tap the funnier caption</p>
      </header>

      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-full flex justify-center overflow-hidden py-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={setIndex}
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="flex items-center gap-2"
            >
              {Array.from({ length: DOTS_PER_SET }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i < filledDots ? "bg-forest" : "bg-ink/10"
                  }`}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showThanks && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1 text-[11px] font-medium text-forest-dark"
            >
              <Heart size={11} strokeWidth={2.5} fill="currentColor" />
              Thank you for voting!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative grid grid-cols-2 gap-3 items-stretch">
        {[a, b].map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => !voting && handlePick(c, c.id === a.id ? b : a)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !voting) {
                e.preventDefault();
                handlePick(c, c.id === a.id ? b : a);
              }
            }}
            className={`flex flex-col justify-between gap-3 bg-card rounded-xl2 shadow-soft p-4 text-left transition cursor-pointer ${
              voting ? "pointer-events-none" : ""
            } ${
              c.id === winningId
                ? "ring-2 ring-forest animate-winner-burst"
                : `ring-1 ring-ink/5 hover:ring-forest/50 hover:bg-forest-light/40 hover:shadow-card active:scale-95 ${
                    voting ? "opacity-40" : ""
                  }`
            }`}
          >
            <p className="text-sm leading-snug text-ink">"{c.text}"</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-mono text-ink-muted">
                — {c.username}
                {c.city ? `, ${c.city}` : ""}
              </p>
              <ReportButton key={c.id} captionId={c.id} />
            </div>
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-coral text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-soft">
          VS
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onDone}
          className="text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          {exitLabel}
        </button>
      </div>
    </div>
  );
}
