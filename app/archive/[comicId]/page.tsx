"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResultsReveal from "@/components/ResultsReveal";
import PracticeCaptionForm from "@/components/PracticeCaptionForm";
import ShareModal from "@/components/ShareModal";
import { dateLabelCT } from "@/lib/timezone";

type Comic = { imageUrl: string; releaseAt: string; artistName?: string | null };
type Result = {
  id: string;
  rank: number;
  winCount: number;
  matchCount: number;
  winRate: number;
  username: string;
  city?: string | null;
  text: string;
  isYou: boolean;
  heartCount: number;
};
type PracticeCaption = { username: string; city?: string; text: string };

export default function ArchiveComicPage({ params }: { params: { comicId: string } }) {
  const [status, setStatus] = useState<"loading" | "not-found" | "not-frozen" | "ready">("loading");
  const [comic, setComic] = useState<Comic | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [practiceCaption, setPracticeCaption] = useState<PracticeCaption | null>(null);

  useEffect(() => {
    fetch(`/api/comic/results?comicId=${params.comicId}`)
      .then(async (r) => {
        if (r.status === 404) {
          setStatus("not-found");
          return;
        }
        const d = await r.json();
        setComic(d.comic ?? null);
        if (d.frozen) {
          setResults(d.results);
          setStatus("ready");
        } else {
          setStatus("not-frozen");
        }
      });
  }, [params.comicId]);

  if (status === "loading") {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 text-center text-ink-muted text-sm">Loading…</main>
    );
  }

  if (status === "not-found") {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-ink-muted text-sm">That day doesn't exist.</p>
        <Link href="/archive" className="text-xs underline decoration-ink-faint underline-offset-2">
          ← Back to past days
        </Link>
      </main>
    );
  }

  if (status === "not-frozen") {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 text-center space-y-3">
        <p className="text-ink-muted text-sm">
          This day's contest isn't finished yet — check back once it's over.
        </p>
        <Link href="/" className="text-xs underline decoration-ink-faint underline-offset-2">
          ← Go to today's contest
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
      <header className="text-center space-y-1">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark">
          Daily Caption Contest
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">
          {comic ? dateLabelCT(comic.releaseAt) : ""}
        </h1>
        <Link
          href="/archive"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← Past days
        </Link>
      </header>

      <ResultsReveal
        imageUrl={comic!.imageUrl}
        results={results}
        eyebrow="Final results"
        title="That Day's Champion"
      />

      <PracticeCaptionForm onGenerate={setPracticeCaption} />

      {practiceCaption && (
        <ShareModal
          caption={{ ...practiceCaption, isYou: true }}
          imageUrl={comic!.imageUrl}
          onClose={() => setPracticeCaption(null)}
          heading="Nice one!"
          subheading="Want to share your take?"
          celebrate={false}
        />
      )}
    </main>
  );
}
