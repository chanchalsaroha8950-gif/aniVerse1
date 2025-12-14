-- AniVerse Supabase Database Schema with Banner Images
-- Run this SQL in your Supabase SQL Editor to update the tables

-- Add banner_image column to series table if it doesn't exist
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

COMMENT ON TABLE movies IS 'Stores anime movie metadata with banner images';
COMMENT ON COLUMN series.banner_image IS 'Banner/backdrop image URL for series detail page';
COMMENT ON COLUMN movies.banner_image IS 'Banner/backdrop image URL for movie detail page';
