-- Ensure profiles table has RLS enabled and correct policies for all operations

alter table public.profiles enable row level security;

-- Drop existing policies to avoid conflicts, then recreate
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Allow users to read their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow users to insert their own profile (used on signup)
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Allow users to update their own profile (required for profile page upsert)
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
