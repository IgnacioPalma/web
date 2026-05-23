# Supabase — Carabineros scraper

Mirrors the public Carabineros LeyStop API into our own Postgres so we can serve a stable, queryable API on top of it.

## Layout

- `migrations/` — schema (weeks, comunas, comuna_weekly_stats, comuna_weekly_crime_records) + seed for Copiapó.
- `functions/scrape-carabineros/` — Deno Edge Function. HTTP POST entry point.
- `cron/schedule.sql` — one-off SQL to register the weekly pg_cron job in production.

## Local dev

```bash
supabase start          # boots Postgres + Studio + Edge Runtime
supabase db reset       # applies all migrations + seeds Copiapó
```

Create `supabase/.env.local` (gitignored) with:

```
SCRAPER_TOKEN=dev-token
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=<from `supabase status` output>
```

Serve the function:

```bash
supabase functions serve scrape-carabineros --env-file supabase/.env.local
```

Trigger a run. The `Authorization: Bearer …` header is required by the Supabase API gateway (Kong) even though the function does its own auth via `x-scraper-token`. Use the local `ANON_KEY` from `supabase status -o env`:

```bash
ANON=$(supabase status -o env | awk -F= '/^ANON_KEY=/ {gsub(/"/, "", $2); print $2}')

# latest week only
curl -X POST "http://localhost:54321/functions/v1/scrape-carabineros?mode=latest" \
  -H "Authorization: Bearer $ANON" \
  -H "x-scraper-token: dev-token"

# full backfill (~40s for one comuna across 179 weeks)
curl -X POST "http://localhost:54321/functions/v1/scrape-carabineros?mode=backfill" \
  -H "Authorization: Bearer $ANON" \
  -H "x-scraper-token: dev-token"
```

## Production deploy

1. Link the project: `supabase link --project-ref <project-ref>`.
2. Push schema: `supabase db push`.
3. Set the function secret: `supabase secrets set SCRAPER_TOKEN=<long-random-string>`.
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
4. Deploy the function: `supabase functions deploy scrape-carabineros`.
5. Enable `pg_cron` and `pg_net` in Dashboard → Database → Extensions.
6. Edit `cron/schedule.sql` (replace the three `@@PLACEHOLDERS@@`) and run it once in the SQL Editor.
7. Smoke-test: trigger `net.http_post(...)` manually or wait for Monday 12:00 UTC, then check
   `select * from cron.job_run_details order by start_time desc limit 1;`
   and
   `select count(*) from comuna_weekly_stats;`.

## Adding more comunas

```sql
insert into comunas (cut, nombre, region) values
  ('13120', 'Ñuñoa', 'Metropolitana de Santiago');
```

Then either wait for the next weekly run (latest week only) or trigger a backfill manually to fill historical weeks for the new comuna.
