
ALTER TABLE public.lesson_plans DROP CONSTRAINT IF EXISTS lesson_plans_template_id_fkey;
ALTER TABLE public.lesson_plans DROP COLUMN IF EXISTS template_id;

-- 2. Drop RLS policies on templates
DROP POLICY IF EXISTS "templates_select_all" ON public.templates;
DROP POLICY IF EXISTS "templates_write_admin" ON public.templates;

-- 3. Drop the unique index for default template
DROP INDEX IF EXISTS idx_templates_single_default;

-- 4. Drop the templates table
DROP TABLE IF EXISTS public.templates;
