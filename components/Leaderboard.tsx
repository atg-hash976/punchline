"use client";

import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  winCount: number;
  matchCount: number;
  winRate: number;
  username: string;
  city?: string | null;
  text: string;
  isYou: boolean;
};

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32 };

function YouBadge() {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-light text-blue-dark text-[10px] font-semibold align-middle">
      YOU
    </span>
  );
}

/**
 * Podium (top 3) + full ranked list. Pure presentational — used both for the
 * live, shifting leaderboard (CaptionFeed's "Leaderboard" tab, ranked the
 * same way as Top) and the frozen, final one (ResultsReveal), so the two
 * views share one visual language and only differ in the data they're fed.
 *
 * Rows are keyed by caption id (not rank) and animated with framer-motion's
 * `layout`, so when the live leaderboard polls and standings shift, rows
 * visibly slide to their new position instead of just snapping — that's the
 * "results" most players actually see, since few come back for the frozen
 * end-of-day reveal.
 */
export default function Leaderboard({ results }: { results: LeaderboardEntry[] }) {
  const [first, second, third, ...rest] = results;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {first && (
          <motion.div
            key={first.id}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={SPRING}
            className="relative bg-card rounded-xl2 shadow-card ring-2 ring-gold/50 p-5 pt-6 text-center space-y-2"
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center shadow-soft">
              <Trophy size={16} strokeWidth={2.5} />
            </div>
            <p className="text-lg leading-snug text-ink">"{first.text}"</p>
            <p className="text-xs font-mono text-ink-muted">
              — {first.username}
              {first.city ? `, ${first.city}` : ""}
              {first.isYou && <YouBadge />}
            </p>
            <p className="font-mono text-xs text-ink-faint">
              {first.winCount}-{first.matchCount - first.winCount} · {Math.round(first.winRate * 100)}%
              win rate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {(second || third) && (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {[second, third].map(
              (r, i) =>
                r && (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={SPRING}
                    className="bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5 p-4 text-center space-y-1.5"
                  >
                    <div
                      className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono ${
                        i === 0 ? "bg-ink-muted" : "bg-coral"
                      }`}
                    >
                      {r.rank}
                    </div>
                    <p className="text-sm leading-snug text-ink">"{r.text}"</p>
                    <p className="text-xs font-mono text-ink-muted">
                      — {r.username}
                      {r.city ? `, ${r.city}` : ""}
                    </p>
                    {r.isYou && <YouBadge />}
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
      )}

      {rest.length > 0 && (
        <div className="bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5 divide-y divide-ink/5 overflow-hidden">
          <AnimatePresence initial={false}>
            {rest.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                className="flex items-center gap-3 p-3"
              >
                <span className="font-mono text-xs text-ink-faint w-5 text-center shrink-0">
                  {r.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">"{r.text}"</p>
                  <p className="text-xs font-mono text-ink-muted truncate">
                    — {r.username}
                    {r.city ? `, ${r.city}` : ""}
                    {r.isYou && <span className="ml-1.5 text-blue-dark font-semibold">· YOU</span>}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-faint shrink-0">
                  {Math.round(r.winRate * 100)}%
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
