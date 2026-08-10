"use client";

import { Trophy } from "lucide-react";
import Leaderboard, { LeaderboardEntry } from "./Leaderboard";

export default function ResultsReveal({
  imageUrl,
  results,
  eyebrow = "Results are in",
  title = "Today's Champion",
  footer,
}: {
  imageUrl: string;
  results: LeaderboardEntry[];
  eyebrow?: string;
  title?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl2 overflow-hidden shadow-card ring-1 ring-ink/5 bg-card">
        <img src={imageUrl} alt="Comic" className="w-full" />
      </div>

      <header className="text-center space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.15em] uppercase text-gold-dark">
          <Trophy size={13} strokeWidth={2.5} />
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      </header>

      <Leaderboard results={results} />

      {footer}
    </div>
  );
}
