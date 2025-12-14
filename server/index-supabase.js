import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
let useSampleData = false;
let sampleData = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  WARNING: SUPABASE_URL and SUPABASE_ANON_KEY not set');
  console.log('📦 Using sample data for development...');
  useSampleData = true;
  
  try {
    const sampleDataPath = join(__dirname, '../src/data/sample-series.json');
    sampleData = JSON.parse(readFileSync(sampleDataPath, 'utf-8'));
    console.log('✅ Loaded sample data successfully');
  } catch (error) {
    console.error('❌ Failed to load sample data:', error.message);
    sampleData = { series: [], trending: [] };
  }
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
}

app.use(cors());
app.use(express.json());

console.log('🚀 Starting AniVerse Supabase API Server...');
console.log(`📊 Data source: ${useSampleData ? 'Sample Data (Development)' : 'Supabase (Production)'}`);

app.get('/', (req, res) => {
  res.json({
    message: '🎬 AniVerse API Server (Supabase)',
    status: 'running',
    database: 'Supabase PostgreSQL',
    endpoints: {
      library: '/api/library',
      series: '/api/series/:slug',
      movies: '/api/movies/:slug',
      episode: '/api/series/:slug/episode/:season-:episode',
      latestEpisodes: '/api/latest-episodes'
    }
  });
});

