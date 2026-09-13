-- Allow authenticated users to insert new custom subjects
create policy "subjects_insert_authenticated" on public.subjects
  for insert to authenticated with check (true);
