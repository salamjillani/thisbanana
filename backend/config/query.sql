-- Create scans table
CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  
  -- Analyst Bot Results
  company_name TEXT,
  industry_description TEXT,
  competitor TEXT,
  
  -- Simulator Bot Results
  ai_response TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  
  -- Metrics
  brand_visibility INTEGER DEFAULT 0 CHECK (brand_visibility >= 0 AND brand_visibility <= 100),
  sentiment TEXT CHECK (sentiment IN ('Positive', 'Neutral', 'Negative', 'Unknown')) DEFAULT 'Unknown',
  brand_ranking INTEGER DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  error TEXT,
  
  -- Metadata
  scan_type TEXT CHECK (scan_type IN ('free', 'paid')) DEFAULT 'free',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_scans_ip_address ON scans(ip_address);
CREATE INDEX idx_scans_created_at ON scans(created_at);
CREATE INDEX idx_scans_url ON scans(url);
CREATE INDEX idx_scans_status ON scans(status);

-- Create index for rate limiting queries
CREATE INDEX idx_scans_rate_limit ON scans(ip_address, created_at, scan_type);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON scans
  FOR ALL
  USING (auth.role() = 'service_role');