import Link from "next/link";

export default function AboutAiPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <header className="text-center space-y-1">
        <h1 className="font-display text-3xl font-bold text-ink">A Note on the Use of AI</h1>
        <Link
          href="/about"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← About
        </Link>
      </header>

      <div className="space-y-4 text-sm text-ink leading-relaxed">
        <p>
          Currently, the images for Punchline are generated with the assistance of AI. As a
          small, independent, free game, the resources to commission a hand-illustrated comic
          every single day aren't available to us yet.
        </p>
        <p>
          That said, one day — hopefully not too far off — every day's illustration will be
          hand-drawn by a credited artist. We're already open to submissions from interested
          artists, and as our audience grows, we'll be able to offer new artists a bigger and
          bigger stage.
        </p>
        <p>
          If you're an artist interested in having your work featured on Punchline, please{" "}
          <Link
            href="/contact"
            className="text-blue-dark underline decoration-blue-dark/40 underline-offset-2 hover:text-blue transition"
          >
            get in touch
          </Link>{" "}
          — we'd love to hear from you.
        </p>
      </div>
    </main>
  );
}
