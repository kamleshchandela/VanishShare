# 🚀 VanishShare — Self-Destructing Text & Image Sharing

**VanishShare** is a premium, secure, and fully anonymous self-destructing text and image sharing application. Built as a zero-knowledge dashboard, it allows users to upload secret notes or images, generate a 6-character sharing code, and share them securely. Exactly **60 seconds** after creation, the shared content is completely purged from both the database and cloud storage servers.

---

## ✨ Features

- **Anonymous Text Sharing:** Paste credentials, notes, passwords, or code blocks up to 5000 characters.
- **Anonymous Image Hosting:** Securely share JPG, PNG, and WebP images up to 5MB.
- **Circular Real-time Countdown Timer:** A visually stunning countdown clock showing the exact seconds remaining before destruction.
- **Manual "Burn" Option:** Destroys and Purges the content immediately on the spot upon retrieval.
- **Double-Column Split Layouts:** Sleek cartoon-themed interface with unique floating mascots.
- **Dynamic Browser Background Keyer:** Renders JPEG mascot assets inside a canvas and crops out borders dynamically to output transparent PNGs in real-time.
- **Canvas Clipboard Copy:** Converts remote images to native PNG blobs via an HTML5 canvas for direct copy-pasting to system clipboards.
- **Zero-Scroll Main Dashboard:** Locks viewport height dynamically on the home page for a native app feel.
- **SEO & Search Index Optimization:** Dynamic React title routing, customized mobile browser theme colors, structured JSON-LD schemas, and keyword-rich alt tags.

---

## 🛠️ Technology Stack

- **Frontend:** React 19 (Hooks, Context, Refs), Vite, Tailwind CSS v4, Lucide React Icons.
- **Backend / Database:** Supabase (PostgreSQL Database, Storage Buckets).
- **Automation:** `pg_cron` (Postgres scheduler extensions) for automatic 60-second database purges.

---

## 🗄️ Database Schema & Configuration

The application is powered by a PostgreSQL table (`public.entries`) with the following structure:

```sql
CREATE TABLE public.entries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT,
  image_url TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Optimized query indices
CREATE INDEX idx_entries_code ON public.entries(code);
CREATE INDEX idx_entries_expires_at ON public.entries(expires_at);
```

### ⏰ Automated Purging Engine (`pg_cron`)
To guarantee that data is completely deleted exactly 60 seconds after upload, a background task scheduler runs a purge query every minute directly inside PostgreSQL:

```sql
SELECT cron.schedule(
  'vanishshare-cleanup',
  '* * * * *',
  $$ DELETE FROM public.entries WHERE expires_at <= NOW() $$
);
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Supabase](https://supabase.com/) account and project.

### 2. Configure Environment Variables
Create a `.env` file inside the `frontend` folder with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DATABASE_PASSWORD=your_supabase_db_password
```

### 3. Initialize Database Schema
Run the setup script inside the `frontend` directory. This script will automatically connect to your Supabase PostgreSQL database, create tables, build indices, setup buckets, and schedule background cron cleanup tasks:

```bash
cd frontend
npm install
node setup_db.js
```

### 4. Start the Application
Run the Vite development server locally:

```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

---

## 🌐 Deployment

### Frontend (Netlify / Vercel)
The project is built as a static client-side app, meaning you only need to deploy the `frontend` folder.
1. Build the production package: `npm run build`
2. Push to your Git repository.
3. Link the repository to **Netlify** or **Vercel**.
4. Make sure to define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the site configuration dashboard.

### Backend
No separate backend server deployment is required! Supabase operates natively in the cloud. The automatic deletion scheduler runs directly inside the Supabase database.

---

## 🔒 Security & Privacy
- **No Log Persistence:** No logs are recorded when codes are generated or destroyed.
- **Voluntary Burn:** Receivers can immediately wipe data on reading, leaving no trace behind.
- **Zero Cookies:** No cookies or analytics are loaded, keeping sharing 100% anonymous.
