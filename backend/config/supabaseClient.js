const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase URL or Anon Key in environment variables.');
}

const supabase = createClient(supabaseUrl || 'http://placeholder.co', supabaseKey || 'placeholder');

module.exports = supabase;
