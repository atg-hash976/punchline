"use client";

import { useEffect, useState } from "react";
import { PartyPopper, Share2, Download } from "lucide-react";
import Confetti from "./Confetti";
import { generateShareCard } from "@/lib/shareCard";

type Props = {
  caption: { username: string; city?: string | null; text: string; isYou?: boolean };
  imageUrl: string;
  onClose: () => void;
  heading?: string;
  subheading?: string;
  celebrate?: boolean;
};

export default function ShareModal({
  caption,
  imageUrl,
  onClose,
  heading = "Thanks for your submission!",
  subheading = "Would you like to share it?",
  celebrate = true,
}: Props) {
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  // Composes the real share image (comic + caption overlaid) once on
  // mount — this IS the shareable artifact, not a link.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    generateShareCard({
      imageUrl,
      text: caption.text,
      username: caption.username,
      city: caption.city,
      isYou: caption.isYou,
    })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setCardBlob(blob);
        setCardUrl(objectUrl);
      })
      .catch(() => {
        /* preview just stays in its loading state; Share button stays disabled */
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    if (!cardBlob || !cardUrl) return;
    const file = new File([cardBlob], "punchline.png", { type: "image/png" });

    const canShareFiles =
      typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: "Punchline",
          text: `"${caption.text}" — ${caption.username}${caption.city ? ` (${caption.city})` : ""}`,
        });
      } catch {
        /* user cancelled the share sheet — no-op */
      }
      return;
    }

    // Desktop / browsers without file-sharing support: download the card
    // instead of the old dead SMS-only fallback.
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = "punchline.png";
    a.click();
    setDownloaded(true);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      {celebrate && <Confetti />}
      <div className="bg-card rounded-xl2 p-6 max-w-sm w-full space-y-4 text-center shadow-pop ring-1 ring-ink/5">
        <h2 className="font-display text-xl font-bold text-ink flex items-center justify-center gap-2">
          {heading}
          <PartyPopper size={20} className="text-blue" strokeWidth={2.25} />
        </h2>
        <p className="text-sm text-ink-muted">{subheading}</p>

        {cardUrl ? (
          <img src={cardUrl} alt="Your Punchline share card" className="rounded-lg w-full ring-1 ring-ink/5" />
        ) : (
          <div className="rounded-lg w-full aspect-[4/3] bg-sand animate-pulse" />
        )}

        <div className="flex gap-2 justify-center pt-1">
          <button
            onClick={handleShare}
            disabled={!cardBlob}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-white text-sm font-semibold shadow-soft hover:bg-forest-dark active:scale-95 transition disabled:opacity-50"
          >
            <Share2 size={14} strokeWidth={2.25} />
            Share
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-ink/5 text-ink text-sm font-semibold hover:bg-ink/10 active:scale-95 transition"
          >
            No thanks
          </button>
        </div>

        {downloaded && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Download size={12} strokeWidth={2.25} />
            Image downloaded — share it wherever you like!
          </p>
        )}
      </div>
    </div>
  );
}
