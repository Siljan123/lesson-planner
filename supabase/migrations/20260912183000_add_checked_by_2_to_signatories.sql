-- Add checked_by_2 fields to signatory_sections
alter table public.signatory_sections
add column if not exists checked_by_2_name text,
add column if not exists checked_by_2_position_id uuid references public.positions(id);
