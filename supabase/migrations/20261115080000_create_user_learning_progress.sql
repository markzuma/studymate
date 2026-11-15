create table if not exists public.user_learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{"completed":[],"recent":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_learning_progress enable row level security;

drop policy if exists "Users can read their own learning progress"
  on public.user_learning_progress;
create policy "Users can read their own learning progress"
  on public.user_learning_progress
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own learning progress"
  on public.user_learning_progress;
create policy "Users can insert their own learning progress"
  on public.user_learning_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own learning progress"
  on public.user_learning_progress;
create policy "Users can update their own learning progress"
  on public.user_learning_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_learning_progress to authenticated;
