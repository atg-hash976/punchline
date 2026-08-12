"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <header className="text-center space-y-1">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark">
          Daily Caption Contest
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">Get in Touch</h1>
        <Link
          href="/"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← Today's contest
        </Link>
      </header>

      {sent ? (
        <div className="bg-card rounded-xl2 ring-1 ring-ink/10 p-6 text-center space-y-2">
          <CheckCircle2 size={28} strokeWidth={2} className="mx-auto text-forest" />
          <p className="font-display text-lg font-bold text-ink">Thanks for reaching out!</p>
          <p className="text-sm text-ink-muted">We'll get back to you soon.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted text-center">
            Illustrators: we're always looking for fresh comics for the daily contest. Tell us a
            bit about your work and how to reach you.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-2.5 p-5 bg-card rounded-xl2 ring-1 ring-ink/10"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
              maxLength={80}
              className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full px-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              required
              maxLength={120}
              className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-full px-4 py-2.5 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your work, a portfolio link, whatever's useful…"
              required
              maxLength={2000}
              rows={5}
              className="w-full text-sm font-mono text-blue-dark bg-card border-2 border-blue rounded-xl2 px-4 py-3 placeholder:text-blue-dark/50 placeholder:font-mono focus:outline-none focus:ring-2 focus:ring-blue/30 transition resize-none"
            />
            {error && <p className="text-coral-dark text-xs font-medium">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-white text-sm font-semibold hover:bg-forest-dark active:scale-95 transition disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2.25} />
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
