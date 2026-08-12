"use client";

import { useState, FormEvent } from "react";
import { Sparkles } from "lucide-react";

const MAX_CAPTION_LENGTH = 250;

type Props = {
  onGenerate: (caption: { username: string; city?: string; text: string }) => void;
};

/**
 * Write-a-caption-for-fun on an archived (already-frozen) comic. Deliberately
 * ephemeral: nothing here is persisted, moderated, or shown to anyone else —
 * it only ever exists to generate this one visitor's own share card. It is
 * NOT a contest entry; that window closed when the comic froze.
 */
export default function PracticeCaptionForm({ onGenerate }: Props) {
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !text.trim()) return;
    onGenerate({ username: username.trim(), city: city.trim() || undefined, text: text.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 p-5 bg-card rounded-xl2 ring-1 ring-ink/10"
    >
      <h3 className="font-display text-lg font-bold text-ink text-center">
        Write your own — just for fun
      </h3>
      <p className="text-xs text-ink-muted text-center">
        This day's contest is over, so this won't count toward the results above — but you can
        still caption it and share your take.
      </p>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
        maxLength={24}
        className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full px-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
      />
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City (optional)"
        maxLength={40}
        className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full px-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
      />
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your caption…"
          required
          maxLength={MAX_CAPTION_LENGTH}
          rows={3}
          className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-xl2 px-4 py-3 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition resize-none"
        />
        <span
          className={`absolute bottom-2 right-3 text-[10px] font-mono ${
            MAX_CAPTION_LENGTH - text.length <= 20 ? "text-coral-dark font-semibold" : "text-ink-faint"
          }`}
        >
          {text.length}/{MAX_CAPTION_LENGTH}
        </span>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-white text-sm font-semibold hover:bg-forest-dark active:scale-95 transition"
      >
        <Sparkles size={14} strokeWidth={2.25} />
        Generate & share
      </button>
    </form>
  );
}
