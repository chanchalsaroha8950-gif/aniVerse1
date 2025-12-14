# 🚀 AniVerse Deployment Guide

## Architecture Overview

```
Frontend (Vercel)  ←→  Backend (Render)  ←→  Database (Supabase)
    Port 5000              Port 4000              Cloud
```

---

## 📋 Prerequisites

1. GitHub account
2. Vercel account (free)
3. Render account (free)
4. Supabase project with credentials

---

## Part 1: Backend Deployment (Render)

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/aniverse.git
git push -u origin main
```

### Step 2: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `aniverse-backend-api`
   - **Root Directory:** Leave blank (or `.`)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index-supabase.js`
   - **Plan:** `Free`

### Step 3: Add Environment Variables in Render

Go to **Environment** tab and add:

| Key | Value | Source |
|-----|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `4000` | Manual |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase Dashboard → Settings → API |

### Step 4: Deploy & Get Backend URL

- Click **"Create Web Service"**
- Wait for deployment (2-3 minutes)
- Copy your backend URL: `https://aniverse-backend-api.onrender.com`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Update API URL

Create `.env.production` file in `aniVerse1/` folder:

```bash
VITE_API_BASE_URL=https://aniverse-backend-api.onrender.com/api
```

**Important:** Replace with your actual Render backend URL!

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `aniVerse1`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variable:**
   - Go to **Settings → Environment Variables**
   - Add: `VITE_API_BASE_URL` = `https://aniverse-backend-api.onrender.com/api`

6. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
cd aniVerse1
npm i -g vercel
vercel login
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? *Select your account*
- Link to existing project? **N**
- Project name? **aniverse** (or your choice)
- Directory? **.**
- Override settings? **N**

### Step 3: Add Environment Variable (CLI Method)

```bash
vercel env add VITE_API_BASE_URL
# Enter value: https://aniverse-backend-api.onrender.com/api
# Select environments: Production

vercel --prod  # Redeploy with env var
```

---

## Part 3: Testing

### Test Backend (Render)
```bash
curl https://aniverse-backend-api.onrender.com/
# Should return JSON with API info
```

### Test Frontend (Vercel)
Open your Vercel URL in browser:
```
https://aniverse.vercel.app
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** Backend not responding
```bash
# Check Render logs
Dashboard → Your Service → Logs tab
```

**Problem:** Database connection error
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Render environment variables
- Check Supabase project is active

### Frontend Issues

**Problem:** "Cannot connect to backend server"
- Check `VITE_API_BASE_URL` environment variable in Vercel
- Verify backend URL is correct and accessible
- Check browser console for CORS errors

**Problem:** Build fails on Vercel
```bash
# Make sure dependencies are in package.json
cd aniVerse1
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 📊 Free Tier Limits

### Render (Backend)
- ✅ 750 hours/month (enough for 1 app 24/7)
- ✅ Sleeps after 15 min inactivity (first request takes ~30s)
- ✅ Custom domain support
- ⚠️ Limited to 512 MB RAM

### Vercel (Frontend)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Custom domain support
- ✅ Auto SSL certificate

---

## 🔄 Auto-Deploy Setup

### Enable Auto-Deploy

**Render:**
- Already enabled via `render.yaml` (`autoDeploy: true`)
- Every push to `main` branch triggers deploy

**Vercel:**
- Automatically enabled when connected to GitHub
- Every push to `main` triggers deploy
- Preview deployments for pull requests

### Disable Auto-Deploy

**Render:** Dashboard → Service → Settings → Uncheck "Auto-Deploy"
**Vercel:** Dashboard → Project → Settings → Git → Disable

---

## 🌐 Custom Domain Setup

### Vercel (Frontend)

1. Go to Project → Settings → Domains
2. Add your domain: `aniverse.com`
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

### Render (Backend)

1. Go to Service → Settings → Custom Domain
2. Add: `api.aniverse.com`
3. Update DNS with provided CNAME
4. Update frontend env var: `VITE_API_BASE_URL=https://api.aniverse.com/api`

---

## 📝 Quick Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL copied
- [ ] Supabase credentials added to Render
- [ ] Backend health check passing
- [ ] Frontend `.env.production` created with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Environment variable added to Vercel
- [ ] Frontend loads without errors
- [ ] Test: Homepage shows anime list
- [ ] Test: Click on anime → Episode plays

---

## 🎉 Your Live URLs

After deployment:

- **Frontend:** `https://aniverse.vercel.app` or `https://your-project.vercel.app`
- **Backend API:** `https://aniverse-backend-api.onrender.com`
- **Database:** Managed by Supabase

---

## 💡 Pro Tips

1. **Render free tier sleeps:** First request after 15 min takes time. Consider:
   - Upgrading to paid plan ($7/month)
   - Using cron-job.org to ping every 10 minutes

2. **Environment variables:** Always use environment variables, never hardcode URLs

3. **Monitor logs:** Check Render and Vercel logs regularly

4. **Updates:** Push to GitHub → Automatic deployment to both platforms

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

---

**Happy Deploying! 🚀**
