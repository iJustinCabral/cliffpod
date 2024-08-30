import express from 'express';
import cron from 'node-cron';
import { fetchYesterdayEpisodes } from './jobs/fetchEpisodes';
import { storeEpisodes } from './jobs/storeEpisodes';
import { PodcastEpisode } from '@/types';
import { supabase } from '@/lib/supabase';

const app = express();

// Function to delete all rows from podcast_episodes table
async function clearPodcastEpisodes() {
  const { error } = await supabase
    .from('podcast_episodes')
    .delete()
    .not('id', 'is', null); // This ensures we delete all rows

  if (error) {
    console.error('Error clearing podcast episodes:', error);
    throw error;
  }
  console.log('Cleared all podcast episodes from the database');
}

// Run job daily at 12:00 AM
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled job...');
  try {
    // Clear all existing episodes
    await clearPodcastEpisodes();

    // Fetch new episodes
    const yesterdayEpisodes: PodcastEpisode[] = await fetchYesterdayEpisodes();
    
    // Store the new episodes
    if (yesterdayEpisodes.length > 0) {
      await storeEpisodes(yesterdayEpisodes);
      console.log(`Stored ${yesterdayEpisodes.length} new episodes in the database`);
    } else {
      console.log('No new episodes to store');
    }
    
    
    console.log('Scheduled job completed successfully');
  } catch (error) {
    console.error('Error in scheduled job:', error);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));