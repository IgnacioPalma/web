-- One-off setup for weekly Carabineros scrape.
-- Run this ONCE on the hosted Supabase project (SQL Editor or psql).
-- Not a migration: pg_cron/pg_net aren't part of local `supabase start`,
-- and the SQL embeds secrets that shouldn't live in version control.
--
-- Prerequisites (Dashboard → Database → Extensions):
--   - enable `pg_cron`
--   - enable `pg_net`
--
-- Replace the three @@PLACEHOLDERS@@ before running:
--   @@PROJECT_REF@@      e.g. xyyttkgpaszauopxyipb
--   @@SCRAPER_TOKEN@@    same value set via `supabase secrets set SCRAPER_TOKEN=...`
--   @@SERVICE_ROLE_KEY@@ Project Settings → API → service_role key

select cron.schedule(
  'scrape-carabineros-weekly',
  '0 12 * * 1',  -- 12:00 UTC Mon = 09:00 Santiago (CLT, UTC-3)
  $$
    select net.http_post(
      url     := 'https://@@PROJECT_REF@@.supabase.co/functions/v1/scrape-carabineros?mode=latest',
      headers := jsonb_build_object(
        'x-scraper-token', '@@SCRAPER_TOKEN@@',
        'Authorization',   'Bearer @@SERVICE_ROLE_KEY@@',
        'Content-Type',    'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- To inspect / manage later:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 5;
--   select * from net._http_response order by created desc limit 5;
--   select cron.unschedule('scrape-carabineros-weekly');
