import { startPodcastCacheJob } from '../app/jobs/updatePodcastCache';

// This function will be called when the app starts
export function initializeApp() {
  startPodcastCacheJob();
}