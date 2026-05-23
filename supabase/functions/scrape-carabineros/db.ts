import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type { UpstreamRegistro, UpstreamStats, UpstreamWeek } from "./carabineros.ts";

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function upsertWeeks(
  db: SupabaseClient,
  weeks: UpstreamWeek[],
): Promise<number> {
  const rows = weeks.map((w) => ({
    id: w.id,
    anno: w.anno,
    semana_label: w.semana,
    nombre: w.nombre,
    fecha_desde: w.fecha_desde_iso,
    fecha_hasta: w.fecha_hasta_iso,
  }));
  const { error } = await db.from("weeks").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`upsert weeks: ${error.message}`);
  return rows.length;
}

export async function listActiveComunas(
  db: SupabaseClient,
): Promise<Array<{ cut: string; nombre: string }>> {
  const { data, error } = await db
    .from("comunas")
    .select("cut, nombre")
    .eq("is_active", true);
  if (error) throw new Error(`list comunas: ${error.message}`);
  return data ?? [];
}

export async function listAllWeekIds(db: SupabaseClient): Promise<number[]> {
  const { data, error } = await db
    .from("weeks")
    .select("id")
    .order("id", { ascending: true });
  if (error) throw new Error(`list weeks: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

export async function latestWeekId(db: SupabaseClient): Promise<number> {
  const { data, error } = await db
    .from("weeks")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();
  if (error) throw new Error(`latest week: ${error.message}`);
  return data.id;
}

export async function listScrapedWeekIds(
  db: SupabaseClient,
  comunaCut: string,
): Promise<Set<number>> {
  const { data, error } = await db
    .from("comuna_weekly_stats")
    .select("week_id")
    .eq("comuna_cut", comunaCut);
  if (error) throw new Error(`list scraped weeks: ${error.message}`);
  return new Set((data ?? []).map((r) => r.week_id));
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export async function upsertComunaWeeklyStats(
  db: SupabaseClient,
  comunaCut: string,
  weekId: number,
  payload: UpstreamStats,
): Promise<void> {
  const row = {
    comuna_cut: comunaCut,
    week_id: weekId,
    casos: num(payload.casos),
    tasa_de_registro: num(payload.tasa_de_registro),
    total_umbrales: num(payload.total_umbrales),
    mes_informacion: str(payload.mes_informacion),
    anno_actual: num(payload.anno_actual),
    anno_anterior: num(payload.anno_anterior),

    casos_ultima_semana: num(payload.casos_ultima_semana),
    casos_ultima_semana_anterior: num(payload.casos_ultima_semana_anterior),
    casos_ultimos_28_dias: num(payload.casos_ultimos_28_dias),
    casos_ultimos_28_dias_anterior: num(payload.casos_ultimos_28_dias_anterior),
    casos_anno_a_la_fecha: num(payload.casos_anno_a_la_fecha),
    casos_anno_a_la_fecha_anterior: num(payload.casos_anno_a_la_fecha_anterior),

    controles: num(payload.controles),
    controles_de_identidad: num(payload.controles_de_identidad),
    controles_vehiculares: num(payload.controles_vehiculares),
    fiscalizaciones: num(payload.fiscalizaciones),
    fiscalizaciones_locales_alcohol: num(payload.fiscalizaciones_locales_alcohol),
    fiscalizaciones_entidades_comerciales_bancarias: num(
      payload.fiscalizaciones_entidades_comerciales_bancarias,
    ),
    incautaciones: num(payload.incautaciones),
    incautaciones_armas_fuego: num(payload.incautaciones_armas_fuego),
    incautaciones_armas_blancas: num(payload.incautaciones_armas_blancas),

    decomisos_ultima_semana: num(payload.decomisos_ultima_semana),
    decomisos_anno_a_la_fecha: num(payload.decomisos_anno_a_la_fecha),
    decomisos_clorhidrato_ultima_semana: num(payload.decomisos_clorhidrato_ultima_semana),
    decomisos_clorhidrato_anno_a_la_fecha: num(payload.decomisos_clorhidrato_anno_a_la_fecha),
    decomisos_pasta_base_ultima_semana: num(payload.decomisos_pasta_base_ultima_semana),
    decomisos_pasta_base_anno_a_la_fecha: num(payload.decomisos_pasta_base_anno_a_la_fecha),
    decomisos_marihuana_ultima_semana: num(payload.decomisos_marihuana_ultima_semana),
    decomisos_marihuana_anno_a_la_fecha: num(payload.decomisos_marihuana_anno_a_la_fecha),
    decomisos_plantas_ultima_semana: num(payload.decomisos_plantas_ultima_semana),
    decomisos_plantas_anno_a_la_fecha: num(payload.decomisos_plantas_anno_a_la_fecha),

    allanamientos_ultima_semana: num(payload.allanamientos_ultima_semana),
    allanamientos_anno_a_la_fecha: num(payload.allanamientos_anno_a_la_fecha),
    agrupaciones_delictuales_ultima_semana: num(payload.agrupaciones_delictuales_ultima_semana),
    agrupaciones_delictuales_anno_a_la_fecha: num(payload.agrupaciones_delictuales_anno_a_la_fecha),
    eventos_cop_ultima_semana: num(payload.eventos_cop_ultima_semana),
    eventos_cop_anno_a_la_fecha: num(payload.eventos_cop_anno_a_la_fecha),
    vehiculos_recuperados_ultima_semana: num(payload.vehiculos_recuperados_ultima_semana),
    vehiculos_recuperados_anno_a_la_fecha: num(payload.vehiculos_recuperados_anno_a_la_fecha),
    especialidades_os7: num(payload.especialidades_os7),
    especialidades_os9: num(payload.especialidades_os9),
    especialidades_sebv: num(payload.especialidades_sebv),
    especialidades_labocar: num(payload.especialidades_labocar),

    mayor_registro_1_nombre: str(payload.mayor_registro_1_nombre),
    mayor_registro_1_valor: num(payload.mayor_registro_1_valor),
    mayor_registro_2_nombre: str(payload.mayor_registro_2_nombre),
    mayor_registro_2_valor: num(payload.mayor_registro_2_valor),
    mayor_registro_3_nombre: str(payload.mayor_registro_3_nombre),
    mayor_registro_3_valor: num(payload.mayor_registro_3_valor),
    mayor_registro_4_nombre: str(payload.mayor_registro_4_nombre),
    mayor_registro_4_valor: num(payload.mayor_registro_4_valor),
    mayor_registro_5_nombre: str(payload.mayor_registro_5_nombre),
    mayor_registro_5_valor: num(payload.mayor_registro_5_valor),

    raw_payload: payload,
    scraped_at: new Date().toISOString(),
  };

  const { error } = await db
    .from("comuna_weekly_stats")
    .upsert(row, { onConflict: "comuna_cut,week_id" });
  if (error) throw new Error(`upsert stats: ${error.message}`);
}

export async function upsertCrimeRecords(
  db: SupabaseClient,
  comunaCut: string,
  weekId: number,
  registros: UpstreamRegistro[],
): Promise<number> {
  const rows = registros.map((r) => ({
    comuna_cut: comunaCut,
    week_id: weekId,
    nombre: r.nombre,
    ultima_semana: num(r.ultima_semana),
    ultima_semana_anterior: num(r.ultima_semana_anterior),
    ultimos_28_dias: num(r.ultimos_28_dias),
    ultimos_28_dias_anterior: num(r.ultimos_28_dias_anterior),
    anno_a_la_fecha: num(r.anno_a_la_fecha),
    anno_a_la_fecha_anterior: num(r.anno_a_la_fecha_anterior),
    umbral: num(r.umbral),
  }));
  const { error } = await db
    .from("comuna_weekly_crime_records")
    .upsert(rows, { onConflict: "comuna_cut,week_id,nombre" });
  if (error) throw new Error(`upsert crime records: ${error.message}`);
  return rows.length;
}
