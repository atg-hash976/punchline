"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

type Props = {
  captionId: string;
  className?: string;
};

/**
 * Render with `key={captionId}` at the call site — this component's
 * "reported" state is local/optimistic (not fetched from the server), so
 * without a key React would reuse the same instance across different
 * captions (e.g. after a swipe) and show a stale "Reported" state.
 */
export default function ReportButton({ captionId, className = "" }: Props) {
  const [reported, setReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleReport(e: React.MouseEvent) {
    e.stopPropagation(); // safe to call even when not nested in another clickable
    if (reported || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/captions/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId }),
      });
      setReported(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleReport}
      disabled={submitting || reported}
      className={`inline-flex items-center gap-1 text-xs transition disabled:cursor-default ${
        reported ? "text-coral" : "text-ink-faint hover:text-coral"
      } ${className}`}
      aria-label={reported ? "Reported" : "Report this caption"}
    >
      <Flag size={12} strokeWidth={2.25} fill={reported ? "currentColor" : "none"} />
      {reported ? "Reported" : "Report"}
    </button>
  );
}
