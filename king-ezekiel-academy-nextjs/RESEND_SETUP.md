# Resend Email Setup Guide

This guide explains how to set up and use Resend for sending transactional emails in King Ezekiel Academy.

## 📋 Prerequisites

1. Create a Resend account at [https://resend.com](https://resend.com)
2. Verify your domain (recommended) or use Resend's default domain for testing
3. Get your API key from the Resend dashboard

## 🔧 Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file (for local development) or your production environment:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@thekingezekielacademy.com
```

**Important Notes:**
- Replace `re_your_resend_api_key_here` with your actual Resend API key
- The `RESEND_FROM_EMAIL` should be an email address from your verified domain in Resend
- If you haven't verified a domain, you can use Resend's test domain: `onboarding@resend.dev` (for testing only)

### 2. Verify Configuration

To verify that Resend is properly configured, check the console logs when:
- A user signs up (welcome email should be sent)
- A course becomes available (notification emails should be sent)

If you see warnings like "Resend API key not configured", make sure your environment variables are set correctly.

## 📧 Email Types

### 1. Welcome Email (Signup)

**Triggered when:** A user successfully signs up for an account

**Template:** `src/services/emailService.ts` - `getWelcomeEmailTemplate()`

**Features:**
- Personalized greeting with user's name
- Welcome message
- Call-to-action button to browse courses
- Contact information

### 2. Course Available Notification

**Triggered when:** A course that users requested notifications for becomes available

**Template:** `src/services/emailService.ts` - `getCourseAvailableEmailTemplate()`

**Features:**
- Course title
- Direct link to the course
- Personalized greeting

## 🔌 API Endpoints

### Send Course Notifications

**POST** `/api/courses/send-notifications`

Send notifications to all users who requested notifications for a course.

**Request Body:**
```json
{
  "courseId": "course-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 10 notifications",
  "sent": 10,
  "failed": 0,
  "total": 10
}
```

**Usage:**
This endpoint is automatically called when:
- A scheduled course is published (via `courseScheduler.ts`)
- An admin manually publishes a course

You can also call it manually when a course becomes available:
```bash
curl -X POST https://app.thekingezekielacademy.com/api/courses/send-notifications \
  -H "Content-Type: application/json" \
  -d '{"courseId": "your-course-id"}'
```

### Check Notification Status

**GET** `/api/courses/send-notifications?courseId=xxx`

Check how many users are waiting for notifications for a course.

**Response:**
```json
{
  "courseId": "course-uuid",
  "courseTitle": "Course Name",
  "total": 15,
  "pending": 5,
  "sent": 10
}
```

## 🎯 User Notify Me Functionality

### Subscribe to Notifications

**POST** `/api/courses/notify`

Users can click "Notify Me" on a scheduled course to receive an email when it becomes available.

**Request Body:**
```json
{
  "courseId": "course-uuid"
}
```

### Check Subscription Status

**GET** `/api/courses/notify?courseId=xxx`

Check if the current user is subscribed to notifications for a course.

### Unsubscribe

**DELETE** `/api/courses/notify`

Remove a user from the notification list for a course.

## 🗄️ Database

The system uses a `course_notifications` table to track user notifications:

```sql
CREATE TABLE course_notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  course_id TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);
```

Run the migration:
```bash
# The migration file is located at:
supabase/migrations/20250120_001_create_course_notifications.sql
```

## 🧪 Testing

### Test Welcome Email

1. Sign up a new user account
2. Check the user's email inbox (and spam folder)
3. You should receive a welcome email

### Test Course Notifications

1. Create a scheduled course
2. Have a user click "Notify Me" on that course
3. When the course is published, check if the user receives an email
4. Or manually trigger: `POST /api/courses/send-notifications` with the course ID

### Test Resend Configuration

The email service will log warnings if Resend is not properly configured. Check your console logs for:
- "Resend API key not configured" - means `RESEND_API_KEY` is missing
- Email send failures - check your API key and from email address

## 🔒 Security

- API keys are stored as environment variables (never commit them)
- Email sending failures don't block user registration
- Row Level Security (RLS) is enabled on the `course_notifications` table
- Users can only view/manage their own notifications

## 📝 Troubleshooting

### Emails not sending?

1. **Check API Key:** Verify `RESEND_API_KEY` is set correctly
2. **Check From Email:** Ensure `RESEND_FROM_EMAIL` is from a verified domain
3. **Check Logs:** Look for error messages in the console
4. **Check Resend Dashboard:** View email logs and delivery status
5. **Check Spam:** Sometimes emails end up in spam folders

### "Resend not configured" warning?

- Make sure `RESEND_API_KEY` is in your environment variables
- Restart your development server after adding the variable
- Check that the variable name matches exactly: `RESEND_API_KEY`

### Database errors?

- Run the migration: `supabase/migrations/20250120_001_create_course_notifications.sql`
- Verify RLS policies are created correctly
- Check that the `profiles` table exists (for user email/name lookups)

## 🚀 Production Deployment

1. Add environment variables to your hosting platform (Vercel, etc.)
2. Verify your domain in Resend
3. Update `RESEND_FROM_EMAIL` to use your verified domain
4. Test email sending in production
5. Monitor Resend dashboard for delivery rates

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Service Code](../src/services/emailService.ts)

