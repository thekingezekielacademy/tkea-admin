import { NextRequest, NextResponse } from 'next/server';
import { mailerLiteService, MailerLiteSubscriber } from '@/services/mailerliteService';
import { z } from 'zod';

// Validation schema for subscription request
const subscribeSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  groups: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = subscribeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    const { email, name, groups } = validationResult.data;

    // Check if MailerLite is configured
    if (!mailerLiteService.isConfigured()) {
      console.error('MailerLite service not configured');
      return NextResponse.json(
        { error: 'Newsletter service is currently unavailable' },
        { status: 503 }
      );
    }

    // Check if subscriber already exists
    const existingSubscriber = await mailerLiteService.getSubscriber(email);
    
    if (existingSubscriber) {
      // If subscriber exists, update their information if name is provided
      if (name && existingSubscriber.fields?.name !== name) {
        await mailerLiteService.updateSubscriber(email, { name });
      }
      
      return NextResponse.json(
        { 
          message: 'You are already subscribed to our newsletter!',
          subscriber: existingSubscriber
        },
        { status: 200 }
      );
    }

    // Create new subscriber
    const subscriberData: MailerLiteSubscriber = {
      email: email.toLowerCase().trim(),
      fields: name ? { name: name.trim() } : undefined,
      groups: groups || undefined
    };

    const subscriber = await mailerLiteService.subscribe(subscriberData);

    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter!',
        subscriber: {
          id: subscriber.id,
          email: subscriber.email,
          status: subscriber.status
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already subscribed')) {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 409 }
        );
      } else if (error.message.includes('Invalid MailerLite API key')) {
        console.error('MailerLite API key is invalid');
        return NextResponse.json(
          { error: 'Newsletter service configuration error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
