import { CacheService } from '@/services/CacheService';
import { Resend } from 'resend';
import cron from 'node-cron';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNewsletterEmails = async () => {
  try {
    const newsletter = CacheService.get('latestNewsletter');
    if (!newsletter || typeof newsletter !== 'string') {
      console.log('No valid newsletter found in cache');
      return;
    }

    // Fetch subscribers from Resend audience
    const { data: audience, error: audienceError } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
    });

    if (audienceError) {
      throw new Error(audienceError.message);
    }

    if (!audience || !audience.data) {
      throw new Error('No audience data received');
    }

    const subscribers = audience.data.map(contact => contact.email);

    // Send email to each subscriber
    for (const email of subscribers) {
      const { data, error } = await resend.emails.send({
        from: 'Your Podcast Newsletter <newsletter@tldl.news>',
        to: email,
        subject: 'Your Daily Podcast Newsletter',
        html: newsletter
      });

      if (error) {
        console.error(`Error sending email to ${email}:`, error);
      }
    }

    console.log(`Newsletter sent successfully to ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('Error sending newsletter emails:', error);
  }
};

export const startSendNewsletterEmailsJob = () => {
  // Run every day at 3:00 AM EST (after the newsletter generation)
  cron.schedule('0 3 * * *', sendNewsletterEmails, {
    timezone: "America/New_York"
  });
};