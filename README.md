# Daily Caption Contest — starter scaffold

This is a working starter implementing the core mechanics we designed:

- Blur-to-reveal comic that starts a **personal 10-minute submission window**, tracked
  server-side (`ComicOpen` table) so it can't be spoofed by a fake client timestamp.
- **Duplicate detection**: captions normalized (lowercase, punctuation stripped,
  whitespace collapsed) before comparing — `"Nice!!"` and `"nice"` collide.
- **Three-tier moderation**: slurs hard-blocked everywhere, mild profanity blocked in
  usernames only, and a heuristic gratuitous/spam filter (repetition + profanity
  density) for captions — catches `"FUCK FUCK FUCK"` while allowing `"Well this
  fuckin' sucks."`
- **Hide-until-you-submit-or-forfeit** caption visibility, enforced server-side.
- **Head-to-head voting**: right after submitting, a session is prompted to "help
  decide today's winner" — shown two other captions, taps the funnier one, the loser
  is replaced by a new random challenger, repeat until they choose to stop. Only
  sessions that submitted get to judge. Each vote is one `Matchup` row
  (winner/loser/judge).
- **Wilson score ranking** (`lib/ranking.ts`): captions are ranked by the 95%
  confidence lower bound of their win-rate, not raw win-rate — a caption that's
  9-for-10 outranks one that's 1-for-1, since one lucky win isn't strong evidence.
  Standard technique for "sort by rating with few votes" (see Evan Miller's "How Not
  To Sort By Average Rating"); the displayed `winRate` % is still the plain, honest
  number, only the *ranking order* uses the adjusted score.
- **Four tabs** — Rising (default), New, Top, Leaderboard — each with independent list
  state that resets to the front on tab switch, matching the swipe design. Top sorts by
  Wilson score (ties broken by match count); Rising uses net wins-minus-losses in the
  last 30 minutes, divided by time since posted — a trending/momentum signal,
  deliberately left as a simpler recency formula rather than Wilson-adjusted, since
  "hot right now" and "provably best" are different questions. **Leaderboard** is the
  same Wilson-score ranking as Top, just shown as a live, shifting podium + full ranked
  list (the `Leaderboard` component, shared with the frozen `ResultsReveal`) instead of
  one caption at a time — it's the pre-freeze preview of what results will look like.
- **Leaderboard freeze, wired up** (`lib/freeze.ts`, `GET /api/cron/freeze`) — runs
  automatically once daily via Vercel Cron (`vercel.json`), protected by a
  `CRON_SECRET` bearer token (fails closed — 500 if unset, 401 if wrong). Idempotent,
  so firing it extra times is harmless. `scripts/freeze-leaderboard.ts` still works for
  manual/local runs — same shared logic, just a CLI wrapper. Not tied to Vercel
  specifically: any scheduler that can send an `Authorization: Bearer <secret>` header
  on a GET request works (cron-job.org, GitHub Actions, a plain crontab + curl).
- **Results reveal** (`ResultsReveal`, `GET /api/comic/results`) — once a comic has a
  frozen snapshot, the main page shows a podium (top 3) + full ranked list instead of
  the live reveal/vote/browse flow, reading only from `LeaderboardSnapshot` so it can
  never shift after the reveal. Highlights your own caption ("YOU" badge) if it placed
  — no accounts needed, just the existing session cookie.
- **Landing hero** (`LandingHero`) — a genuinely fresh visitor (no `openedAt`, not
  unlocked — checked from server truth, not just "first render") sees yesterday's
  cartoon and winner (name, win record, win rate %) before anything else, then
  "Today's challenge is waiting... Play now!" with a primary CTA and a secondary
  "just browse" one. "Play now" simply reveals the normal blur-reveal flow below it;
  "just browse" reveals the comic *and* forfeits in the same action, so the submit
  form never appears — same one-way choice as forfeiting mid-game. Anyone who already
  engaged today skips straight past this on reload; it's a first-visit-only teaser,
  not a wall.
- **Archive** (`/archive`, `/archive/[comicId]`, `GET /api/comic/archive`) — past days
  (any comic with a frozen snapshot, excluding today's) are browsable any time, Wordle
  back-catalog style. Results are shown immediately with no unlock-gate — unlike the
  live day, a finished contest's captions aren't hidden from anyone. You can still
  write a caption on a past comic and generate a share card, but it's explicitly
  **not a contest entry**: `PracticeCaptionForm` never calls the API, isn't moderated,
  isn't persisted, and isn't shown to any other visitor — it only ever produces that
  one visitor's own share card, so none of the abuse-prevention machinery built for
  real submissions is needed for it.
- **Share flow** — thank-you modal with native share / SMS fallback.
- **Admin comic upload** — password-protected page at `/admin` to schedule tomorrow's
  comic (image + release/freeze times, entered in CT and DST-corrected).

## Running locally

Needs a local Postgres. On macOS:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb caption_contest
```

Then:

```bash
npm install
npm run db:migrate  # applies prisma/migrations/ to your local Postgres
npm run db:seed     # adds one sample comic that's live right now
npm run dev
```

Open http://localhost:3000 — you should see the sample comic ready to reveal.

`DATABASE_URL` in `.env` defaults to `postgresql://adam@localhost:5432/caption_contest`
— replace `adam` with your own Postgres role name if different (`psql -c '\du'` to check).
In production, point it at a hosted Postgres (Supabase, Neon, Vercel Postgres, etc.) and
run `npm run db:migrate:deploy` (`prisma migrate deploy` — applies committed migrations,
doesn't prompt or generate new ones) as part of your deploy step.

Set `ADMIN_PASSWORD` in `.env` (defaults to the placeholder `"changeme"`), then visit
http://localhost:3000/admin to upload and schedule comics.

`CRON_SECRET` is also set in `.env` (a real random value, already generated — this one
isn't meant to be memorized/typed like `ADMIN_PASSWORD`, only copy-pasted into whatever
scheduler calls `/api/cron/freeze`). Test it locally with:

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d'"' -f2)" http://localhost:3000/api/cron/freeze
```

## Things intentionally left as TODOs (discuss before going live)

1. ~~**Timezone handling for release/freeze (CT).**~~ Done — `freezeAt`/`releaseAt` are
   computed per-comic in CT at upload time (`lib/timezone.ts`, DST-correct via `Intl`),
   so the cron (`vercel.json`, `0 7 * * *` UTC) doesn't need to hit an exact instant —
   it just needs to run sometime after midnight CT, which 07:00 UTC comfortably covers
   in both DST and standard time. See `GET /api/cron/freeze`.

2. ~~**Comic upload workflow.**~~ Done — password-protected admin page at `/admin`
   (login at `/admin/login`). Set `ADMIN_PASSWORD` in `.env` before using it; the
   default `"changeme"` is a placeholder, not meant to ship. Release/freeze times are
   entered as CT wall-clock and converted with `lib/timezone.ts`, which reads the real
   America/Chicago tz data (via `Intl`) so DST is handled correctly rather than a
   hardcoded UTC offset. Image storage (`lib/storage.ts`) picks its backend from
   environment, not a flag: `BLOB_READ_WRITE_TOKEN` set → uploads go to Vercel Blob
   (survives serverless deploys); unset → local disk under `public/comics/` (dev only
   — there's no local Blob emulator, so this fallback is also how upload stays
   testable without a Vercel account). **To go live:** create a Blob store in your
   Vercel project's Storage tab — Vercel sets `BLOB_READ_WRITE_TOKEN` automatically for
   deployments linked to it, nothing to hand-configure. Images already on local disk
   from before this existed don't migrate themselves; re-upload them (or write a
   one-off script pushing `public/comics/*` through `put()`) if that matters to you.

3. ~~**Share image generation.**~~ Done — `lib/shareCard.ts` composes the full
   "comic + caption + username + city" image client-side via canvas (rounded card,
   brand-gradient frame, the rainbow Punchline wordmark, comic date), and shares that
   file via `navigator.share({ files: [...] })` where supported, falling back to a
   direct download on desktop.

4. ~~**Tier 1 slur list.**~~ Done — `lib/moderation.ts` now uses the
   [`profanease`](https://www.npmjs.com/package/profanease) npm package's `SLUR`
   category specifically (169 English entries), not its general
   profanity/insult/sexual categories — those would conflict with Tier 2
   intentionally allowing mild profanity in captions. Verified before shipping: zero
   false positives against every username/city already in this app, and confirmed
   catching real entries pulled from its own list. A maintained dependency, not a
   static copy-pasted array, so `npm update` can pick up list improvements over time.
   Still genuinely worth pairing with a moderation API (Perspective API / OpenAI
   moderation endpoint) for what a wordlist inherently misses (context, new coinages,
   non-English slurs beyond `profanease`'s language packs), and #5 (report/flag
   button) remains the human backstop for both.

5. ~~**Report/flag button.**~~ Done — a small flag icon (`ReportButton`) sits next to
   every caption in the browsing feed and the head-to-head voting arena (never on
   your own caption). No unlock-gate, unlike voting: anyone who can see a caption can
   flag it. One report per (caption, session) — `@@unique([captionId, sessionId])` in
   the schema makes repeat taps a no-op rather than inflating the count. This closes
   the loop all the way to `/admin`, which now has a "Reported captions" queue
   (grouped by caption, most-reported first) with **Dismiss** (clears the reports,
   caption stays) and **Remove caption** (deletes it — blocked if it's already part of
   a frozen `LeaderboardSnapshot`, since that record is meant to be permanent).

6. ~~**Production database.**~~ Done — `prisma/schema.prisma` uses `postgresql`, with a
   real migration history in `prisma/migrations/` (`npm run db:migrate` locally,
   `npm run db:migrate:deploy` in production — see "Running locally" above). Local dev
   now needs Postgres running (via Homebrew), no longer zero-setup SQLite. Comic image
   storage (`public/comics/`) still won't survive a serverless deploy, though — that's
   the other half of #2, still open.

7. ~~**Cron wiring.**~~ Done — `GET /api/cron/freeze`, secured with `CRON_SECRET`,
   scheduled via `vercel.json`. "Releasing" a comic never needed a cron in the first
   place: `GET /api/comic/today` already treats a comic as live the instant `releaseAt`
   passes, purely by reading the timestamp — there's no separate action to trigger.
   Deploying somewhere other than Vercel? Point any scheduler at `/api/cron/freeze`
   with an `Authorization: Bearer <CRON_SECRET>` header instead, and drop the
   `vercel.json` file (harmless to leave, but unused off Vercel).

8. ~~**Rate limiting backstop.**~~ Done — `lib/rateLimit.ts` adds an IP-keyed backstop
   (Postgres-backed, no new service to run) on top of the session-cookie limits
   everywhere abuse actually matters: submitting (10/IP/day), voting (40/IP/day, on
   top of `MAX_VOTES_PER_DAY`'s 10/session), hearting (60/IP/hour), reporting
   (20/IP/day), the contact form (5/IP/day), and — the one that actually guards
   something sensitive — admin login (5/IP/15min, brute-force protection on the one
   password gate to `/admin`). Old rows are purged daily piggybacking on the existing
   freeze cron, so nothing new needs its own schedule.

9. **Matchup pairing is uniform-random.** `GET /api/captions/matchup` shuffles all
   eligible captions and takes the front, so early captions and late captions get
   roughly equal exposure over time, but there's no explicit "prioritize captions
   with few matchups yet" weighting. Fine at low volume; revisit if a comic gets
   hundreds of captions and some never get judged.
