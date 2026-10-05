-- =========================================================
-- Migration: Monthly Quota & Token Requests
-- =========================================================

-- 1. Update user_token_quotas default and existing limits
ALTER TABLE public.user_token_quotas ALTER COLUMN token_limit SET DEFAULT 100000;

-- Update existing users to 100K limit (if they had the previous 500K default)
UPDATE public.user_token_quotas SET token_limit = 100000 WHERE token_limit = 500000;

-- 2. Create token_requests table
CREATE TABLE public.token_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_amount int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.token_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own requests" ON public.token_requests
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own requests" ON public.token_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update requests" ON public.token_requests
  FOR UPDATE USING (public.is_admin());

-- 3. Create admin_add_tokens RPC
CREATE OR REPLACE FUNCTION public.admin_add_tokens(p_user_id uuid, p_amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_token_quotas
  SET token_limit = token_limit + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
