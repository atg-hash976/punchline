"use client";

import { PartyPopper, Share2 } from "lucide-react";

type Props = {
  caption: { username: string; city?: string; text: string };
  imageUrl: string;
  onClose: () => void;
  heading?: string;
  subheading?: string;
};

export default function ShareModal({
  caption,
  imageUrl,
  onClose,
  heading = "Thanks for your submission!",
  subheading = "Would you like to share it?",
}: Props) {
  const shareText = `"${caption.text}" — ${caption.username}${
    caption.city ? ` (${caption.city})` : ""
  }\n\nCaption this: `;

  async function handleShare() {
    // NOTE: for a real share-with-image flow, generate a composed image server-side
    // (caption + username + city stamped onto the comic) and share that file via
    // navigator.share({ files: [...] }) where supported. This is the text-only
    // fallback path; see README for the image-composition approach.
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: window.location.href });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      // Fallback: SMS deep link
      window.location.href = `sms:?&body=${encodeURIComponent(shareText + window.location.href)}`;
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl2 p-6 max-w-sm w-full space-y-4 text-center shadow-pop ring-1 ring-ink/5">
        <h2 className="font-display text-xl font-bold text-ink flex items-center justify-center gap-2">
          {heading}
          <PartyPopper size={20} className="text-teal" strokeWidth={2.25} />
        </h2>
        <p className="text-sm text-ink-muted">{subheading}</p>
        <img src={imageUrl} alt="" className="rounded-lg w-full ring-1 ring-ink/5" />
        <p className="italic text-ink">"{caption.text}"</p>
        <p className="text-xs font-mono text-ink-muted">
          — {caption.username}
          {caption.city ? `, ${caption.city}` : ""}
        </p>
        <div className="flex gap-2 justify-center pt-1">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest text-white text-sm font-semibold shadow-soft hover:bg-forest-dark active:scale-95 transition"
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
      </div>
    </div>
  );
}
