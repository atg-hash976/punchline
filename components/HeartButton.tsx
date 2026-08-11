"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

type Props = {
  captionId: string;
  initialHearted: boolean;
  initialCount: number;
  className?: string;
};

/**
 * A "like" — purely a social signal, entirely separate from head-to-head
 * voting and never factored into ranking. Render with `key={captionId}` at
 * the call site so React remounts (and re-seeds initial* from fresh props)
 * across different captions instead of reusing state from the last one.
 */
export default function HeartButton({ captionId, initialHearted, initialCount, className = "" }: Props) {
  const [hearted, setHearted] = useState(initialHearted);
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation(); // safe to call even when not nested in another clickable
    if (submitting) return;
    setSubmitting(true);
    const next = !hearted;
    setHearted(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await fetch("/api/captions/heart", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId }),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={submitting}
      className={`inline-flex items-center gap-1 text-xs transition disabled:cursor-default ${
        hearted ? "text-coral" : "text-ink-faint hover:text-coral"
      } ${className}`}
      aria-label={hearted ? "Unlike this caption" : "Like this caption"}
      title={hearted ? "Click to unlike" : "Like this caption"}
    >
      <Heart size={13} strokeWidth={2.25} fill={hearted ? "currentColor" : "none"} />
      {count > 0 ? count : ""}
    </button>
  );
}
