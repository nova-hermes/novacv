-- NovaCV Phase 2: Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com -> SQL Editor -> New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  clerk_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro_monthly', 'pro_yearly', 'lifetime')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for Clerk lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users (clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- =============================================
-- RESUMES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  data JSONB NOT NULL DEFAULT '{}',
  template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes (updated_at DESC);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_sub_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_yearly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions (stripe_sub_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can update their own row
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Resumes: users can CRUD their own resumes
CREATE POLICY "Users can read own resumes" ON public.resumes
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can insert own resumes" ON public.resumes
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update own resumes" ON public.resumes
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can delete own resumes" ON public.resumes
  FOR DELETE USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- Subscriptions: users can read their own
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_resumes
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
