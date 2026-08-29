import pg from "pg";
import fs from "fs";
import path from "path";

const { Client } = pg;

// Read .env file manually without external library dependencies
let dbPassword = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");
  const match = envContent.match(/VITE_DATABASE_PASSWORD\s*=\s*([^\r\n]*)/);
  if (match) {
    dbPassword = match[1].trim();
  }
} catch (err) {
  console.error("Could not read .env file. Please make sure it exists.");
  process.exit(1);
}

if (!dbPassword || dbPassword === "your_password" || dbPassword.includes("PASSWORD")) {
  console.error("\n[Setup Error] Please set your Supabase database password in frontend/.env as VITE_DATABASE_PASSWORD=your_password");
  process.exit(1);
}

const connectionString = `postgresql://postgres:${dbPassword}@db.bmhkifduohxeqsfwwyxf.supabase.co:5432/postgres`;
const client = new Client({ connectionString });

async function setup() {
  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Creating public.entries table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.entries (
        id SERIAL PRIMARY KEY,
        code VARCHAR(4) UNIQUE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'image')),
        content TEXT,
        image_url TEXT,
        image_path TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    console.log("Creating optimized database indices...");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_entries_code ON public.entries(code);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_entries_expires_at ON public.entries(expires_at);`);

    console.log("Disabling Row Level Security (RLS) for public.entries...");
    await client.query(`ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;`);

    console.log("Creating Supabase storage bucket 'shares'...");
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('shares', 'shares', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Enabling storage bucket RLS policies for anonymous uploads/downloads/deletions...");
    
    await client.query(`
      DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
      CREATE POLICY "Allow Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'shares');

      DROP POLICY IF EXISTS "Allow Public Download" ON storage.objects;
      CREATE POLICY "Allow Public Download" ON storage.objects FOR SELECT TO public USING (bucket_id = 'shares');

      DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;
      CREATE POLICY "Allow Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'shares');
    `);

    console.log("Enabling pg_cron extension...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_cron;`);

    console.log("Scheduling background cleanup cron job (every 1 minute)...");
    await client.query(`
      SELECT cron.unschedule('vanishshare-cleanup');
    `).catch(() => {});
    
    await client.query(`
      SELECT cron.schedule(
        'vanishshare-cleanup',
        '* * * * *',
        $$ DELETE FROM public.entries WHERE expires_at <= NOW() $$
      );
    `);

    console.log("\n🚀 SUPABASE DATABASE SETUP SUCCESSFUL!");
    console.log("The 'public.entries' table and 'shares' bucket are now active!");
  } catch (error) {
    console.error("\n❌ Database setup failed:", error.message);
  } finally {
    await client.end();
  }
}

setup();
