const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const initSupabaseDb = async () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.warn('No SUPABASE_DB_URL provided, skipping automated table creation.');
    return;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Create the profiles table linked to Supabase auth.users
    const query = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mobile_number TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `;

    await client.query(query);
    console.log('Automated Database Setup: "profiles" table is ready.');

  } catch (error) {
    console.error('Automated Database Setup Failed:', error.message);
  } finally {
    await client.end();
  }
};

module.exports = initSupabaseDb;
