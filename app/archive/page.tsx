"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

type ArchiveEntry = {
  id: string;
  imageUrl: string;
  releaseAt: string;
  champion: { username: string; city?: string | null; text: string } | null;
};

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "long",
  }).format(new Date(iso));
}

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/comic/archive")
      .then((r) => r.json())
      .then((d) => setEntries(d.archive ?? []));
  }, []);

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
      <header className="text-center space-y-1">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark">
          Daily Caption Contest
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">Past Days</h1>
        <Link
          href="/"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← Today's contest
        </Link>
      </header>

      {entries === null ? (
        <p className="text-center text-ink-muted text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-ink-muted text-sm">
          No past days yet — check back once today's contest wraps up!
        </p>
      ) : (
        <ul className="border-t border-ink/10 divide-y divide-ink/10">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/archive/${entry.id}`}
                className="flex items-center gap-3 p-3 hover:bg-ink/5 transition"
              >
                <img
                  src={entry.imageUrl}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg bg-neutral-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-ink-faint">{dateLabel(entry.releaseAt)}</p>
                  {entry.champion ? (
                    <>
                      <p className="text-sm text-ink truncate flex items-center gap-1">
                        <Trophy size={12} strokeWidth={2.5} className="text-gold-dark shrink-0" />"
                        {entry.champion.text}"
                      </p>
                      <p className="text-xs font-mono text-ink-muted truncate">
                        — {entry.champion.username}
                        {entry.champion.city ? `, ${entry.champion.city}` : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">No captions that day</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
