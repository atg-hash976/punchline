"use client";

import { useMemo } from "react";

// Exactly the four tab/accent colors — confetti stays inside the palette
// already established, no new hues introduced.
const COLORS = ["#4A80D6", "#C45B4A", "#C99A3B", "#4A7C59"];
const PIECE_COUNT = 140;

/**
 * One-shot celebratory burst. Regenerates fresh randomized pieces on every
 * mount (via useMemo with no deps) — since it's only ever rendered
 * conditionally inside ShareModal, each real submission gets a fresh burst.
 */
export default function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        width: 5 + Math.random() * 6,
      })),
    []
  );

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.width * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
