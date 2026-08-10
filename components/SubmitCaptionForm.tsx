"use client";

import { useState } from "react";
import { User, MapPin, MessageSquareText } from "lucide-react";

type Props = {
  comicId: string;
  windowExpired: boolean;
  onSubmitted: (caption: { username: string; city?: string; text: string }) => void;
  onForfeit: () => void;
};

export default function SubmitCaptionForm({ comicId, windowExpired, onSubmitted, onForfeit }: Props) {
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId, username, city, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSubmitted({ username, city, text });
    } finally {
      setSubmitting(false);
    }
  }

  if (windowExpired) {
    return (
      <div className="text-center space-y-3 p-5 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5">
        <p className="text-sm text-ink-muted">
          Your 10 minutes are up! You can still browse today's top captions.
        </p>
        <button
          onClick={onForfeit}
          className="px-5 py-2.5 rounded-full bg-ink text-cream text-sm font-semibold hover:opacity-90 active:scale-95 transition"
        >
          See what everyone wrote
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 p-5 bg-card rounded-xl2 shadow-soft ring-1 ring-ink/5"
    >
      <div className="relative">
        <User size={15} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-dark/60" />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (required)"
          required
          maxLength={24}
          className="w-full text-sm font-mono text-blue-dark bg-sand rounded-full pl-10 pr-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/40 transition"
        />
      </div>
      <div className="relative">
        <MapPin size={15} strokeWidth={2.25} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-dark/60" />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (optional)"
          maxLength={40}
          className="w-full text-sm font-mono text-blue-dark bg-sand rounded-full pl-10 pr-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/40 transition"
        />
      </div>
      <div className="relative">
        <MessageSquareText size={15} strokeWidth={2.25} className="absolute left-4 top-3.5 text-blue-dark/60" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your caption…"
          required
          maxLength={200}
          rows={3}
          className="w-full text-sm font-mono text-blue-dark bg-sand rounded-xl2 pl-10 pr-4 py-3 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/40 transition resize-none"
        />
      </div>
      {error && <p className="text-coral-dark text-xs font-medium">{error}</p>}
      <div className="flex justify-between items-center pt-1">
        <button
          type="button"
          onClick={onForfeit}
          className="text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          Just want to browse instead?
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-full bg-forest text-white text-sm font-semibold shadow-soft hover:bg-forest-dark active:scale-95 transition disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit caption"}
        </button>
      </div>
    </form>
  );
}
