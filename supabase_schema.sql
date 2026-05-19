-- ============================================================
-- Supabase Schema: user_access table with RLS
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. User access control table
CREATE TABLE IF NOT EXISTS public.user_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Auto-insert row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_access (email, approved)
  VALUES (NEW.email, false)
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable Row Level Security
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- 4. Users can only read their own access row
CREATE POLICY "Users can read own access"
  ON public.user_access FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- 5. Service role (admin) can manage all rows
-- (This uses the service_role key from Supabase dashboard, not the anon key)
CREATE POLICY "Service role can manage all"
  ON public.user_access FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- ADMIN: To approve a user, run:
--   UPDATE public.user_access
--   SET approved = true, approved_at = now()
--   WHERE email = 'user@example.com';
-- ============================================================

-- 6. Grant table permissions to roles
GRANT SELECT ON public.user_access TO authenticated;
GRANT SELECT ON public.user_access TO anon;

