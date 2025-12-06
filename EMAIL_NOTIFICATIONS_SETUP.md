# Email Notifications Setup Guide

This guide explains how to set up email notifications for course publishing and scheduling using Resend.

## 📋 Prerequisites

1. Resend account with API key (you mentioned you already have this set up)
2. Verified domain in Resend (or use test domain for development)

## 🔧 Setup Instructions

### 1. Environment Variables

Add the following environment variables to your React app:

**For Create React App (CRA):**
```bash
REACT_APP_RESEND_API_KEY=re_your_resend_api_key_here
REACT_APP_RESEND_FROM_EMAIL=noreply@thekingezekielacademy.com
```

**For Vite:**
```bash
VITE_RESEND_API_KEY=re_your_resend_api_key_here
VITE_RESEND_FROM_EMAIL=noreply@thekingezekielacademy.com
```

**For Production (Vercel/Netlify/etc.):**
1. Go to your hosting platform's environment variables settings
2. Add:
   - `REACT_APP_RESEND_API_KEY` (or `VITE_RESEND_API_KEY` depending on your build tool)
   - `REACT_APP_RESEND_FROM_EMAIL` (or `VITE_RESEND_FROM_EMAIL`)

### 2. Local Development Setup

1. Create a `.env` file in the root of your project (if using CRA) or `.env.local` (if using Vite)
2. Add the environment variables above
3. **Restart your development server** after adding the variables

### 3. Verify Configuration

The email service will check if Resend is configured. You'll see warnings in the console if:
- Resend API key is not set
- Emails fail to send

## 📧 Email Types

### 1. Course Published Notification

**Triggered when:** A course is created and published immediately

**Sent to:** All users with email addresses in the `profiles` table

**Template:** Course available email with:
- Course title
- Direct link to the course
- Personalized greeting

### 2. Course Scheduled Notification

**Triggered when:** A course is scheduled for a future date

**Sent to:** All users with email addresses in the `profiles` table

**Template:** Course scheduled email with:
- Course title
- Scheduled date and time
- Direct link to the course
- Personalized greeting

## 🔍 How It Works

1. **When you publish a course:**
   - The `handleCreateCourse` function calls `notifyUsersAboutNewCourse`
   - This fetches all users from the `profiles` table
   - Sends an email to each user via Resend API

2. **When you schedule a course:**
   - The `handleScheduleCourse` function calls `notifyUsersAboutScheduledCourse`
   - This fetches all users from the `profiles` table
   - Sends a scheduled course notification email to each user

## 🧪 Testing

### Test Course Published Notification

1. Make sure Resend API key is configured
2. Create a new course in the admin panel
3. Click "Create Course"
4. Check the browser console for:
   - `📢 Sending new course notification emails to X users`
   - `✅ Email sent to [email]`
5. Check user email inboxes (and spam folders)

### Test Scheduled Course Notification

1. Make sure Resend API key is configured
2. Create a new course
3. Click "Schedule" and set a future date/time
4. Check the browser console for:
   - `📢 Sending scheduled course notification emails to X users`
   - `✅ Scheduled course email sent to [email]`
5. Check user email inboxes (and spam folders)

## 🔒 Security Notes

- **Never commit API keys to git** - use environment variables
- API keys are only used client-side to call Resend API
- Consider using a backend API endpoint for better security (future improvement)

## 🐛 Troubleshooting

### Emails not sending?

1. **Check API Key:**
   - Verify `REACT_APP_RESEND_API_KEY` (or `VITE_RESEND_API_KEY`) is set correctly
   - Check console for "Resend API key not configured" warning

2. **Check From Email:**
   - Ensure `REACT_APP_RESEND_FROM_EMAIL` (or `VITE_RESEND_FROM_EMAIL`) is from a verified domain
   - Check Resend dashboard to verify your domain

3. **Check Console Logs:**
   - Look for error messages when sending emails
   - Check for network errors in browser DevTools

4. **Check Resend Dashboard:**
   - View email logs and delivery status
   - Check for any API errors or rate limits

5. **Check Spam Folders:**
   - Sometimes emails end up in spam
   - Verify your domain's SPF/DKIM records in Resend

### "Resend API key not configured" warning?

- Make sure environment variable name matches your build tool:
  - CRA: `REACT_APP_RESEND_API_KEY`
  - Vite: `VITE_RESEND_API_KEY`
- Restart your development server after adding variables
- In production, make sure variables are set in your hosting platform

### Rate Limits

- Resend has rate limits (check your plan)
- If sending to many users, consider:
  - Batching emails
  - Using a background job/queue
  - Upgrading your Resend plan

## 🚀 Production Deployment

1. **Add environment variables to your hosting platform:**
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Environment variables
   - Other platforms: Check their documentation

2. **Verify your domain in Resend:**
   - Go to Resend Dashboard → Domains
   - Verify `thekingezekielacademy.com` is verified
   - Update `RESEND_FROM_EMAIL` to use verified domain

3. **Test in production:**
   - Create a test course
   - Verify emails are sent
   - Check Resend dashboard for delivery status

## 📝 Code Location

- Email service: `src/services/emailService.ts`
- Notification logic: `src/components/AdminAddCourseWizard.tsx`
- Functions:
  - `notifyUsersAboutNewCourse()` - Sends emails when course is published
  - `notifyUsersAboutScheduledCourse()` - Sends emails when course is scheduled

## 🔄 Future Improvements

1. **Backend API Endpoint:** Move email sending to a backend API for better security
2. **Email Queue:** Implement a queue system for better performance with many users
3. **User Preferences:** Allow users to opt-in/opt-out of email notifications
4. **Email Templates:** Make templates more customizable
5. **Retry Logic:** Add retry logic for failed email sends
6. **Analytics:** Track email open rates and click rates

