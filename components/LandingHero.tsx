"use client";

import { Trophy, Sparkles, Eye, Flame } from "lucide-react";
import Link from "next/link";
import { SUBMISSION_WINDOW_MINUTES } from "@/lib/timing";

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
  streak: number;
  onPlay: () => void;
  onBrowse: () => void;
};

export default function LandingHero({ yesterday, streak, onPlay, onBrowse }: Props) {
  return (
    <div className="space-y-5">
      {streak > 0 && (
        <p className="flex items-center justify-center gap-1.5 font-mono text-xs font-semibold text-gold-dark">
          <Flame size={14} strokeWidth={2.5} className="text-gold" />
          {streak}-day streak — keep it alive!
        </p>
      )}

      <div className="bg-gradient-to-b from-forest-light to-card rounded-xl2 shadow-pop ring-2 ring-forest/30 p-6 text-center space-y-4">
        <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.15em] uppercase text-forest-dark">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-forest" />
          </span>
          Today's challenge
        </p>

        <p className="text-ink leading-snug">
          One comic. One caption.{" "}
          <span className="font-semibold">{SUBMISSION_WINDOW_MINUTES} minutes</span> to play.{" "}
          <span className="font-bold">Today's challenge is waiting.</span>
        </p>

        <button
          onClick={onPlay}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-full bg-forest text-white text-base font-bold shadow-pop hover:bg-forest-dark active:scale-95 transition animate-invite-pulse"
        >
          <Sparkles size={18} strokeWidth={2.5} />
          Submit Daily Punchline
        </button>

        <button
          onClick={onBrowse}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          <Eye size={13} strokeWidth={2.25} />
          Don't feel like playing today? Just browse and see what others have said today.
        </button>
      </div>

      {yesterday?.champion && (
        <div className="space-y-3">
          <p className="text-center font-mono text-[11px] tracking-[0.15em] uppercase text-ink-muted">
            Yesterday's punchline
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

      <p className="text-center">
        <Link
          href="/archive"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          Past winners →
        </Link>
      </p>
    </div>
  );
}
