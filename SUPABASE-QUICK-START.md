# 🚀 Supabase Quick Start Guide

## TL;DR - 3 Steps to Permanent Storage

### Step 1: Run SQL Schema (2 minutes)
1. Login to [Supabase Dashboard](https://supabase.com)
2. Go to **SQL Editor**
3. Copy-paste entire `supabase-schema.sql` file
4. Click **Run**

### Step 2: Set Environment Variables

**For Local Testing:**
```bash
export SUPABASE_URL=https://smttcyfcjhfilblvcinn.supabase.co
export SUPABASE_ANON_KEY=your-anon-key-here
```

**For Render Deployment:**
Go to Render → Environment → Add variables:
```
SUPABASE_URL=https://smttcyfcjhfilblvcinn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Migrate Data (5-10 minutes)
```bash
cd aniVerse1
export SUPABASE_URL=https://smttcyfcjhfilblvcinn.supabase.co  
export SUPABASE_ANON_KEY=your-key-here
npm run migrate:supabase
```

**Output:**
```
🚀 Starting migration...
✅ Successfully migrated 923 series!
✅ Successfully migrated 1,456 episodes!
✅ Successfully migrated 20 latest episodes!
🎉 Migration complete!
```

---

## Deploy to Render

### Option A: Update Start Command (Recommended)
1. Go to Render Dashboard → Your Service
2. **Build Command:** `npm install`
3. **Start Command:** `cd aniVerse1 && npm run prod:supabase`
4. Save and redeploy

### Option B: Replace Main Server File
```bash
cd aniVerse1/server
mv index.js index-files.js.backup
mv index-supabase.js index.js
git add . && git commit -m "Use Supabase backend" && git push
```

---

## Test Everything Works

### Test Locally:
```bash
cd aniVerse1
npm run server:supabase
```

Visit: `http://localhost:4000/api/library`

### Test Deployed:
Visit: `https://aniverse1.onrender.com/api/library`

---

## Benefits You Get

| Before (Files) | After (Supabase) |
|----------------|------------------|
| ❌ Data deleted after 30 days | ✅ **Permanent storage** |
| ❌ Slow file system reads | ✅ **Fast PostgreSQL queries** |
| ❌ No search/filter | ✅ **Built-in search** |
| ❌ Manual backups needed | ✅ **Auto backups** |
| ❌ Limited to 512MB storage | ✅ **500MB+ free tier** |

---

## Need Help?

**Check Logs:**
```bash
cd aniVerse1
npm run server:supabase
```

**Common Issues:**
- **"Supabase credentials not found"** → Set SUPABASE_URL and SUPABASE_ANON_KEY env vars
- **"relation 'series' does not exist"** → Run supabase-schema.sql in Supabase SQL Editor
- **Empty library** → Run migration script: `npm run migrate:supabase`

**Full Documentation:** See `SUPABASE-SETUP.md`

---

## What Changed?

**Files Created:**
- `supabase-schema.sql` - Database tables
- `server/index-supabase.js` - New backend server
- `migrate-to-supabase.js` - Migration script
- `SUPABASE-SETUP.md` - Full docs
- `SUPABASE-QUICK-START.md` - This file

**Files Updated:**
- `package.json` - Added Supabase scripts
- `.env.example` - Added Supabase config

**Frontend:** No changes needed! API endpoints stay the same.

---

**Ready to go live? Follow the 3 steps above!** 🎉
