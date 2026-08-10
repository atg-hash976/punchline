"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SUBMISSION_WINDOW_MINUTES } from "@/lib/timing";

type Props = {
  comicId: string;
  imageUrl: string;
  initialOpenedAt?: string | null;
  onOpened: (openedAt: string) => void;
};

export default function ComicCard({ comicId, imageUrl, initialOpenedAt, onOpened }: Props) {
  const [revealed, setRevealed] = useState(Boolean(initialOpenedAt));
  const [loading, setLoading] = useState(false);

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
        className={`w-full transition-all duration-700 ${revealed ? "" : "blur-2xl scale-105"}`}
      />
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/25 p-6">
          <button
            onClick={handleReveal}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-card text-ink text-sm font-semibold shadow-pop hover:scale-105 active:scale-95 transition disabled:opacity-60"
          >
            <Sparkles size={16} className="text-teal shrink-0" strokeWidth={2.25} />
            {loading ? "Revealing…" : `Reveal comic — ${SUBMISSION_WINDOW_MINUTES} min to caption it`}
          </button>
        </div>
      )}
    </div>
  );
}
