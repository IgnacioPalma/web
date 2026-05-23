import { fetchComunaStats, fetchWeeks } from "./carabineros.ts";
import {
  createServiceClient,
  latestWeekId,
  listActiveComunas,
  listAllWeekIds,
  listScrapedWeekIds,
  upsertComunaWeeklyStats,
  upsertCrimeRecords,
  upsertWeeks,
} from "./db.ts";

const POLITE_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Mode = "latest" | "backfill";

interface RunResult {
  mode: Mode;
  weeks_synced: number;
  comunas_processed: number;
  stats_upserted: number;
  records_upserted: number;
  errors: Array<{ comuna: string; week: number; message: string }>;
}

async function run(mode: Mode): Promise<RunResult> {
  const db = createServiceClient();
  const result: RunResult = {
    mode,
    weeks_synced: 0,
    comunas_processed: 0,
    stats_upserted: 0,
    records_upserted: 0,
    errors: [],
  };

  const upstreamWeeks = await fetchWeeks();
  result.weeks_synced = await upsertWeeks(db, upstreamWeeks);

  const comunas = await listActiveComunas(db);
  result.comunas_processed = comunas.length;

  for (const comuna of comunas) {
    let weekIds: number[];
    if (mode === "latest") {
      weekIds = [await latestWeekId(db)];
    } else {
      const all = await listAllWeekIds(db);
      const done = await listScrapedWeekIds(db, comuna.cut);
      weekIds = all.filter((id) => !done.has(id));
    }

    for (const weekId of weekIds) {
      try {
        const payload = await fetchComunaStats(weekId, comuna.cut);
        await upsertComunaWeeklyStats(db, comuna.cut, weekId, payload);
        const n = await upsertCrimeRecords(
          db,
          comuna.cut,
          weekId,
          payload.registros ?? [],
        );
        result.stats_upserted += 1;
        result.records_upserted += n;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[${comuna.cut} w${weekId}] ${message}`);
        result.errors.push({ comuna: comuna.cut, week: weekId, message });
      }
      if (mode === "backfill") await sleep(POLITE_DELAY_MS);
    }
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const expected = Deno.env.get("SCRAPER_TOKEN");
  if (!expected || req.headers.get("x-scraper-token") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const mode: Mode =
    new URL(req.url).searchParams.get("mode") === "backfill"
      ? "backfill"
      : "latest";

  try {
    const result = await run(mode);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`fatal: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});
