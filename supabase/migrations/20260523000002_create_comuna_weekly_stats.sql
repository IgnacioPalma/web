create table public.comuna_weekly_stats (
  id          bigint generated always as identity primary key,
  comuna_cut  text    not null references public.comunas(cut),
  week_id     integer not null references public.weeks(id),

  -- topline
  casos                              integer,
  tasa_de_registro                   numeric,
  total_umbrales                     numeric,
  mes_informacion                    text,
  anno_actual                        smallint,
  anno_anterior                      smallint,

  -- period comparisons
  casos_ultima_semana                integer,
  casos_ultima_semana_anterior       integer,
  casos_ultimos_28_dias              integer,
  casos_ultimos_28_dias_anterior     integer,
  casos_anno_a_la_fecha              integer,
  casos_anno_a_la_fecha_anterior     integer,

  -- controls
  controles                                       integer,
  controles_de_identidad                          integer,
  controles_vehiculares                           integer,
  fiscalizaciones                                 integer,
  fiscalizaciones_locales_alcohol                 integer,
  fiscalizaciones_entidades_comerciales_bancarias integer,
  incautaciones                                   integer,
  incautaciones_armas_fuego                       integer,
  incautaciones_armas_blancas                     integer,

  -- drug seizures (kg / units)
  decomisos_ultima_semana                  numeric,
  decomisos_anno_a_la_fecha                numeric,
  decomisos_clorhidrato_ultima_semana      numeric,
  decomisos_clorhidrato_anno_a_la_fecha    numeric,
  decomisos_pasta_base_ultima_semana       numeric,
  decomisos_pasta_base_anno_a_la_fecha     numeric,
  decomisos_marihuana_ultima_semana        numeric,
  decomisos_marihuana_anno_a_la_fecha      numeric,
  decomisos_plantas_ultima_semana          numeric,
  decomisos_plantas_anno_a_la_fecha        numeric,

  -- operations
  allanamientos_ultima_semana                  integer,
  allanamientos_anno_a_la_fecha                integer,
  agrupaciones_delictuales_ultima_semana       integer,
  agrupaciones_delictuales_anno_a_la_fecha     integer,
  eventos_cop_ultima_semana                    integer,
  eventos_cop_anno_a_la_fecha                  integer,
  vehiculos_recuperados_ultima_semana          integer,
  vehiculos_recuperados_anno_a_la_fecha        integer,
  especialidades_os7                           integer,
  especialidades_os9                           integer,
  especialidades_sebv                          integer,
  especialidades_labocar                       integer,

  -- top 5 crime categories (denormalized for quick reads)
  mayor_registro_1_nombre text,
  mayor_registro_1_valor  integer,
  mayor_registro_2_nombre text,
  mayor_registro_2_valor  integer,
  mayor_registro_3_nombre text,
  mayor_registro_3_valor  integer,
  mayor_registro_4_nombre text,
  mayor_registro_4_valor  integer,
  mayor_registro_5_nombre text,
  mayor_registro_5_valor  integer,

  -- forward-compat safety net
  raw_payload jsonb       not null,
  scraped_at  timestamptz not null default now(),

  unique (comuna_cut, week_id)
);

create index on public.comuna_weekly_stats (comuna_cut, week_id desc);

alter table public.comuna_weekly_stats enable row level security;

comment on table public.comuna_weekly_stats is
  'One row per (comuna, week). Top-level metrics from /api/estadistica/{week}/COMUNA/{cut}.';
comment on column public.comuna_weekly_stats.raw_payload is
  'Full upstream JSON payload, for fields not yet mapped to columns.';
