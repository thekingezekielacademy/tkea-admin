# HubSpot Integration Guide for King Ezekiel Academy

This guide explains how to set up and use HubSpot tracking in your application.

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Features](#features)
4. [Usage Examples](#usage-examples)
5. [Tracking Events](#tracking-events)
6. [Troubleshooting](#troubleshooting)

## Overview

HubSpot integration provides:
- **Automatic page view tracking** on all routes
- **User identification** when users sign in/sign up
- **Custom event tracking** for course enrollments, lesson completions, payments, etc.
- **Contact creation and enrichment** in HubSpot CRM
- **Marketing automation** triggers based on user behavior

## Setup Instructions

### 1. Get Your HubSpot Portal ID

1. Log in to your [HubSpot account](https://app.hubspot.com/)
2. Go to **Settings** (gear icon in the top right)
3. Navigate to **Account Defaults** → **Account Information**
4. Find your **Hub ID** (also called Portal ID)

### 2. Configure Environment Variables

Add your HubSpot Portal ID to your environment configuration:

**For Production (.env.production or Vercel/hosting platform):**
```bash
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=your_portal_id_here
```

**For Development (.env.local):**
```bash
# Optional: Keep HubSpot disabled in development
# NEXT_PUBLIC_HUBSPOT_PORTAL_ID=your_portal_id_here
```

> **Note:** The integration only runs in production by default. To test in development, uncomment and add your Portal ID to `.env.local`.

### 3. Verify Installation

After deploying with the Portal ID configured:

1. Visit your production site
2. Open browser DevTools → Console
3. Look for: `✅ HubSpot tracking initialized`
4. Check HubSpot Dashboard → Reports → Analytics Tools → Tracking Code
5. Verify that your site shows "Connected" status

## Features

### 1. Automatic Tracking

The following happens automatically once configured:

- ✅ **Page views** tracked on every route change
- ✅ **User identification** when logged in (email, name, signup date)
- ✅ **Session tracking** for anonymous visitors
- ✅ **Traffic source** attribution

### 2. Manual Event Tracking

You can track custom events anywhere in your application using the `useHubSpot` hook.

## Usage Examples

### Basic Usage in Components

```typescript
'use client';
import { useHubSpot } from '@/hooks/useHubSpot';

export default function MyComponent() {
  const { trackEvent, identifyUser } = useHubSpot();

  const handleButtonClick = () => {
    trackEvent('button_clicked', {
      button_name: 'Get Started',
      page: 'Home'
    });
  };

  return <button onClick={handleButtonClick}>Get Started</button>;
}
```

### Track Course Enrollment

```typescript
import { useHubSpot } from '@/hooks/useHubSpot';

function CourseEnrollButton({ courseId, courseName, userEmail }) {
  const { trackCourseEnrollment } = useHubSpot();

  const handleEnroll = async () => {
    // Your enrollment logic here
    await enrollUserInCourse(courseId);
    
    // Track in HubSpot
    trackCourseEnrollment(courseId, courseName, userEmail);
  };

  return <button onClick={handleEnroll}>Enroll Now</button>;
}
```

### Track Lesson Completion

```typescript
import { useHubSpot } from '@/hooks/useHubSpot';

function LessonPlayer({ courseId, lessonId, lessonName }) {
  const { trackLessonComplete } = useHubSpot();

  const handleLessonComplete = () => {
    // Mark lesson as complete
    markLessonAsComplete(lessonId);
    
    // Track in HubSpot
    trackLessonComplete(courseId, lessonId, lessonName);
  };

  return (
    <div>
      {/* Video player component */}
      <button onClick={handleLessonComplete}>Mark Complete</button>
    </div>
  );
}
```

### Track Payment/Subscription

```typescript
import { useHubSpot } from '@/hooks/useHubSpot';

function CheckoutSuccess({ plan, amount, currency }) {
  const { trackSubscription, identifyUser } = useHubSpot();

  useEffect(() => {
    // Track successful subscription
    trackSubscription(plan, amount, currency);
    
    // Update user properties
    identifyUser(userEmail, {
      subscription_plan: plan,
      subscription_status: 'active',
      ltv: amount
    });
  }, []);

  return <div>Thank you for subscribing!</div>;
}
```

### Track Form Submissions

```typescript
import { useHubSpot } from '@/hooks/useHubSpot';

function ContactForm() {
  const { trackFormSubmit, identifyUser } = useHubSpot();

  const handleSubmit = async (formData) => {
    // Submit form
    await submitContactForm(formData);
    
    // Track in HubSpot
    trackFormSubmit('contact_form_v1');
    identifyUser(formData.email, {
      firstname: formData.firstName,
      lastname: formData.lastName,
      phone: formData.phone
    });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Tracking Events

### Available Methods

#### 1. `trackEvent(eventName, properties)`
Track a generic custom event.

```typescript
trackEvent('video_played', {
  video_id: '123',
  video_title: 'Introduction to Marketing',
  duration: 300
});
```

#### 2. `trackCustomBehavioralEvent(eventName, properties)`
Track behavioral events that can trigger workflows in HubSpot.

```typescript
trackCustomBehavioralEvent('course_abandoned', {
  course_id: '456',
  progress_percentage: 25
});
```

#### 3. `identifyUser(email, properties)`
Identify and enrich contact data in HubSpot.

```typescript
identifyUser('user@example.com', {
  firstname: 'John',
  lastname: 'Doe',
  phone: '+234123456789',
  subscription_plan: 'Premium',
  signup_date: '2024-01-15'
});
```

#### 4. `trackCourseEnrollment(courseId, courseName, userEmail)`
Track when a user enrolls in a course.

```typescript
trackCourseEnrollment('course-123', 'Digital Marketing 101', 'user@example.com');
```

#### 5. `trackLessonComplete(courseId, lessonId, lessonName)`
Track lesson completion.

```typescript
trackLessonComplete('course-123', 'lesson-5', 'SEO Fundamentals');
```

#### 6. `trackSubscription(plan, amount, currency)`
Track subscription purchases.

```typescript
trackSubscription('Premium Monthly', 5000, 'NGN');
```

#### 7. `trackFormSubmit(formId, portalId?)`
Track form submissions.

```typescript
trackFormSubmit('newsletter_signup');
```

## Creating HubSpot Workflows

Once events are being tracked, you can create automated workflows in HubSpot:

### Example: Welcome Email for New Course Enrollments

1. Go to **Automation** → **Workflows**
2. Create a new **Contact-based workflow**
3. Set enrollment trigger: **Custom behavioral event** → `course_enrollment`
4. Add action: **Send email** → Select your welcome email template
5. Add delay: **Wait 2 days**
6. Add action: **Send email** → Send course tips email
7. Review and activate

### Example: Re-engagement for Incomplete Courses

1. Create workflow with trigger: `course_enrollment`
2. Add delay: **Wait 7 days**
3. Add branch: If `lesson_completed` event count < 3
4. True branch: Send re-engagement email
5. False branch: Send progress encouragement email

## Custom Properties for Contacts

The integration automatically creates/updates these HubSpot contact properties:

| Property | Description | Example |
|----------|-------------|---------|
| `email` | User's email address | user@example.com |
| `firstname` | First name | John |
| `lastname` | Last name | Doe |
| `phone` | Phone number | +234123456789 |
| `signup_date` | Account creation date | 2024-01-15 |
| `enrolled_course` | Last enrolled course | Digital Marketing 101 |
| `enrollment_date` | Last enrollment date | 2024-02-20 |
| `subscription_plan` | Current plan | Premium |
| `subscription_status` | Subscription status | active |

### Creating Custom Properties

To add more custom properties in HubSpot:

1. Go to **Settings** → **Properties**
2. Select **Contact properties**
3. Click **Create property**
4. Set **Type** (Text, Number, Date, etc.)
5. Set **Field name** (must match what you send from code)
6. Save and use in your tracking code

## Advanced Integration

### Track Video Watch Time

```typescript
function VideoPlayer({ videoId, videoTitle }) {
  const { trackEvent } = useHubSpot();
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    // Track every 30 seconds of watch time
    const interval = setInterval(() => {
      setWatchTime(prev => prev + 30);
      trackEvent('video_watch_progress', {
        video_id: videoId,
        video_title: videoTitle,
        seconds_watched: watchTime + 30
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [videoId, videoTitle, watchTime]);

  return <video />;
}
```

### Track User Engagement Score

```typescript
function TrackEngagement() {
  const { trackCustomBehavioralEvent, identifyUser } = useHubSpot();
  
  const updateEngagementScore = (action: string, points: number) => {
    const currentScore = getUserEngagementScore();
    const newScore = currentScore + points;
    
    trackCustomBehavioralEvent('engagement_updated', {
      action,
      points_earned: points,
      total_score: newScore
    });
    
    identifyUser(userEmail, {
      engagement_score: newScore,
      last_activity: new Date().toISOString()
    });
  };

  return { updateEngagementScore };
}
```

## Troubleshooting

### HubSpot Not Tracking

1. **Check Console for Errors**
   - Open DevTools → Console
   - Look for HubSpot-related errors or warnings

2. **Verify Portal ID**
   - Make sure `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` is set correctly
   - Verify it's the Hub ID from your account settings

3. **Check Network Tab**
   - Open DevTools → Network
   - Filter by "hs-scripts" or "hubspot"
   - Verify the script is loading (should see `{portalId}.js`)

4. **Production Only**
   - HubSpot only loads in production by default
   - Check `process.env.NODE_ENV === 'production'`

### Events Not Appearing in HubSpot

1. **Wait for Processing**
   - HubSpot can take 5-15 minutes to process events
   - Check back later if events seem missing

2. **Verify Event Names**
   - Event names must be valid (no special characters except underscore)
   - Use snake_case: `course_enrollment` not `course-enrollment`

3. **Check Event Limits**
   - HubSpot may have limits on event frequency
   - Avoid tracking the same event too rapidly

### Contact Not Identified

1. **Email Required**
   - Always provide email when calling `identifyUser()`
   - Email must be valid format

2. **Check Contact in HubSpot**
   - Go to Contacts → Search by email
   - Verify contact exists and properties are updated

3. **Property Names**
   - Property names must match HubSpot's field names
   - Create custom properties if needed

## Best Practices

1. **Don't Over-Track**
   - Be selective about what events you track
   - Too many events can clutter your data and hit limits

2. **Use Descriptive Event Names**
   - Good: `course_enrollment_completed`
   - Bad: `ce_done`

3. **Include Relevant Properties**
   - Add context that helps with segmentation
   - Include IDs, names, values, timestamps

4. **Test Before Production**
   - Use a test HubSpot portal for development
   - Verify events before deploying to production

5. **Document Your Events**
   - Keep a list of all tracked events
   - Document what properties each event includes
   - Share with your marketing team

## Privacy & GDPR Compliance

- Always get user consent before tracking
- Provide opt-out options in your privacy policy
- Don't track sensitive personal data
- HubSpot is GDPR compliant - see [HubSpot GDPR Guide](https://www.hubspot.com/data-privacy/gdpr)

## Resources

- [HubSpot Tracking Code Documentation](https://developers.hubspot.com/docs/api/events/tracking-code)
- [HubSpot Analytics Tools](https://knowledge.hubspot.com/reports/install-the-hubspot-tracking-code)
- [Custom Behavioral Events](https://developers.hubspot.com/docs/api/analytics/events)
- [Contact Properties API](https://developers.hubspot.com/docs/api/crm/properties)

## Support

For issues with HubSpot integration:
1. Check this guide's troubleshooting section
2. Review HubSpot's developer documentation
3. Contact HubSpot support via your account
4. Check the King Ezekiel Academy development team

---

**Last Updated:** October 2025  
**Version:** 1.0.0

