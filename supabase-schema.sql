-- AniVerse Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Series Table
CREATE TABLE IF NOT EXISTS series (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  poster TEXT,
  thumbnail TEXT,
  genres TEXT[],
  status TEXT DEFAULT 'Unknown',
  release_year INTEGER,
  total_episodes INTEGER,
  type TEXT DEFAULT 'series' CHECK (type IN ('series', 'movie')),
  url TEXT,
  tmdb_id TEXT,
  tvdb_id TEXT,
  languages TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Episodes Table
CREATE TABLE IF NOT EXISTS episodes (
  id BIGSERIAL PRIMARY KEY,
  series_slug TEXT NOT NULL REFERENCES series(slug) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  episode_title TEXT,
  description TEXT,
  duration TEXT,
  release_date TEXT,
  watch_url TEXT,
  thumbnail TEXT,
  episode_main_poster TEXT,
  episode_card_thumbnail TEXT,
  episode_list_thumbnail TEXT,
  video_player_thumbnail TEXT,
  servers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_slug, season, episode)
);

-- Latest Episodes Table (for faster queries)
CREATE TABLE IF NOT EXISTS latest_episodes (
  id BIGSERIAL PRIMARY KEY,
  series_slug TEXT NOT NULL REFERENCES series(slug) ON DELETE CASCADE,
  series_title TEXT,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  episode_title TEXT,
  thumbnail TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_series_type ON series(type);
CREATE INDEX IF NOT EXISTS idx_series_updated ON series(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_series_slug ON episodes(series_slug);
CREATE INDEX IF NOT EXISTS idx_episodes_season_episode ON episodes(season, episode);
CREATE INDEX IF NOT EXISTS idx_latest_episodes_added ON latest_episodes(added_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE series IS 'Stores anime series and movie metadata';
COMMENT ON TABLE episodes IS 'Stores individual episode data including video servers';
COMMENT ON TABLE latest_episodes IS 'Tracks recently added episodes for homepage display';
