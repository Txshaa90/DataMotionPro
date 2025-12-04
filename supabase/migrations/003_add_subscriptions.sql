-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for custom user fields (DO NOT modify auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  is_team_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table for your free team
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create usage_limits table
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  max_datasets INTEGER DEFAULT 3,
  max_records_per_dataset INTEGER DEFAULT 1000,
  api_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add your emails as owners (replace with your actual emails)
-- This makes YOU and your team members free forever
-- You can have multiple owners!
INSERT INTO public.team_members (email, role, added_by)
VALUES 
  ('trishacaisip1@gmail.com', 'owner', NULL),
  ('solutions@rapidrevver.com', 'owner', NULL),
  ('gary@rapidrevver.com', 'admin', NULL),
  ('rico@rapidrevver.com', 'admin', NULL),
  ('launchpad@rapidrevver.com', 'member', NULL),
  ('orders@rapidrevver.com', 'member', NULL),
  ('accounting@rapidrevver.com', 'member', NULL)
ON CONFLICT (email) DO NOTHING;

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  is_member BOOLEAN;
  subscription_plan TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if team member (always free with unlimited access)
  SELECT public.is_team_member(user_email) INTO is_member;
  
  IF is_member THEN
    RETURN 'enterprise'; -- Team members get enterprise features for free
  END IF;
  
  -- Otherwise, get their subscription plan
  SELECT plan INTO subscription_plan 
  FROM public.subscriptions 
  WHERE subscriptions.user_id = get_user_plan.user_id 
  AND status = 'active'
  LIMIT 1;
  
  RETURN COALESCE(subscription_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  user_id UUID,
  limit_type TEXT -- 'datasets', 'records', 'api'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get user's plan
  SELECT public.get_user_plan(user_id) INTO user_plan;
  
  -- Team members have no limits
  IF user_plan = 'enterprise' THEN
    RETURN true;
  END IF;
  
  -- Check specific limits based on plan
  IF limit_type = 'datasets' THEN
    SELECT COUNT(*) INTO current_count 
    FROM public.tables 
    WHERE tables.user_id = check_usage_limit.user_id;
    
    IF user_plan = 'free' THEN
      max_limit := 3;
    ELSIF user_plan = 'pro' THEN
      max_limit := 999999; -- Unlimited
    END IF;
    
    RETURN current_count < max_limit;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for team_members (only owner can manage)
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner can manage team members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'owner'
    )
  );

-- RLS Policies for usage_limits
CREATE POLICY "Users can view own limits"
  ON public.usage_limits FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON public.usage_limits(user_id);
