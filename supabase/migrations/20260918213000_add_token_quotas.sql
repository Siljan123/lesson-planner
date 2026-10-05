-- =========================================================
-- User Token Quota System
-- Tracks token usage per user with weekly resets
-- =========================================================

-- 1. Create the table
CREATE TABLE public.user_token_quotas (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_used int NOT NULL DEFAULT 0,
  token_limit int NOT NULL DEFAULT 500000,
  period_start_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE public.user_token_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota" ON public.user_token_quotas
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update quota" ON public.user_token_quotas
  FOR UPDATE USING (public.is_admin());

-- 3. Trigger to auto-create quota for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_token_quotas (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_quota();

-- 4. Backfill existing users
INSERT INTO public.user_token_quotas (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5. RPC for safely incrementing tokens without race conditions
CREATE OR REPLACE FUNCTION public.increment_tokens(p_user_id uuid, p_amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_token_quotas
  SET tokens_used = tokens_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
