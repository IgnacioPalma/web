create table public.comuna_weekly_crime_records (
  id          bigint generated always as identity primary key,
  comuna_cut  text    not null references public.comunas(cut),
  week_id     integer not null references public.weeks(id),
  nombre      text    not null,

  ultima_semana            integer,
  ultima_semana_anterior   integer,
  ultimos_28_dias          integer,
  ultimos_28_dias_anterior integer,
  anno_a_la_fecha          integer,
  anno_a_la_fecha_anterior integer,
  umbral                   numeric,

  unique (comuna_cut, week_id, nombre)
);

create index on public.comuna_weekly_crime_records (comuna_cut, nombre, week_id desc);

alter table public.comuna_weekly_crime_records enable row level security;

comment on table public.comuna_weekly_crime_records is
  'Normalized rows from the registros[] array — one row per (comuna, week, crime category).';
