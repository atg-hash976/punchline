-- Enables Postgres Row Level Security on every table, with no policies
-- defined on any of them.
--
-- Why this is safe and doesn't change app behavior: this app's server
-- (Prisma, via the table-owning `postgres` role from DATABASE_URL) owns
-- every table it created and always bypasses RLS, regardless of whether
-- it's enabled -- Postgres exempts table owners/superusers from RLS by
-- design. So this has zero effect on how the app reads or writes data.
--
-- What it actually fixes: Supabase (and any other Postgres host offering
-- a similar public REST/GraphQL layer) auto-exposes every public-schema
-- table through its own API using restricted roles (e.g. `anon`,
-- `authenticated`) that ARE subject to RLS. This app never uses that API
-- or those roles -- all access goes through this app's own server code --
-- but leaving RLS off on a hosted table is flagged (rightly) as a
-- standing risk regardless of current usage. With RLS on and zero
-- policies, those roles get nothing back by default: a clean deny-all.
ALTER TABLE "Comic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComicOpen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Caption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Matchup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaderboardSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Heart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IllustratorInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitHit" ENABLE ROW LEVEL SECURITY;
