# 🪑 FurniTrack ERP — Factory Operations Management System

Complete ERP for furniture manufacturing. React 19 + TypeScript + Tailwind CSS + Supabase cloud database.

---

## 💾 Data Storage — Two Modes

| Mode | What happens | Setup |
|---|---|---|
| ☁ **Supabase** | Cloud PostgreSQL, multi-user, survives refresh, all devices | Add 2 env vars |
| 💾 **localStorage** | Saves in browser, survives refresh, single device only | Nothing — automatic fallback |

The app **auto-detects** which mode to use.

---

## 🚀 Full Deploy Guide (GitHub + Vercel + Supabase)

### Step 1 — Create Supabase Database (free)

1. Go to **[supabase.com](https://supabase.com)** → Sign up free
2. **New Project** → name it `furnitrack-erp` → set password → Create
3. Wait ~2 min for setup
4. Go to **SQL Editor** → **New Query**
5. Copy everything from `supabase/schema.sql` → Paste → **Run**
6. Go to **Settings → API** → copy:
   - **Project URL** = `VITE_SUPABASE_URL`
   - **anon public key** = `VITE_SUPABASE_ANON_KEY`

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "FurniTrack ERP"
git remote add origin https://github.com/YOUR_USERNAME/furnitrack-erp.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
3. Click **Deploy** ✅

---

## 🖥️ Run Locally

```bash
npm install
cp .env.example .env    # fill in your Supabase credentials
npm run dev             # http://localhost:5173
```

**No Supabase?** Skip the .env step — app uses localStorage automatically.

---

## 🔑 Login Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |
| `rahul` | `password` | Production Manager |
| `priya` | `password` | Store Manager |
| `suresh` | `password` | QC Manager |

---

## 📦 Tech Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · Motion · Zustand · Supabase · Vercel

---

## 🗂️ Key Files

| File | Purpose |
|---|---|
| `supabase/schema.sql` | ⭐ Run this in Supabase SQL Editor first |
| `src/hooks/useData.ts` | ⭐ All data operations — Supabase + localStorage fallback |
| `src/lib/supabase.ts` | Supabase client + typed DB helpers |
| `src/App.tsx` | All 11 module pages |
| `.env.example` | Copy to `.env` and add your keys |

---

MIT License — free to use and deploy commercially.
