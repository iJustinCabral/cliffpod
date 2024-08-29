import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Add subscriber to Resend audience
    const { data: contact, error: contactError } = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
    });

    if (contactError) {
      throw new Error(contactError.message);
    }

    // Send welcome email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Your Podcast Newsletter <newsletter@tldl.news>',
      to: email,
      subject: 'Welcome to Your Podcast Newsletter',
      html: '<p>Thank you for subscribing to our podcast newsletter!</p>'
    });

    if (emailError) {
      throw new Error(emailError.message);
    }

    return NextResponse.json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}