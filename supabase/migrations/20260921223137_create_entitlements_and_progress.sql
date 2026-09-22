
-- Entitlements table: written by the Lemon Squeezy webhook (service role),
-- read by users to check their own Pro status. Matched by email.
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  plan text NOT NULL DEFAULT 'pro',
  status text NOT NULL DEFAULT 'active',
  lemon_order_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entitlements_email ON public.entitlements(user_email);

-- User progress table: each Pro user has one row for their 180-day roadmap data.
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  day integer NOT NULL DEFAULT 1,
  baseline_monthly_spend numeric NOT NULL DEFAULT 500,
  current_monthly_spend numeric NOT NULL DEFAULT 500,
  money_recovered numeric NOT NULL DEFAULT 0,
  time_recovered_hours integer NOT NULL DEFAULT 0,
  time_recovered_minutes integer NOT NULL DEFAULT 0,
  life_score integer NOT NULL DEFAULT 50,
  hourly_rate numeric NOT NULL DEFAULT 25,
  check_ins jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: both tables locked until policies are added
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Entitlements: users can SELECT only rows matching their own auth email.
-- No INSERT/UPDATE/DELETE policies — only the webhook (service role) writes.
CREATE POLICY "select_own_entitlements" ON public.entitlements FOR SELECT
  TO authenticated USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- User progress: full CRUD on own row only
CREATE POLICY "select_own_progress" ON public.user_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_progress" ON public.user_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_progress" ON public.user_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_progress" ON public.user_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RPC: has_active_entitlement() — checks if the current authenticated user
-- has an active Pro entitlement. SECURITY DEFINER so it can join auth.users.
CREATE OR REPLACE FUNCTION public.has_active_entitlement()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements e
    JOIN auth.users u ON u.id = auth.uid()
    WHERE e.user_email = u.email
      AND e.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_entitlement() TO authenticated;
