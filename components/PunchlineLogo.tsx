// Repeats across the wordmark so it reads as a real logo mark, not just
// colored text — same four brand accents used for the tabs/CTA elsewhere,
// starting on red so "P" always leads with it.
const LOGO_COLORS = ["text-coral", "text-forest", "text-gold", "text-blue"];

export default function PunchlineLogo({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      {"Punchline".split("").map((letter, i) => (
        <span key={i} className={LOGO_COLORS[i % LOGO_COLORS.length]}>
          {letter}
        </span>
      ))}
    </span>
  );
}
