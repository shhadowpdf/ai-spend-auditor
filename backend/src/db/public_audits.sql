create extension if not exists pgcrypto;

create table if not exists public.public_audits (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  public_url text not null,
  company_name text,
  email text,
  report jsonb not null,
  public_report jsonb not null,
  llm_response text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists public_audits_public_id_idx
  on public.public_audits (public_id);
