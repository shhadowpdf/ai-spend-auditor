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

create table if not exists public.audits(
  id uuid primary key default gen_random_uuid(),
  audit_id text not null,
  user_email text,
  input_stack jsonb not null,
  output_result jsonb not null,
  pricing_snapshot jsonb not null,
  invalidated boolean default false,
  change_summary jsonb,
  original_audit_id text,
  created_at timestamptz not null default timezone('utc', now()),
  notified_at timestamptz,
  foreign key (audit_id) references public.public_audits(public_id) on delete cascade,
  foreign key (original_audit_id) references public.audits(audit_id) on delete set null,
  unique (audit_id)
);

create index if not exists audits_audit_id_idx
  on public.audits (audit_id);

create index if not exists audits_user_email_idx
  on public.audits (user_email);

create index if not exists public_audits_public_id_idx
  on public.public_audits (public_id);
