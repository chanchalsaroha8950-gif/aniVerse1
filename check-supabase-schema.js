import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase Schema...\n');
  
  // Try to get schema info by attempting a simple select
  console.log('📋 Checking SERIES table:');
  const { data: seriesData, error: seriesError } = await supabase
    .from('series')
    .select('*')
    .limit(1);
  
  if (seriesError) {
    console.error(`❌ Series table error: ${seriesError.message}`);
    if (seriesError.message.includes('does not exist') || seriesError.message.includes('relation')) {
      console.log('\n⚠️  The "series" table does not exist in Supabase!');
      console.log('\n📝 Action Required:');
      console.log('   1. Open Supabase SQL Editor: https://app.supabase.com/project/_/sql');
      console.log('   2. Run this file: aniVerse1/supabase-schema.sql');
      console.log('   3. Then run: aniVerse1/supabase-schema-updated.sql');
      console.log('   4. Re-run this check script');
      return;
    }
  } else {
    if (seriesData && seriesData.length > 0) {
      console.log(`✅ Found ${seriesData.length} series in database`);
      console.log('   Sample columns:', Object.keys(seriesData[0]).join(', '));
    } else {
      console.log('⚠️  Series table exists but is EMPTY');
      console.log('   Ready for data import!');
    }
  }
  
  console.log('\n📋 Checking EPISODES table:');
  const { data: episodesData, error: episodesError } = await supabase
    .from('episodes')
    .select('*')
    .limit(1);
  
  if (episodesError) {
    console.error(`❌ Episodes table error: ${episodesError.message}`);
  } else {
    if (episodesData && episodesData.length > 0) {
      console.log(`✅ Found ${episodesData.length} episodes in database`);
      console.log('   Sample columns:', Object.keys(episodesData[0]).join(', '));
    } else {
      console.log('⚠️  Episodes table exists but is EMPTY');
      console.log('   Ready for data import!');
    }
  }
  
  console.log('\n📋 Checking MOVIES table:');
  const { data: moviesData, error: moviesError } = await supabase
    .from('movies')
    .select('*')
    .limit(1);
  
  if (moviesError) {
    console.log(`⚠️  Movies table: ${moviesError.message}`);
    console.log('   (This is optional - only needed if you have movies)');
  } else {
    if (moviesData && moviesData.length > 0) {
      console.log(`✅ Found ${moviesData.length} movies in database`);
      console.log('   Sample columns:', Object.keys(moviesData[0]).join(', '));
    } else {
      console.log('⚠️  Movies table exists but is EMPTY');
    }
  }
  
  console.log('\n✅ Schema check complete!');
}

checkSchema().catch(console.error);
