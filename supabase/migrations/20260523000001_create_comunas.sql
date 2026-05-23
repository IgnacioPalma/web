create table public.comunas (
  cut         text primary key,
  nombre      text not null,
  region      text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.comunas enable row level security;

comment on table public.comunas is
  'Curated list of comunas to scrape. cut = Código Único Territorial (5 digits).';
comment on column public.comunas.is_active is
  'Scraper only iterates rows where is_active = true.';
