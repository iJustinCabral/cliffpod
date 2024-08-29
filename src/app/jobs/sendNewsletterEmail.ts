import { CacheService } from '@/services/CacheService';
import axios from 'axios';
import cron from 'node-cron';

const sendNewsletterEmails = async () => {
  try {
    const newsletter = CacheService.get('latestNewsletter');
    if (!newsletter) {
      console.log('No newsletter found in cache');
      return;
    }

    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX) {
      throw new Error('Mailchimp configuration is missing');
    }

    // Fetch subscribers from Mailchimp API
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const subscribersResponse = await axios.get(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        headers: {
          Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
        },
        params: {
          status: 'subscribed',
          fields: 'members.email_address',
        },
      }
    );

    const subscribers = subscribersResponse.data.members.map((member: any) => member.email_address);

    // Send transactional email to each subscriber
    for (const email of subscribers) {
      await axios.post(
        `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/messages/send-template`,
        {
          template_name: 'Daily Podcast Newsletter',
          template_content: [
            {
              name: 'newsletter_content',
              content: newsletter,
            },
          ],
          message: {
            subject: 'Your Daily Podcast Newsletter',
            from_email: 'your-sender-email@example.com',
            from_name: 'Your Podcast Newsletter',
            to: [{ email }],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
          },
        }
      );
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