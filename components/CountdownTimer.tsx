"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { secondsRemaining } from "@/lib/timing";

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

  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-medium ${
          urgent ? "bg-coral-light text-coral-dark animate-pulse" : "bg-teal-light text-teal-dark"
        }`}
      >
        <Clock size={14} strokeWidth={2.25} />
        {remaining > 0
          ? `${minutes}:${seconds.toString().padStart(2, "0")} left to submit`
          : "Submission window closed"}
      </div>
    </div>
  );
}
