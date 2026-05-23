create table public.weeks (
  id            integer primary key,
  anno          smallint not null,
  semana_label  text not null,
  nombre        text not null,
  fecha_desde   date not null,
  fecha_hasta   date not null,
  created_at    timestamptz not null default now()
);

alter table public.weeks enable row level security;

comment on table public.weeks is
  'Reporting weeks from Carabineros /api/semanas. Primary key matches upstream id.';
