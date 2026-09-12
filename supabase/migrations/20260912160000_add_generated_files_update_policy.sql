-- Add missing UPDATE policy for generated_files table
create policy "generated_files_update" on public.generated_files
  for update using (
    exists (
      select 1 from public.lesson_plans lp
      where lp.id = lesson_plan_id and lp.owner_id = auth.uid()
    )
  );
