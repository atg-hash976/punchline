import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <header className="text-center space-y-1">
        <h1 className="font-display text-3xl font-bold text-ink">About Punchline</h1>
        <Link
          href="/"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← Today's contest
        </Link>
      </header>

      <div className="space-y-4 text-sm text-ink leading-relaxed">
        <p>
          Punchline is a test of quick, creative thinking. Show the world your sense of humor
          while giving your brain a quick workout — three minutes, that's all you've got to
          deliver something hilarious. And the people decide.
        </p>
        <p>
          Punchline is completely free, requires no account or login, and will gradually build a
          huge backlog of playable, shareable comics.
        </p>
      </div>

      <p className="text-center border-t border-ink/10 pt-5">
        <Link
          href="/about/ai"
          className="text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          A note on the use of AI →
        </Link>
      </p>
    </main>
  );
}
