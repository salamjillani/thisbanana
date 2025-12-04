import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse DATABASE_URL
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase() {
  console.log('🚀 Setting up Phase 2 database schema...\n');

  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, '../database/phase2-schema.sql');
    const sql = readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Phase 2 database schema created successfully!\n');
    console.log('📋 Created tables:');
    console.log('   - user_metadata');
    console.log('   - competitors');
    console.log('   - historical_metrics');
    console.log('   - sources');
    console.log('   - stripe_events');
    console.log('\n✨ Row Level Security (RLS) policies enabled');
    console.log('🔒 Your database is now secure and ready!\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();