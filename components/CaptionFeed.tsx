"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Trophy,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Lock,
  PenLine,
} from "lucide-react";
import Leaderboard, { LeaderboardEntry } from "./Leaderboard";
import ReportButton from "./ReportButton";

type Caption = {
  id: string;
  username: string;
  city?: string;
  text: string;
  wins: number;
  matches: number;
  winRate: number;
  isYou: boolean;
};

type Tab = "rising" | "new" | "top" | "leaderboard";

const TABS: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: "rising", label: "Rising", icon: TrendingUp },
  { id: "new", label: "New", icon: Sparkles },
  { id: "top", label: "Top", icon: Trophy },
  { id: "leaderboard", label: "Leaderboard", icon: ListOrdered },
];

// The leaderboard tab is just a different *display* of Top's ranking — same
// Wilson-score sort, server-side — so it reuses tab=top rather than adding a
// parallel sort branch in the API.
function serverTabFor(tab: Tab): "rising" | "new" | "top" {
  return tab === "leaderboard" ? "top" : tab;
}

export default function CaptionFeed({ comicId }: { comicId: string }) {
  const [tab, setTab] = useState<Tab>("rising");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [locked, setLocked] = useState(true);
  const [index, setIndex] = useState(0);

  async function load(activeTab: Tab) {
    const res = await fetch(`/api/captions?comicId=${comicId}&tab=${serverTabFor(activeTab)}`);
    const data = await res.json();
    setLocked(data.locked);
    setCaptions(data.captions ?? []);
    setIndex(0); // reset position on tab switch, per design
  }

  useEffect(() => {
    // Always ask the server — it's the sole source of truth for whether this
    // session has submitted or forfeited today's comic (see /api/captions).
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (locked) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-ink-muted text-sm p-8 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5">
        <Lock size={18} strokeWidth={2} className="text-ink-faint" />
        Submit a caption (or choose to browse) to see what others wrote.
      </div>
    );
  }

  const leaderboardEntries: LeaderboardEntry[] = captions.map((c, i) => ({
    rank: i + 1,
    winCount: c.wins,
    matchCount: c.matches,
    winRate: c.winRate,
    username: c.username,
    city: c.city,
    text: c.text,
    isYou: c.isYou,
  }));

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="inline-flex gap-1 p-1 bg-card rounded-full shadow-soft ring-1 ring-ink/5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                tab === id ? "bg-ink text-cream shadow-soft" : "text-ink-muted hover:bg-ink/5"
              }`}
            >
              <Icon size={13} strokeWidth={2.25} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {captions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center text-ink-muted text-sm p-8 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5">
          <PenLine size={18} strokeWidth={2} className="text-ink-faint" />
          No captions yet — be the first!
        </div>
      ) : tab === "leaderboard" ? (
        <>
          <p className="flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-teal-dark">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            Live standings
          </p>
          <Leaderboard results={leaderboardEntries} />
        </>
      ) : (
        <>
          <div className="bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5 p-5 flex items-center gap-2">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="p-1.5 rounded-full text-ink-muted hover:bg-ink/5 disabled:opacity-20 transition shrink-0"
              aria-label="Previous caption"
            >
              <ChevronLeft size={20} strokeWidth={2.25} />
            </button>

            <div className="flex-1 text-center space-y-2.5 min-w-0">
              <p className="text-lg leading-snug text-ink">"{captions[index].text}"</p>
              <p className="text-xs font-mono text-ink-muted">
                — {captions[index].username}
                {captions[index].city ? `, ${captions[index].city}` : ""}
              </p>
              {tab === "top" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-light text-teal-dark font-mono text-xs font-medium">
                  <Trophy size={12} strokeWidth={2.5} />
                  {captions[index].matches > 0
                    ? `${Math.round(captions[index].winRate * 100)}% win rate`
                    : "No matchups yet"}
                </span>
              )}
              {!captions[index].isYou && (
                <ReportButton key={captions[index].id} captionId={captions[index].id} />
              )}
            </div>

            <button
              onClick={() => setIndex((i) => Math.min(captions.length - 1, i + 1))}
              disabled={index === captions.length - 1}
              className="p-1.5 rounded-full text-ink-muted hover:bg-ink/5 disabled:opacity-20 transition shrink-0"
              aria-label="Next caption"
            >
              <ChevronRight size={20} strokeWidth={2.25} />
            </button>
          </div>

          <p className="text-center font-mono text-[11px] text-ink-faint">
            {index + 1} of {captions.length}
          </p>
        </>
      )}
    </div>
  );
}
