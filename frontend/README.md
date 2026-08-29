# 🛠️ VanishShare Frontend & Database Setup (Developer Guide)

This guide documents the database schema, background cron schedules, local environment settings, and installation steps required to run the VanishShare application locally or deploy it to production.

---

## 🛠️ Architecture & Under the Hood

VanishShare is built on a Serverless architecture:
1. **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React Icons.
2. **Backend Engine:** Supabase PostgreSQL Database + Supabase Cloud Storage.
3. **Purge Automation:** An automated cleanup scheduler query running directly in Supabase PostgreSQL using `pg_cron`.

---

## 🗄️ Database Schema Specification

The application uses a PostgreSQL table (`public.entries`) with the following fields:

```sql
CREATE TABLE public.entries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL, -- Unique 4-character access code
  type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT, -- Contains text note string
  image_url TEXT, -- Public storage link for images
  image_path TEXT, -- Storage bucket relative path for clean-ups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL -- Expiration target timestamp
);

-- Optimized Query Indices
CREATE INDEX idx_entries_code ON public.entries(code);
CREATE INDEX idx_entries_expires_at ON public.entries(expires_at);
```

### ⏰ Automated Expiry Cleanup Query
To handle the auto-expiry of data, we configure a PostgreSQL `cron` job scheduler. This cron job runs every minute, purging expired entries:

```sql
SELECT cron.schedule(
  'vanishshare-cleanup',
  '* * * * *',
  $$ DELETE FROM public.entries WHERE expires_at <= NOW() $$
);
```

---

## 🚀 Local Development Setup

### 1. Configure Environment Settings
Create a `.env` file inside this `frontend` folder containing the credentials of your Supabase project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DATABASE_PASSWORD=your_supabase_db_password
```

### 2. Install Dependencies
Run the installation command to fetch React and other modules:
```bash
npm install
```

### 3. Initialize Tables and Storage Buckets
Execute the pre-built Node schema initializer script. This script automatically connects to your database, establishes tables/indexes, configures storage buckets, and creates cron purgers:
```bash
node setup_db.js
```

### 4. Run Vite Development Server
Run the local dev server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to preview your changes.

---

## 🌐 Netlify / Vercel Deploy Instructions
- Build target: `npm run build`
- Output directory: `dist/`
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in your provider settings.
