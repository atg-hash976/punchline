"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trophy, Share2 } from "lucide-react";
import HeartButton from "./HeartButton";
import ShareModal from "./ShareModal";

// Same brand-gradient recipe as the share card (lib/shareCard.ts) and the
// color-reveal sheen — blue → forest → gold → coral, corner to corner.
const BRAND_GRADIENT = "linear-gradient(135deg,#4A80D6,#4A7C59 33%,#C99A3B 66%,#C45B4A)";

type OwnCaption = {
  id: string;
  username: string;
  city?: string | null;
  text: string;
  wins: number;
  matches: number;
  winRate: number;
  heartCount: number;
  isHearted: boolean;
};

/**
 * A session's own submission, pinned right below the comic whenever they
 * return to browse — not just a one-time post-submit popup. Reuses the same
 * /api/captions payload the feed already fetches (filtered to `isYou`)
 * rather than adding a parallel endpoint.
 */
export default function OwnCaptionCard({
  comicId,
  shareImageUrl,
  comicDate,
}: {
  comicId: string;
  shareImageUrl: string;
  comicDate: string;
}) {
  const [caption, setCaption] = useState<OwnCaption | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/captions?comicId=${comicId}&tab=top`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const mine = (d.captions ?? []).find((c: { isYou: boolean }) => c.isYou);
        setCaption(mine ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [comicId]);

  if (!caption) return null;

  return (
    <div className="rounded-xl2 p-[3px]" style={{ background: BRAND_GRADIENT }}>
      <div className="relative overflow-hidden rounded-[calc(1.25rem-3px)] bg-cream px-5 py-4 text-center space-y-2">
        {/* Faint decorative quote — the same echo as the share card's, so the
            two visually rhyme as one continuous piece. */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -top-2 left-1 font-display italic text-blue/10 text-[80px] leading-none"
        >
          &ldquo;
        </span>

        <p className="relative flex items-center justify-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-blue-dark">
          <Sparkles size={11} strokeWidth={2.5} />
          Your Punchline
        </p>

        <p className="relative font-display italic text-base leading-snug text-ink">"{caption.text}"</p>
        <p className="relative text-[11px] font-mono text-ink-muted">
          — {caption.username}
          {caption.city ? `, ${caption.city}` : ""}
          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue text-white font-mono text-[9px] font-bold align-middle">
            You
          </span>
        </p>

        <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card ring-1 ring-gold/30 text-gold-dark font-mono text-[11px] font-medium">
          <Trophy size={11} strokeWidth={2.5} />
          {caption.matches > 0 ? (
            <span>
              {caption.wins}-{caption.matches - caption.wins} · {Math.round(caption.winRate * 100)}% win rate
            </span>
          ) : (
            <span>No matchups yet</span>
          )}
        </div>

        <div className="relative flex items-center justify-center gap-3">
          <HeartButton
            key={`heart-${caption.id}`}
            captionId={caption.id}
            initialHearted={caption.isHearted}
            initialCount={caption.heartCount}
          />
          <button
            onClick={() => setSharing(true)}
            className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-blue transition"
            aria-label="Share your caption"
            title="Share your caption"
          >
            <Share2 size={13} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {sharing && (
        <ShareModal
          caption={{ username: caption.username, city: caption.city, text: caption.text, isYou: true }}
          imageUrl={shareImageUrl}
          comicDate={comicDate}
          heading="Your Daily Punchline"
          subheading={comicDate}
          celebrate={false}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
