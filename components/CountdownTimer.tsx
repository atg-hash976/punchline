"use client";

import { useEffect, useState } from "react";
import { secondsRemaining, SUBMISSION_WINDOW_MINUTES } from "@/lib/timing";

const TOTAL_SECONDS = SUBMISSION_WINDOW_MINUTES * 60;
const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownTimer({ openedAt }: { openedAt: string }) {
  const [remaining, setRemaining] = useState(() => secondsRemaining(new Date(openedAt)));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(secondsRemaining(new Date(openedAt)));
    }, 1000);
    return () => clearInterval(interval);
  }, [openedAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 60;
  const fraction = Math.max(0, Math.min(1, remaining / TOTAL_SECONDS));
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-medium ${
          urgent ? "bg-coral-light text-coral-dark animate-pulse" : "bg-blue-light text-blue-dark"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" className="-rotate-90 shrink-0">
          <circle cx="10" cy="10" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <circle
            cx="10"
            cy="10"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        {remaining > 0
          ? `${minutes}:${seconds.toString().padStart(2, "0")} left to submit`
          : "Submission window closed"}
      </div>
    </div>
  );
}
