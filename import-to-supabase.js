import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ANIVERSE2_DATA_DIR = path.join(__dirname, '../aniVerse2/data');

async function importSeries() {
  console.log('🚀 Starting import from aniVerse2 to Supabase...\n');
  
  if (!fs.existsSync(ANIVERSE2_DATA_DIR)) {
    console.error(`❌ Directory not found: ${ANIVERSE2_DATA_DIR}`);
    process.exit(1);
  }

  const seriesDirs = fs.readdirSync(ANIVERSE2_DATA_DIR);
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const dirName of seriesDirs) {
    const seriesPath = path.join(ANIVERSE2_DATA_DIR, dirName);
    
    if (!fs.statSync(seriesPath).isDirectory()) continue;

    const metaPath = path.join(seriesPath, 'series.json');
    if (!fs.existsSync(metaPath)) {
      skipped++;
      continue;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      
      const seriesData = {
        slug: metadata.slug || dirName,
        title: metadata.title || dirName.replace(/-/g, ' '),
        description: metadata.synopsis || metadata.description || '',
        poster: metadata.poster || metadata.thumbnail || null,
        banner_image: metadata.banner_image || metadata.background || metadata.backdrop || null,
        genres: metadata.genres || [],
        status: metadata.status || 'Available',
        year: metadata.release_year || metadata.year || null,
        total_episodes: metadata.totalEpisodes || null,
        tmdb_id: metadata.tmdb_id || null
      };

      const { data, error } = await supabase
        .from('series')
        .upsert(seriesData, { onConflict: 'slug' })
        .select();

      if (error) {
        console.error(`❌ Error importing ${dirName}:`, error.message);
        errors++;
        continue;
      }

      console.log(`✅ Imported: ${seriesData.title} ${seriesData.banner_image ? '(with banner)' : ''}`);
      imported++;

      const seasons = fs.readdirSync(seriesPath).filter(f => f.startsWith('season-'));
      
      for (const seasonDir of seasons) {
        const seasonNum = parseInt(seasonDir.replace('season-', ''));
        const seasonPath = path.join(seriesPath, seasonDir);
        const episodeFiles = fs.readdirSync(seasonPath).filter(f => f.endsWith('.json'));

        for (const epFile of episodeFiles) {
          try {
            const epData = JSON.parse(fs.readFileSync(path.join(seasonPath, epFile), 'utf-8'));
            
            const episodeData = {
              series_slug: seriesData.slug,
              season: seasonNum,
              episode: epData.episode || parseInt(epFile.replace('.json', '')),
              title: epData.episode_title || epData.title || `Episode ${epData.episode}`,
              thumbnail: epData.thumbnail || epData.episode_card_thumbnail || null,
              episode_main_poster: epData.episode_main_poster || null,
              episode_card_thumbnail: epData.episode_card_thumbnail || null,
              episode_list_thumbnail: epData.episode_list_thumbnail || null,
              video_player_thumbnail: epData.video_player_thumbnail || null,
              servers: epData.servers || []
            };

            await supabase
              .from('episodes')
              .upsert(episodeData, { onConflict: 'series_slug,season,episode' });

          } catch (err) {
            console.error(`   ⚠️ Episode error: ${epFile}`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${dirName}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
}

importSeries().catch(console.error);
