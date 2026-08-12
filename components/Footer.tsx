import Link from "next/link";

export default function Footer() {
  return (
    <footer className="max-w-lg mx-auto px-4 pb-10 pt-2 flex flex-col items-center gap-2 text-xs text-ink-faint">
      <Link
        href="/about"
        className="underline decoration-ink-faint underline-offset-2 hover:text-ink-muted transition"
      >
        About
      </Link>
      <Link
        href="/terms"
        className="underline decoration-ink-faint underline-offset-2 hover:text-ink-muted transition"
      >
        Terms
      </Link>
      <Link
        href="/contact"
        className="underline decoration-ink-faint underline-offset-2 hover:text-ink-muted transition"
      >
        Are you an illustrator? Get in touch.
      </Link>
    </footer>
  );
}
