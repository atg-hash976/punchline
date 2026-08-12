// Repeats across the wordmark so it reads as a real logo mark, not just
// colored text — same four brand accents used for the tabs/CTA elsewhere,
// starting on red so "P" always leads with it. "Daily" restarts the same
// cycle from red too, rather than continuing "Punchline"'s index, so both
// words open on the same note.
const LOGO_COLORS = ["text-coral", "text-forest", "text-gold", "text-blue"];

function ColorCycleWord({ word }: { word: string }) {
  return (
    <>
      {word.split("").map((letter, i) => (
        <span key={i} className={LOGO_COLORS[i % LOGO_COLORS.length]}>
          {letter}
        </span>
      ))}
    </>
  );
}

export default function PunchlineLogo({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <ColorCycleWord word="Punchline" /> <ColorCycleWord word="Daily" />
    </span>
  );
}
