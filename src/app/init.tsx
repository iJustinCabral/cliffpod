import { startPodcastCacheJob } from '../app/jobs/updatePodcastCache';
import { startSendNewsletterEmailsJob } from '../app/jobs/sendNewsletterEmail';

// This function will be called when the app starts
export function initializeApp() {
  startPodcastCacheJob();
  startSendNewsletterEmailsJob();
}