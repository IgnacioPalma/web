const BASE_URL = "https://leystop.carabineros.cl/api";
const TIMEOUT_MS = 15_000;

export interface UpstreamWeek {
  id: number;
  anno: number;
  semana: string;
  nombre: string;
  fecha_desde: string;
  fecha_desde_iso: string;
  fecha_hasta: string;
  fecha_hasta_iso: string;
}

export interface UpstreamRegistro {
  nombre: string;
  ultima_semana: number | null;
  ultima_semana_anterior: number | null;
  ultimos_28_dias: number | null;
  ultimos_28_dias_anterior: number | null;
  anno_a_la_fecha: number | null;
  anno_a_la_fecha_anterior: number | null;
  umbral: number | null;
}

export type UpstreamStats = Record<string, unknown> & {
  registros: UpstreamRegistro[];
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`upstream ${path} → HTTP ${res.status}`);
  }
  return await res.json() as T;
}

export function fetchWeeks(): Promise<UpstreamWeek[]> {
  return getJson<UpstreamWeek[]>("/semanas");
}

export function fetchComunaStats(
  weekId: number,
  cut: string,
): Promise<UpstreamStats> {
  return getJson<UpstreamStats>(`/estadistica/${weekId}/COMUNA/${cut}`);
}
