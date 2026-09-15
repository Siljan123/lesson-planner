-- =========================================================
-- Worksheets / Learning Activity Sheets (LAS) Schema
-- Run in Supabase SQL Editor or migration runner
-- =========================================================

create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  grade_level_id uuid references public.grade_levels(id),
  lesson_plan_id uuid references public.lesson_plans(id) on delete set null,
  title text not null,
  topic text not null,
  term public.school_term not null default 'term_1',
  target_competency text,
  medium_of_instruction text default 'English',
  status public.lesson_plan_status not null default 'draft',
  content jsonb not null default '{}'::jsonb,
  ai_use_declaration jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.worksheets is 'Standalone student worksheets / Learning Activity Sheets (LAS) separate from lesson plans.';

-- Indexes
create index if not exists idx_worksheets_owner on public.worksheets (owner_id);
create index if not exists idx_worksheets_subject_grade on public.worksheets (subject_id, grade_level_id);
create index if not exists idx_worksheets_lesson_plan on public.worksheets (lesson_plan_id);
create index if not exists idx_worksheets_status on public.worksheets (status);

-- Updated at trigger
create trigger trg_worksheets_updated_at
  before update on public.worksheets
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.worksheets enable row level security;

create policy worksheets_select_own_or_admin on public.worksheets
  for select using (owner_id = auth.uid() or public.is_admin());

create policy worksheets_insert_own on public.worksheets
  for insert with check (owner_id = auth.uid());

create policy worksheets_update_own on public.worksheets
  for update using (owner_id = auth.uid());

create policy worksheets_delete_own on public.worksheets
  for delete using (owner_id = auth.uid());
