-- =====================================================
-- PHASE 2: UPDATED USER PLATFORM SCHEMA
-- =====================================================

-- Create users_metadata table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  company_url TEXT,
  
  -- Subscription info
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'peel', 'bunch', 'top_banana')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  
  -- Usage limits and tracking
  simulations_used INTEGER DEFAULT 0,
  simulations_limit INTEGER DEFAULT 0, -- 0 = free (unlimited scans but limited features), 100 = peel, 500 = bunch, -1 = unlimited
  simulations_reset_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
  
  blog_posts_used INTEGER DEFAULT 0,
  blog_posts_limit INTEGER DEFAULT 0, -- 0 = free, 2 = peel, 20 = bunch, -1 = unlimited
  blog_posts_reset_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
  
  competitor_limit INTEGER DEFAULT 0, -- 0 = free, 1 = peel, 5 = bunch, -1 = unlimited
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_metadata
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON user_metadata;
DROP POLICY IF EXISTS "Service role full access on user_metadata" ON user_metadata;

-- Policy: Users can only read their own metadata
CREATE POLICY "Users can view own metadata" ON user_metadata
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own metadata
CREATE POLICY "Users can update own metadata" ON user_metadata
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on user_metadata" ON user_metadata
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- UPDATE SCANS TABLE FOR FREE SCANS
-- =====================================================

-- Modify scans table to allow NULL user_id for anonymous scans
ALTER TABLE scans ALTER COLUMN user_id DROP NOT NULL;

-- Add session_id for tracking anonymous scans
ALTER TABLE scans ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;

-- Create index for session scans
CREATE INDEX IF NOT EXISTS idx_scans_session_id ON scans(session_id);
CREATE INDEX IF NOT EXISTS idx_scans_claimed ON scans(claimed);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own scans" ON scans;
DROP POLICY IF EXISTS "Users can create own scans" ON scans;
DROP POLICY IF EXISTS "Users can update own scans" ON scans;
DROP POLICY IF EXISTS "Service role full access on scans" ON scans;

-- Enable RLS on scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scans OR scans with their session_id
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (user_id IS NULL AND session_id IS NOT NULL)
  );

-- Policy: Anyone can create scans (authenticated or anonymous)
CREATE POLICY "Anyone can create scans" ON scans
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own scans
CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on scans" ON scans
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- COMPETITORS TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  industry TEXT,
  
  -- Latest metrics
  latest_visibility INTEGER DEFAULT 0,
  latest_sentiment TEXT CHECK (latest_sentiment IN ('Positive', 'Neutral', 'Negative', 'Unknown')) DEFAULT 'Unknown',
  latest_ranking INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, competitor_name)
);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can manage own competitors" ON competitors;
DROP POLICY IF EXISTS "Service role full access on competitors" ON competitors;

-- RLS Policies
CREATE POLICY "Users can view own competitors" ON competitors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own competitors" ON competitors
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on competitors" ON competitors
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);

-- =====================================================
-- HISTORICAL METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS historical_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  
  -- Metrics snapshot
  brand_visibility INTEGER DEFAULT 0,
  sentiment TEXT CHECK (sentiment IN ('Positive', 'Neutral', 'Negative', 'Unknown')) DEFAULT 'Unknown',
  brand_ranking INTEGER DEFAULT 0,
  mentions_count INTEGER DEFAULT 0,
  
  -- Competitor data (for comparison)
  competitor_data JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE historical_metrics ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own historical metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Service role full access on historical_metrics" ON historical_metrics;

-- RLS Policies
CREATE POLICY "Users can view own historical metrics" ON historical_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on historical_metrics" ON historical_metrics
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_historical_metrics_user_id ON historical_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_historical_metrics_recorded_at ON historical_metrics(recorded_at DESC);

-- =====================================================
-- SOURCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source details
  url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  author_email TEXT,
  published_date TIMESTAMPTZ,
  domain TEXT,
  
  -- Metrics
  mentions_count INTEGER DEFAULT 0,
  last_mentioned_at TIMESTAMPTZ,
  
  -- Outreach tracking
  outreach_status TEXT CHECK (outreach_status IN ('not_contacted', 'contacted', 'responded', 'ignored')) DEFAULT 'not_contacted',
  outreach_notes TEXT,
  contacted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, url)
);

-- Enable RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own sources" ON sources;
DROP POLICY IF EXISTS "Users can manage own sources" ON sources;
DROP POLICY IF EXISTS "Service role full access on sources" ON sources;

-- RLS Policies
CREATE POLICY "Users can view own sources" ON sources
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sources" ON sources
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on sources" ON sources
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_outreach_status ON sources(outreach_status);

-- =====================================================
-- BLOG POSTS TABLE (NEW)
-- =====================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Blog post details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_keyword TEXT,
  seo_optimized BOOLEAN DEFAULT TRUE,
  
  -- AI generation metadata
  prompt_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own blog posts" ON blog_posts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own blog posts" ON blog_posts
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on blog posts" ON blog_posts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id);

-- =====================================================
-- STRIPE EVENTS LOG (for debugging & auditing)
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  customer_id TEXT,
  subscription_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- =====================================================
-- FUNCTION: Reset monthly usage counters
-- =====================================================

CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_metadata
  SET 
    simulations_used = 0,
    simulations_reset_date = NOW() + INTERVAL '1 month',
    blog_posts_used = 0,
    blog_posts_reset_date = NOW() + INTERVAL '1 month'
  WHERE 
    simulations_reset_date <= NOW() 
    OR blog_posts_reset_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_metadata_updated_at ON user_metadata;
CREATE TRIGGER update_user_metadata_updated_at BEFORE UPDATE ON user_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitors_updated_at ON competitors;
CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();