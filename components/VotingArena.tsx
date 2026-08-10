"use client";

import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import ReportButton from "./ReportButton";

type Challenger = { id: string; username: string; city?: string | null; text: string };

type Props = {
  comicId: string;
  onDone: () => void;
};

export default function VotingArena({ comicId, onDone }: Props) {
  const [pair, setPair] = useState<Challenger[] | null>(null);
  const [round, setRound] = useState(1);
  const [voting, setVoting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

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
    try {
      await fetch("/api/captions/matchup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId, winnerCaptionId: winner.id, loserCaptionId: loser.id }),
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

  return (
    <div className="space-y-3">
      <header className="text-center space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.15em] uppercase text-teal-dark">
          <Swords size={13} strokeWidth={2.5} />
          Round {round}
        </p>
        <h2 className="font-display text-xl font-bold text-ink">Help decide today's winner</h2>
        <p className="text-xs text-ink-muted">Tap the funnier caption</p>
      </header>

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
            className={`flex flex-col justify-between gap-3 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5 p-4 text-left hover:ring-teal/40 hover:shadow-card active:scale-95 transition cursor-pointer ${
              voting ? "opacity-60 pointer-events-none" : ""
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
          Done voting — browse captions
        </button>
      </div>
    </div>
  );
}
