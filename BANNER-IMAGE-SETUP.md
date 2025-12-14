# Banner Image Feature Setup Guide

## ✅ Kya Ho Gaya Hai (What's Done)

1. **Frontend Code** - Already banner_image display kar rahi hai ✅
   - Series.jsx mein banner image show hota hai
   - Movie.jsx mein banner image show hota hai
   - Description aur year bhi display ho rahe hain

2. **Backend Code** - Updated to return banner_image ✅
   - Server ab `banner_image` field return karega
   - Genres aur other fields bhi properly return honge

## 🔧 Aapko Kya Karna Hai (What You Need to Do)

### Step 1: Supabase Database Update

1. **Supabase Dashboard** pe jao: https://supabase.com/dashboard
2. Apna project select karo
3. Left sidebar mein **SQL Editor** pe click karo
4. **New Query** button click karo
5. Neeche diye gaye SQL code ko copy karke paste karo:

```sql
-- Add banner_image column to series table
ALTER TABLE series ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE series ADD COLUMN IF NOT EXISTS year INTEGER;

-- Create Movies Table (separate from series)
CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  banner_image TEXT,
  thumbnail TEXT,
  genres TEXT[],
  status TEXT DEFAULT 'Movie',
  year INTEGER,
  release_year INTEGER,
  runtime INTEGER,
  languages TEXT[],
  servers JSONB DEFAULT '[]'::jsonb,
  url TEXT,
  tmdb_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for movies table
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_updated ON movies(updated_at DESC);

-- Trigger to auto-update updated_at for movies
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

6. **RUN** button pe click karo

### Step 2: Banner Images Add Karo

Ab aapko apne series aur movies mein banner_image URLs add karne honge.

**Option A: Supabase Table Editor se**
1. Supabase Dashboard mein **Table Editor** pe jao
2. `series` table ya `movies` table select karo
3. Koi bhi row pe click karo aur `banner_image` column mein image URL paste karo
4. Save karo

**Option B: SQL se (Bulk Update)**
```sql
-- Example: Update banner_image for a specific series
UPDATE series 
SET banner_image = 'https://image.tmdb.org/t/p/original/your-banner-image.jpg'
WHERE slug = 'your-series-slug';

-- Example: Update banner_image for a movie
UPDATE movies 
SET banner_image = 'https://image.tmdb.org/t/p/original/your-banner-image.jpg'
WHERE slug = 'your-movie-slug';
```

### Step 3: Test Karo

1. Koi series ya movie select karo
2. **Banner image top pe display hona chahiye**
3. Uske neeche **poster image** (same rahega)
4. Description aur year bhi show hona chahiye

## 📝 Banner Image URL Kahan Se Laein?

### TMDB (The Movie Database) se:
1. https://www.themoviedb.org/ pe jao
2. Apni series/movie search karo
3. **Backdrop** images section mein jao
4. Image pe right-click karke "Copy image address"
5. Format: `https://image.tmdb.org/t/p/original/xxxxx.jpg`

### Ya koi bhi public image URL use kar sakte ho!

## 🎨 Kaise Dikhega (How It Will Look)

```
┌─────────────────────────────────────────┐
│                                         │
│        BANNER IMAGE (Wide)              │ ← Yahan banner_image
│                                         │
└─────────────────────────────────────────┘

┌──────┐  Series/Movie Title
│      │  Description...
│Poster│  Year: 2024
│Image │  Genres: Action, Drama
│      │
└──────┘
```

## ❓ Agar Problem Aaye

1. **Banner image nahi dikh raha?**
   - Check karo SQL migration run hua ya nahi
   - Check karo `banner_image` column mein URL hai ya nahi
   - Browser console check karo (F12 → Console)

2. **Data nahi aa raha?**
   - Backend server running hai ya nahi check karo
   - Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) sahi hain ya nahi

3. **Movies table error aa raha?**
   - Movies table create hua ya nahi check karo
   - SQL migration poora run hua ya nahi verify karo

## 🚀 Quick Test

Agar testing ke liye ek example chahiye:

```sql
-- Test Series with Banner
INSERT INTO series (slug, title, description, poster, banner_image, year, genres)
VALUES (
  'test-anime',
  'Test Anime Series',
  'This is a test anime series to check banner images.',
  'https://via.placeholder.com/300x450',
  'https://via.placeholder.com/1920x600',
  2024,
  ARRAY['Action', 'Adventure']
);

-- Test Movie with Banner
INSERT INTO movies (slug, title, description, poster, banner_image, year, genres, servers)
VALUES (
  'test-movie',
  'Test Movie',
  'This is a test movie to check banner images.',
  'https://via.placeholder.com/300x450',
  'https://via.placeholder.com/1920x600',
  2024,
  ARRAY['Action', 'Sci-Fi'],
  '[]'::jsonb
);
```

## ✨ Done!

Ab jab bhi aap koi series ya movie select karoge:
- ✅ Top pe banner image dikhega
- ✅ Poster image same rahega (side mein)
- ✅ Description dikhega
- ✅ Year dikhega
- ✅ Genres display honge

Enjoy your updated AniVerse! 🎉
