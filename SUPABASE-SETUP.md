# 🗄️ Supabase Integration Guide

## Overview

This guide will help you migrate from file-based storage (`data/` folder) to **Supabase PostgreSQL** for permanent, cloud-based data storage.

### Why Supabase?

- ✅ **Permanent Storage** - No 30-day data deletion (unlike Render's free tier ephemeral storage)
- ✅ **PostgreSQL Database** - Reliable, fast, and scalable
- ✅ **Free Tier** - 500MB database, perfect for anime library
- ✅ **Cloud Hosted** - Access from anywhere

---

## Step 1: Create Supabase Tables

1. **Login to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Open your project: `smttcyfcjhfilblvcinn.supabase.co`

2. **Run SQL Schema**
   - Go to **SQL Editor** in Supabase dashboard
   - Copy the entire contents of `supabase-schema.sql`
   - Paste and click **Run**

This creates 3 tables:
- `series` - Stores anime series and movies metadata
- `episodes` - Stores episode data with video servers
- `latest_episodes` - Tracks recently added episodes

---

## Step 2: Set Environment Variables

### For Local Development

Create `.env` file in `aniVerse1` folder:

```bash
SUPABASE_URL=https://smttcyfcjhfilblvcinn.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=4000
```

### For Render Deployment

1. Go to your **Render Dashboard**
2. Select your backend service
3. Go to **Environment** tab
4. Add these variables:

```
SUPABASE_URL = https://smttcyfcjhfilblvcinn.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT = 4000
```

⚠️ **Security Note:** Never commit `.env` files to GitHub! They're already in `.gitignore`.

---

## Step 3: Migrate Existing Data

Run the migration script to copy all data from `data/` folder to Supabase:

```bash
cd aniVerse1
npm run migrate:supabase
```

This will:
1. Read all series from `data/` folder
2. Upload series metadata to Supabase `series` table
3. Upload all episodes to Supabase `episodes` table
4. Show summary of migrated data

**Output Example:**
```
🚀 Starting migration from data/ folder to Supabase...

📺 Migrating series data...
  ✅ Prepared: Hunter x Hunter Hindi Dub
  ✅ Prepared: Food Wars! Shokugeki no Soma
  ... (923 series)

📤 Uploading 923 series to Supabase...
✅ Successfully migrated 923 series!

🎬 Migrating episode data...
  📊 Prepared 100 episodes so far...
  📊 Prepared 200 episodes so far...
  ...

📤 Uploading episodes to Supabase in batches...
  ✅ Batch 1/15 uploaded
  ✅ Batch 2/15 uploaded
  ...
✅ Successfully migrated 1,456 episodes!

🎉 Migration complete!
📊 Summary:
   - Total series in Supabase: 923
   - Total episodes in Supabase: 1,456
```

---

## Step 4: Test Supabase Backend Locally

Start the Supabase-powered backend server:

```bash
cd aniVerse1
npm run server:supabase
```

Test the API endpoints:
```bash
# Test library endpoint
curl http://localhost:4000/api/library

# Test series detail
curl http://localhost:4000/api/series/hunter-x-hunter-hindi-dub

# Test episode data
curl http://localhost:4000/api/series/hunter-x-hunter-hindi-dub/episode/2-100
```

---

## Step 5: Deploy to Render

### Update Your Backend on Render

1. **Replace server file**
   - Rename `server/index.js` to `server/index-files.js` (backup)
   - Rename `server/index-supabase.js` to `server/index.js`

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Switch to Supabase backend"
   git push origin main
   ```

3. **Render will auto-deploy** with the new Supabase backend

### OR: Update Build Command

Alternatively, in Render dashboard:
- **Build Command:** `npm install`
- **Start Command:** `npm run prod:supabase`

---

## Troubleshooting

### Error: "Supabase credentials not found"
- Check environment variables are set in Render
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct

### Error: "relation 'series' does not exist"
- Run the SQL schema in Supabase SQL Editor
- Make sure you're connected to the correct Supabase project

### Migration takes too long
- The script uploads in batches of 100 episodes
- For 1,000+ episodes, it may take 2-3 minutes

---

## Package.json Scripts

```json
"server:supabase"    - Start Supabase backend (dev)
"start:supabase"     - Start frontend + Supabase backend
"prod:supabase"      - Start Supabase backend (production)
"migrate:supabase"   - Migrate data/ folder to Supabase
```

---

## Benefits After Migration

✅ **No More Data Loss** - Data persists forever in Supabase  
✅ **Faster Queries** - PostgreSQL is faster than file system  
✅ **Scalable** - Can handle millions of episodes  
✅ **Better Features** - Search, filtering, sorting built-in  
✅ **No File Management** - No need to manage `data/` folder  

---

## Next Steps

After successful migration:

1. ✅ Test all API endpoints
2. ✅ Verify frontend still works
3. ✅ Deploy to Render with Supabase
4. ✅ (Optional) Delete `data/` folder to save space on Render

---

**Need Help?** Check Supabase docs: https://supabase.com/docs