app.get('/api/library', async (req, res) => {
  try {
    if (useSampleData) {
      const library = (sampleData.series || []).map(s => ({
        type: s.id === 'campfire-cooking' || s.id === 'hunter-x-hunter-hindi' || s.id === 'food-wars' ? 'series' : 'movie',
        slug: s.slug,
        title: s.title,
        poster: s.poster,
        genres: s.genres || [],
        synopsis: s.synopsis || '',
        status: s.status || 'Available',
        release_year: s.year,
        totalEpisodes: s.totalEpisodes
      }));
      return res.json(library);
    }

    const [seriesResult, moviesResult] = await Promise.all([
      supabase.from('series').select('*').order('title'),
      supabase.from('movies').select('*').order('title')
    ]);

    if (seriesResult.error) throw seriesResult.error;
    if (moviesResult.error) throw moviesResult.error;

    const library = [
      ...(seriesResult.data || []).map(s => ({
        type: 'series',
        slug: s.slug,
        title: s.title,
        poster: s.poster,
        genres: s.genres || [],
        synopsis: s.description || '',
        status: 'Available',
        release_year: s.year,
        totalEpisodes: null
      })),
      ...(moviesResult.data || []).map(m => ({
        type: 'movie',
        slug: m.slug,
        title: m.title,
        poster: m.poster,
        genres: m.genres || [],
        synopsis: m.description || '',
        status: 'Movie',
        release_year: m.year,
        totalEpisodes: 1
      }))
    ];

    res.json(library);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

app.get('/api/series/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (useSampleData) {
      const series = (sampleData.series || []).find(s => s.slug === slug);
      if (!series) {
        return res.status(404).json({ error: 'Series not found' });
      }

      const seasons = {};
      const episodesBySeason = {};
      
      (series.episodes || []).forEach(ep => {
        const seasonKey = '1';
        if (!seasons[seasonKey]) {
          seasons[seasonKey] = [];
          episodesBySeason[seasonKey] = [];
        }
        seasons[seasonKey].push(String(ep.number));
        episodesBySeason[seasonKey].push({
          id: `1-${ep.number}`,
          number: ep.number,
          title: ep.title,
          duration: ep.duration || '',
          thumbnail: ep.thumbnail,
          description: ep.description || ''
        });
      });

      return res.json({
        type: 'series',
        slug: series.slug,
        title: series.title,
        description: series.synopsis || '',
        poster: series.poster,
        genres: series.genres || [],
        status: series.status || 'Available',
        release_year: series.year,
        totalEpisodes: series.totalEpisodes || series.episodes?.length || 0,
        seasons,
        episodes: episodesBySeason
      });
    }
    
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .single();

    if (seriesError || !series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_slug', slug)
      .order('season')
      .order('episode');

    if (episodesError) throw episodesError;

    const seasons = {};
    const episodesBySeason = {};

    (episodes || []).forEach(ep => {
      const seasonKey = String(ep.season);
      
      if (!seasons[seasonKey]) {
        seasons[seasonKey] = [];
        episodesBySeason[seasonKey] = [];
      }

      seasons[seasonKey].push(String(ep.episode));
      episodesBySeason[seasonKey].push({
        id: `${ep.season}-${ep.episode}`,
        number: ep.episode,
        title: ep.title,
        duration: '',
        thumbnail: ep.episode_card_thumbnail || ep.episode_list_thumbnail || ep.thumbnail,
        episode_main_poster: ep.episode_main_poster,
        episode_card_thumbnail: ep.episode_card_thumbnail,
        episode_list_thumbnail: ep.episode_list_thumbnail,
        video_player_thumbnail: ep.video_player_thumbnail,
        description: ''
      });
    });

    const result = {
      type: 'series',
      slug: series.slug,
      title: series.title,
      description: series.description || '',
      poster: series.poster,
      banner_image: series.banner_image,
      genres: series.genres || [],
      status: series.status || 'Available',
      release_year: series.year || series.release_year,
      totalEpisodes: episodes?.length || 0,
      seasons,
      episodes: episodesBySeason
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

app.get('/api/series/:slug/episode/:episodeId', async (req, res) => {
  try {
    const { slug, episodeId } = req.params;
    
    const match = episodeId.match(/(\d+)-(\d+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid episode format. Use season-episode (e.g., 1-5)' });
    }

    const [, season, episode] = match;

    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_slug', slug)
      .eq('season', parseInt(season))
      .eq('episode', parseInt(episode))
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const result = {
      series: slug,
      season: data.season,
      episode: data.episode,
      episode_title: data.title,
      title: data.title,
      thumbnail: data.episode_card_thumbnail || data.episode_list_thumbnail || data.thumbnail,
      episode_main_poster: data.episode_main_poster,
      episode_card_thumbnail: data.episode_card_thumbnail,
      episode_list_thumbnail: data.episode_list_thumbnail,
      video_player_thumbnail: data.video_player_thumbnail,
      servers: data.servers || [],
      description: '',
      duration: '',
      releaseDate: ''
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching episode:', error);
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

app.get('/api/movies/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: movie, error } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const result = {
      type: 'movie',
      slug: movie.slug,
      title: movie.title,
      description: movie.description || '',
      poster: movie.poster,
      banner_image: movie.banner_image,
      movie_poster: movie.poster,
      thumbnail: movie.poster,
      genres: movie.genres || [],
      languages: movie.languages || [],
      status: 'Movie',
      release_year: movie.year || movie.release_year,
      runtime: movie.runtime,
      servers: movie.servers || []
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.get('/api/latest-episodes', async (req, res) => {
  try {
    if (useSampleData) {
      const episodes = [];
      (sampleData.series || []).forEach(s => {
        (s.episodes || []).slice(0, 3).forEach(ep => {
          episodes.push({
            seriesSlug: s.slug,
            series: s.title,
            season: 1,
            episode: ep.number,
            title: ep.title,
            thumbnail: ep.thumbnail,
            addedAt: ep.releaseDate
          });
        });
      });
      return res.json(episodes.slice(0, 9));
    }

    const { data, error } = await supabase
      .from('latest_episodes')
      .select('*')
      .order('added_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const result = (data || []).map(ep => ({
      seriesSlug: ep.series_slug,
      series: ep.series_title,
      season: ep.season,
      episode: ep.episode,
      title: ep.episode_title,
      thumbnail: ep.thumbnail,
      addedAt: ep.added_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching latest episodes:', error);
    res.status(500).json({ error: 'Failed to fetch latest episodes' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log('📊 Endpoints:');
  console.log('   - GET /api/library');
  console.log('   - GET /api/series/:slug');
  console.log('   - GET /api/series/:slug/episode/:season-:episode');
  console.log('   - GET /api/movies/:slug');
  console.log('   - GET /api/latest-episodes');
});
