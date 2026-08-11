"use client";

import { User, MapPin } from "lucide-react";

type Props = {
  username: string;
  city: string;
  onUsernameChange: (value: string) => void;
  onCityChange: (value: string) => void;
};

/**
 * Username + city, editable before the comic is revealed and the clock
 * starts — so those few seconds of typing don't eat into the caption
 * window. SubmitCaptionForm picks up wherever this leaves off.
 */
export default function PreFillForm({ username, city, onUsernameChange, onCityChange }: Props) {
  return (
    <div className="space-y-2.5 p-5 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5">
      <p className="text-xs text-ink-muted text-center">
        Fill in your name now — the clock starts once you reveal the comic.
      </p>
      <div className="relative">
        <User size={15} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-dark/60" />
        <input
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Username (required)"
          maxLength={24}
          className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full pl-10 pr-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
        />
      </div>
      <div className="relative">
        <MapPin size={15} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-dark/60" />
        <input
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City (optional)"
          maxLength={40}
          className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full pl-10 pr-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
        />
      </div>
    </div>
  );
}
