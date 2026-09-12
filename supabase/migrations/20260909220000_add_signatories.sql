-- Create positions table
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Insert default positions
insert into public.positions (name) values
  ('Teacher I'), ('Teacher II'), ('Teacher III'),
  ('Master Teacher I'), ('Master Teacher II'),
  ('Head Teacher I'), ('Head Teacher II'), ('Head Teacher III'),
  ('Principal I'), ('Principal II'), ('Principal III'),
  ('School Head'), ('OIC');

-- Create signatory_sections table
create table public.signatory_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade unique,
  school_name text,
  prepared_by_name text,
  checked_by_2_name text,
  prepared_by_position_id uuid references public.positions(id),
  checked_by_2_position_id uuid REFERENCES public.positions(id),
  checked_by_name text,
  checked_by_position_id uuid references public.positions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add standards and sessions to lesson_plans
alter table public.lesson_plans
add column content_standard text,
add column performance_standard text,
add column session_duration text;

-- Add RLS for positions
alter table public.positions enable row level security;
create policy "positions_select_all" on public.positions for select using (true);
create policy "positions_write_admin" on public.positions for all using (public.is_admin()) with check (public.is_admin());

-- Add RLS for signatory_sections
alter table public.signatory_sections enable row level security;
create policy "signatory_sections_select" on public.signatory_sections
  for select using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and (lp.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "signatory_sections_insert" on public.signatory_sections
  for insert with check (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and lp.owner_id = auth.uid()
    )
  );
create policy "signatory_sections_update" on public.signatory_sections
  for update using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and lp.owner_id = auth.uid()
    )
  );
