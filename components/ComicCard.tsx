"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SUBMISSION_WINDOW_MINUTES } from "@/lib/timing";

type Props = {
  comicId: string;
  imageUrl: string;
  colorImageUrl?: string | null;
  showColor: boolean;
  initialOpenedAt?: string | null;
  onOpened: (openedAt: string) => void;
};

// Exported so callers (e.g. the submit flow deciding when to show the share
// card) can wait for this exact animation to finish instead of guessing.
export const COLOR_REVEAL_MS = 1600;

const SWEEP_TRANSITION = { duration: COLOR_REVEAL_MS / 1000, ease: [0.65, 0, 0.35, 1] as const };

export default function ComicCard({
  comicId,
  imageUrl,
  colorImageUrl,
  showColor,
  initialOpenedAt,
  onOpened,
}: Props) {
  const [revealed, setRevealed] = useState(Boolean(initialOpenedAt));
  const [loading, setLoading] = useState(false);
  // A one-shot flash overlay for the moment of reveal — self-clears once its
  // exit animation finishes, so it never lingers or replays on re-renders.
  const [flashing, setFlashing] = useState(false);
  // Captured once at mount: if the comic was ALREADY color (a reload after
  // an earlier submission), skip the wipe entirely and just show it — the
  // animated sweep is reserved for the actual moment of submitting.
  const [wasAlreadyColor] = useState(showColor);

  async function handleReveal() {
    setLoading(true);
    try {
      const res = await fetch("/api/comic/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId }),
      });
      const data = await res.json();
      setRevealed(true);
      setFlashing(true);
      onOpened(data.openedAt);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-xl2 overflow-hidden shadow-card bg-card ring-1 ring-ink/5">
      <img
        src={imageUrl}
        alt="Today's comic"
        className={`w-full transition-all duration-700 ease-out ${revealed ? "" : "blur-2xl scale-105"}`}
      />

      {colorImageUrl && showColor && (
        wasAlreadyColor ? (
          <img src={colorImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            {/* The color reveal itself — a clean left-to-right wipe, the
                app's signature moment for actually submitting a caption. */}
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={SWEEP_TRANSITION}
            >
              <img src={colorImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </motion.div>
            {/* A soft brand-palette sheen sweeping in lockstep with the wipe. */}
            <motion.div
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent, rgba(74,128,214,0.55), rgba(74,124,89,0.55), rgba(201,154,59,0.55), rgba(196,91,74,0.55), transparent)",
                mixBlendMode: "overlay",
                filter: "blur(10px)",
              }}
              initial={{ left: "-40%" }}
              animate={{ left: "105%" }}
              transition={SWEEP_TRANSITION}
            />
          </>
        )
      )}

      <AnimatePresence>
        {!revealed && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center bg-ink/25 p-6"
          >
            <button
              onClick={handleReveal}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-card text-ink text-sm font-semibold shadow-pop hover:scale-105 active:scale-95 transition disabled:opacity-60"
            >
              <Sparkles size={16} className="text-blue shrink-0" strokeWidth={2.25} />
              {loading ? "Revealing…" : `Reveal comic — ${SUBMISSION_WINDOW_MINUTES} min to caption it`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flashing && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setFlashing(false)}
            className="absolute inset-0 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
