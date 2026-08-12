import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <header className="text-center space-y-1">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark">
          Daily Caption Contest
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">Terms</h1>
        <Link
          href="/"
          className="inline-block text-xs text-ink-muted underline decoration-ink-faint underline-offset-2 hover:text-ink transition"
        >
          ← Today's contest
        </Link>
      </header>

      <div className="space-y-5 text-sm text-ink leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-ink">How it works</h2>
          <p>
            A new comic is released once a day. Once you reveal it, you have a limited window
            (shown on the countdown ring) to submit one caption. You get one caption per comic —
            no do-overs, no editing after you submit.
          </p>
        </section>

        <section className="space-y-1.5 border-t border-ink/10 pt-5">
          <h2 className="font-display text-lg font-bold text-ink">How the winner is determined</h2>
          <p>
            We don't rank captions by raw vote count. After submitting, players are shown pairs of
            other captions and pick the funnier one — a head-to-head matchup, not a popularity
            count. Rankings are based on a{" "}
            <span className="font-semibold">Wilson score lower bound</span>, a statistical method
            that weighs both a caption's win rate and how many matchups it's actually been judged
            in. A caption that's won 9 of 10 matchups ranks above one that's won 1 of 1 — a single
            lucky win isn't enough to take the top spot.
          </p>
          <p>
            To keep this fair, matchups are weighted to favor captions that have been judged fewer
            times, so newer and lower-visibility captions still get enough head-to-head data to be
            ranked accurately, instead of only the already-popular ones getting shown.
          </p>
          <p>
            Standings go final once the day's contest freezes (shown in the archive). After that,
            the winner and final rankings for that day don't change.
          </p>
        </section>

        <section className="space-y-1.5 border-t border-ink/10 pt-5">
          <h2 className="font-display text-lg font-bold text-ink">Your captions</h2>
          <p>
            Captions are limited to 250 characters. All submissions become the property of
            Punchline and will not be acknowledged or returned.
          </p>
          <p>
            You keep the copyright in your caption. But by entering, you grant Punchline — and
            anyone we authorize — your irrevocable, perpetual permission and consent, without
            compensation or attribution, to (i) use, reproduce, print, publish, transmit,
            communicate to the public, distribute, sell, perform, adapt, enhance, or display your
            caption, and your username and city, for editorial, advertising, commercial, and
            publicity purposes, in any and all media now existing or later created, throughout the
            world — including, for example, posting daily winners on Punchline's social media
            accounts; (ii) do (or omit to do) any act with respect to your caption that would
            otherwise infringe your moral rights in it; and (iii) edit, adapt, and modify your
            caption.
          </p>
          <p>
            You represent and warrant that your caption is your own original work, that it has not
            been copied from anyone else, and that it does not violate the rights of any other
            person or entity.
          </p>
          <p>
            Except to the extent prohibited by law, Punchline excludes all conditions, warranties,
            and terms implied by statute, general law, or custom. By entering, you release and
            discharge Punchline, its judges, and anyone else involved in developing or
            administering the contest — along with their employees, agents, and representatives —
            from any and all liability arising out of or connected to the contest, including any
            legal claims, costs, losses, damages, demands, or actions of any kind.
          </p>
        </section>

        <section className="space-y-1.5 border-t border-ink/10 pt-5">
          <h2 className="font-display text-lg font-bold text-ink">Changes</h2>
          <p>
            This is a small, evolving project — these terms and the contest mechanics may change
            as we keep improving it.
          </p>
        </section>
      </div>
    </main>
  );
}
