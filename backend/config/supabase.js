import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('scans').select('count');
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('❌ Supabase Connection Error:', error.message);
    } else {
      console.log('✅ Supabase Connected Successfully');
    }
  } catch (error) {
    console.error('❌ Supabase Connection Error:', error.message);
  }
};

testConnection();

export default supabase;