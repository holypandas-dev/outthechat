-- Add premium subscription flag to profiles
alter table public.profiles
  add column if not exists is_premium boolean not null default false;
