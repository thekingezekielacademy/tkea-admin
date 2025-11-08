# Setup Verification Checklist

## ✅ Completed

- [x] Resend package installed
- [x] Email service created (`src/services/emailService.ts`)
- [x] Welcome email template created
- [x] Course available email template created
- [x] Email integration in signup flow
- [x] Google Analytics component created
- [x] Google Analytics integrated in Providers
- [x] Database migration created (safe version)
- [x] API endpoints for notifications created
- [x] Notify Me functionality updated
- [x] Environment configuration updated

## ⚠️ Action Required

### 1. Add Environment Variables to .env.local

**You need to add these to your `.env.local` file:**

```bash
# Resend Configuration (for transactional emails)
RESEND_API_KEY=re_BmBQU7fg_4Pm5qG2YonMMsbViCVMrrMVx
RESEND_FROM_EMAIL=noreply@thekingezekielacademy.com

# Google Analytics Configuration
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-8DXQN4Q7LD
```

**Steps:**
1. Open `.env.local` file
2. Add the variables above
3. Save the file
4. **Restart your development server** (required for env vars to load)

### 2. Run Database Migration

**Run the migration in Supabase SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20250120_001_create_course_notifications.sql`
3. Paste and run it
4. Verify the `course_notifications` table was created

### 3. Verify Resend Domain

**In Resend Dashboard:**
1. Go to https://resend.com/domains
2. Verify your domain `thekingezekielacademy.com` is verified
3. Or use the test domain for development

## 🧪 Testing Checklist

### Test Resend (Email)

- [ ] **Sign up a new user**
  - Go to signup page
  - Create a new account
  - Check console for: "Welcome email sent successfully"
  - Check user's email inbox (and spam folder)

- [ ] **Test course notification**
  - User clicks "Notify Me" on a scheduled course
  - Publish the course (or call the API manually)
  - Check if user receives email

### Test Google Analytics

- [ ] **Check browser console**
  - Open DevTools → Console
  - Look for: "Google Analytics: Initialized successfully"
  - Navigate between pages
  - Check for: "Google Analytics: Page view tracked"

- [ ] **Check Google Analytics Dashboard**
  - Go to Google Analytics → Realtime
  - Visit your website
  - You should see yourself as an active user within 30 seconds

### Test Database Migration

- [ ] **Verify table exists**
  ```sql
  SELECT * FROM course_notifications LIMIT 1;
  ```

- [ ] **Verify policies exist**
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'course_notifications';
  ```

- [ ] **Test notification subscription**
  - User clicks "Notify Me" button
  - Check database for new record in `course_notifications` table

## 🚀 Production Deployment

When deploying to production:

1. **Add environment variables to hosting platform:**
   - Vercel: Settings → Environment Variables
   - Add: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`

2. **Verify Resend domain in production:**
   - Make sure `noreply@thekingezekielacademy.com` is verified in Resend

3. **Run migration in production database:**
   - Connect to production Supabase
   - Run the migration

## 📊 Current Status

- **Code**: ✅ All code is implemented and integrated
- **Environment Variables**: ⚠️ Need to add to .env.local
- **Database Migration**: ⚠️ Need to run in Supabase
- **Testing**: ⏳ Waiting for env vars and migration

## 🆘 Troubleshooting

### Emails not sending?
- Check if `RESEND_API_KEY` is in `.env.local`
- Check if server was restarted after adding env vars
- Check Resend dashboard for email logs
- Verify domain is verified in Resend

### Google Analytics not working?
- Check if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is in `.env.local`
- Check browser console for errors
- Verify Measurement ID format (should start with `G-`)
- Check if ad blockers are blocking GA

### Database errors?
- Verify migration was run successfully
- Check RLS policies are created
- Verify `profiles` table exists and has `role` column

