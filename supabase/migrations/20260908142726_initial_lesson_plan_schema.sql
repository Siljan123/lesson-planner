-- =========================================================
-- Lesson Plan Docs Generator — Supabase Schema (ILAW format)
-- Run in Supabase SQL Editor, or save as a migration file:
--   supabase/migrations/<timestamp>_lesson_plan_schema.sql
-- =========================================================

-- ---------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------
create type public.app_role as enum ('teacher', 'admin');

create type public.lesson_plan_status as enum ('draft', 'needs_review', 'ready', 'exported');

create type public.school_term as enum ('term_1', 'term_2', 'term_3');

create type public.export_format as enum ('docx', 'pptx', 'pdf');

-- ---------------------------------------------------------
-- 2. Profiles (extends auth.users)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'teacher',
  school_id uuid, -- FK added later if/when a schools table exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated teacher/admin, keyed to auth.users.';

-- Auto-create a profile row when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- 3. Reference tables: subjects, grade levels, competencies
-- ---------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);

create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  label text not null,          -- e.g. "Grade 4"
  sort_order int not null unique
);

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  grade_level_id uuid not null references public.grade_levels(id) on delete cascade,
  matatag_code text not null,   -- e.g. "MA4-IIa-1"
  description text not null,
  unique (subject_id, grade_level_id, matatag_code)
);

create index idx_competencies_subject_grade
  on public.competencies (subject_id, grade_level_id);

-- ---------------------------------------------------------
-- 4. Templates (ILAW default + room for legacy DLL/DLP)
-- ---------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. "ILAW", "DLL (legacy)"
  structure jsonb not null,           -- ordered section definitions
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one default template at a time
create unique index idx_templates_single_default
  on public.templates (is_default)
  where is_default = true;

-- ---------------------------------------------------------
-- 5. Lesson plans
-- ---------------------------------------------------------
create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  grade_level_id uuid not null references public.grade_levels(id),
  template_id uuid not null references public.templates(id),
  title text not null,
  term public.school_term not null,
  matatag_competency_code text,
  status public.lesson_plan_status not null default 'draft',

  -- ILAW sections, e.g.:
  -- {
  --   "intentions": { "learning_competency": "", "objectives": "" },
  --   "learning_experience": { "activities": [{ "phase": "Motivation", "description": "" }] },
  --   "assessing_learning": { "formative": "", "summative": "" },
  --   "ways_forward": { "reflection": "", "remediation": "", "enrichment": "" }
  -- }
  content jsonb not null default '{}'::jsonb,

  -- { "tool": "...", "sections_ai_assisted": [...], "teacher_edited": true }
  ai_use_declaration jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lesson_plans_owner on public.lesson_plans (owner_id);
create index idx_lesson_plans_subject_grade on public.lesson_plans (subject_id, grade_level_id);
create index idx_lesson_plans_status on public.lesson_plans (status);
create index idx_lesson_plans_content_gin on public.lesson_plans using gin (content);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 6. Version history
-- ---------------------------------------------------------
create table public.lesson_plan_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  version_number int not null,
  content_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (lesson_plan_id, version_number)
);

create index idx_lesson_plan_versions_plan on public.lesson_plan_versions (lesson_plan_id);

-- ---------------------------------------------------------
-- 7. Generated export files
-- ---------------------------------------------------------
create table public.generated_files (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  format public.export_format not null,
  storage_path text not null,   -- path within the Supabase Storage bucket
  created_at timestamptz not null default now()
);

create index idx_generated_files_plan on public.generated_files (lesson_plan_id);

-- =========================================================
-- 8. Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.grade_levels enable row level security;
alter table public.competencies enable row level security;
alter table public.templates enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_versions enable row level security;
alter table public.generated_files enable row level security;

-- Helper: is the current user an admin?
create function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: read/update own row; admins can read all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- reference tables: public read, admin write
create policy "subjects_select_all" on public.subjects for select using (true);
create policy "subjects_write_admin" on public.subjects for all
  using (public.is_admin()) with check (public.is_admin());

create policy "grade_levels_select_all" on public.grade_levels for select using (true);
create policy "grade_levels_write_admin" on public.grade_levels for all
  using (public.is_admin()) with check (public.is_admin());

create policy "competencies_select_all" on public.competencies for select using (true);
create policy "competencies_write_admin" on public.competencies for all
  using (public.is_admin()) with check (public.is_admin());

create policy "templates_select_all" on public.templates for select using (true);
create policy "templates_write_admin" on public.templates for all
  using (public.is_admin()) with check (public.is_admin());

-- lesson_plans: owner-only, admin can read all
create policy "lesson_plans_select_own_or_admin" on public.lesson_plans
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "lesson_plans_insert_own" on public.lesson_plans
  for insert with check (owner_id = auth.uid());
create policy "lesson_plans_update_own" on public.lesson_plans
  for update using (owner_id = auth.uid());
create policy "lesson_plans_delete_own" on public.lesson_plans
  for delete using (owner_id = auth.uid());

-- lesson_plan_versions: follow the parent plan's ownership
create policy "lesson_plan_versions_select" on public.lesson_plan_versions
  for select using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and (lp.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "lesson_plan_versions_insert" on public.lesson_plan_versions
  for insert with check (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and lp.owner_id = auth.uid()
    )
  );

-- generated_files: follow the parent plan's ownership
create policy "generated_files_select" on public.generated_files
  for select using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and (lp.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "generated_files_insert" on public.generated_files
  for insert with check (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and lp.owner_id = auth.uid()
    )
  );

-- =========================================================
-- 9. Seed data
-- =========================================================
insert into public.grade_levels (label, sort_order) values
  ('Grade 1', 1), ('Grade 2', 2), ('Grade 3', 3), ('Grade 4', 4),
  ('Grade 5', 5), ('Grade 6', 6), ('Grade 7', 7), ('Grade 8', 8),
  ('Grade 9', 9), ('Grade 10', 10);

insert into public.subjects (name, code) values
  ('Mathematics', 'MATH'),
  ('Science', 'SCI'),
  ('English', 'ENG'),
  ('Filipino', 'FIL'),
  ('Araling Panlipunan', 'AP'),
  ('MAPEH', 'MAPEH'),
  ('Edukasyon sa Pagpapakatao', 'ESP'),
  ('Technology and Livelihood Education', 'TLE');

insert into public.templates (name, structure, is_default) values (
  'ILAW',
  '{
    "sections": [
      { "key": "intentions", "label": "Intentions", "fields": ["learning_competency", "objectives"] },
      { "key": "learning_experience", "label": "Learning Experience", "fields": ["activities"] },
      { "key": "assessing_learning", "label": "Assessing Learning", "fields": ["formative", "summative"] },
      { "key": "ways_forward", "label": "Ways Forward", "fields": ["reflection", "remediation", "enrichment"] }
    ]
  }'::jsonb,
  true
);

insert into public.templates (name, structure, is_default) values (
  'DLL (legacy)',
  '{
    "sections": [
      { "key": "objectives", "label": "Objectives", "fields": ["content_standard", "performance_standard", "learning_competency"] },
      { "key": "content", "label": "Content", "fields": ["topic", "references"] },
      { "key": "procedures", "label": "Procedures", "fields": ["review", "motivation", "activity", "discussion", "application", "generalization"] },
      { "key": "assessment", "label": "Assessment", "fields": ["evaluation"] },
      { "key": "assignment", "label": "Assignment", "fields": ["remarks", "reflection"] }
    ]
  }'::jsonb,
  false
);