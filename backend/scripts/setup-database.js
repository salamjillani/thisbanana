import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔄 Creating scans table...');
    
    await client.query(`
      -- Drop table if exists (for fresh setup)
      DROP TABLE IF EXISTS scans CASCADE;

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
      CREATE INDEX idx_scans_rate_limit ON scans(ip_address, created_at, scan_type);
    `);

    console.log('✅ Scans table created successfully!');
    console.log('✅ All indexes created!');
    console.log('\n📊 Database setup complete! You can now run: npm run dev\n');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure DATABASE_URL in .env is correct');
    console.error('2. Check that your database password is correct');
    console.error('3. Verify your Supabase project is active\n');
    
    await client.end();
    process.exit(1);
  }
};

setupDatabase();