"use client";

import { Trophy, Sparkles, Eye } from "lucide-react";
import Link from "next/link";

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
};

type Props = {
  yesterday: Yesterday | null;
  onPlay: () => void;
  onBrowse: () => void;
};

export default function LandingHero({ yesterday, onPlay, onBrowse }: Props) {
  return (
    <div className="space-y-5">
      {yesterday?.champion && (
        <div className="space-y-3">
          <p className="text-center font-mono text-[11px] tracking-[0.15em] uppercase text-ink-muted">
            Yesterday's cartoon
          </p>
          <div className="rounded-xl2 overflow-hidden shadow-card ring-1 ring-ink/5 bg-card">
            <img src={yesterday.imageUrl} alt="Yesterday's comic" className="w-full" />
          </div>

          <div className="relative bg-card rounded-xl2 shadow-card ring-2 ring-gold/50 p-5 pt-6 text-center space-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center shadow-soft">
              <Trophy size={16} strokeWidth={2.5} />
            </div>
            <p className="text-lg leading-snug text-ink">"{yesterday.champion.text}"</p>
            <p className="text-xs font-mono text-ink-muted">
              — {yesterday.champion.username}
              {yesterday.champion.city ? `, ${yesterday.champion.city}` : ""}
            </p>
            <p className="font-mono text-xs text-ink-faint">
              {yesterday.champion.winCount}-{yesterday.champion.matchCount - yesterday.champion.winCount} ·{" "}
              {Math.round(yesterday.champion.winRate * 100)}% win rate
            </p>
          </div>

          <p className="text-center">
            <Link
              href={`/archive/${yesterday.id}`}
              className="text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
            >
              See full results →
            </Link>
          </p>
        </div>
      )}

      <div className="bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5 p-6 text-center space-y-4">
        <p className="text-ink leading-snug">
          Today's challenge is waiting. One cartoon, one caption. You'll have{" "}
          <span className="font-semibold">10 minutes</span>. Play now!
        </p>

        <button
          onClick={onPlay}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-forest text-white text-sm font-semibold shadow-soft hover:bg-forest-dark active:scale-95 transition"
        >
          <Sparkles size={15} strokeWidth={2.25} />
          Play now
        </button>

        <button
          onClick={onBrowse}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          <Eye size={13} strokeWidth={2.25} />
          Or, just browse and see what others have said today
        </button>
      </div>
    </div>
  );
}
