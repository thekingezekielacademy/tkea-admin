# Google Analytics Setup Guide

This guide explains the Google Analytics integration for King Ezekiel Academy.

## ✅ Current Status

Google Analytics has been properly integrated and will automatically:
- Initialize on page load
- Track page views on route changes
- Work in both development and production environments

## 🔧 Setup Instructions

### 1. Get Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property (or create a new one)
3. Go to **Admin** → **Data Streams**
4. Click on your web stream
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add Environment Variable

Add the following to your `.env.local` file (for local development) or your production environment:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important Notes:**
- Replace `G-XXXXXXXXXX` with your actual Measurement ID
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose it to the client-side
- For production, add this to your hosting platform's environment variables (Vercel, etc.)

### 3. Verify Configuration

After setting the environment variable:

1. **Restart your development server** (required for env vars to load)
2. **Open your browser's developer console**
3. **Navigate to any page**
4. **Look for console messages:**
   - Success: `Google Analytics: Initialized successfully`
   - Error: `Google Analytics: Measurement ID not configured`

### 4. Test in Google Analytics

1. Go to your Google Analytics dashboard
2. Navigate to **Reports** → **Realtime**
3. Visit your website in another tab/window
4. You should see yourself as an active user within 30 seconds

## 📁 Files Modified

### New Files:
- `src/components/GoogleAnalytics.tsx` - Google Analytics component that initializes and tracks page views

### Modified Files:
- `src/lib/env.ts` - Added `NEXT_PUBLIC_GA_MEASUREMENT_ID` to client environment variables
- `src/components/Providers.tsx` - Added `<GoogleAnalytics />` component
- `env.example` - Added GA Measurement ID example

## 🔍 How It Works

1. **Initialization**: The `GoogleAnalytics` component loads when the app starts
2. **Script Loading**: It dynamically loads the Google Analytics script from `googletagmanager.com`
3. **Page Tracking**: Automatically tracks page views when users navigate between pages
4. **Route Changes**: Uses Next.js App Router's `usePathname()` and `useSearchParams()` to track route changes

## 🎯 Features

- ✅ Automatic page view tracking
- ✅ Route change detection
- ✅ Error handling (won't break your app if GA fails)
- ✅ Works in development and production
- ✅ No performance impact (async loading)

## 🧪 Testing

### Local Testing

1. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`
2. Restart dev server: `npm run dev`
3. Open browser console
4. Navigate between pages
5. Check for console logs:
   - `Google Analytics: Initialized successfully`
   - `Google Analytics: Page view tracked /path`

### Production Testing

1. Deploy with the environment variable set
2. Visit your website
3. Check Google Analytics Realtime reports
4. Verify page views are being tracked

## 🐛 Troubleshooting

### Analytics Not Showing in Google Analytics

1. **Check Environment Variable:**
   ```bash
   # Make sure it's set correctly
   echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```

2. **Check Browser Console:**
   - Open DevTools → Console
   - Look for GA initialization messages
   - Check for any errors

3. **Verify Measurement ID Format:**
   - Should start with `G-` (GA4 format)
   - Old Universal Analytics IDs (`UA-XXXXX`) won't work

4. **Check Network Tab:**
   - Open DevTools → Network
   - Filter by "gtag" or "analytics"
   - You should see requests to `google-analytics.com`

5. **Ad Blockers:**
   - Some ad blockers prevent GA from loading
   - Test in incognito mode or disable extensions

### "Measurement ID not configured" Error

- The environment variable is not set
- Server needs to be restarted after adding the variable
- Variable name must be exactly `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Analytics Works Locally But Not in Production

- Check that the environment variable is set in your hosting platform
- Vercel: Settings → Environment Variables
- Make sure it's set for the correct environment (Production/Preview)

## 📊 Event Tracking

The current implementation tracks:
- **Page Views** - Automatically on route changes
- **Page Titles** - From document.title
- **Page Paths** - Current URL path
- **Page Locations** - Full URL

### Adding Custom Events

To track custom events, you can use the `gtag` function directly:

```typescript
// Track a button click
function handleButtonClick() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'button_click', {
      event_category: 'engagement',
      event_label: 'signup_button',
    });
  }
}
```

Or create a helper function:

```typescript
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
}

// Usage
trackEvent('course_enrollment', {
  course_id: '123',
  course_name: 'Digital Marketing Basics',
});
```

## 🚀 Next Steps

1. ✅ Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable
2. ✅ Restart your development server
3. ✅ Test in browser console
4. ✅ Verify in Google Analytics Realtime reports
5. ✅ Deploy to production with environment variable set

## 📚 Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Analytics Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🔐 Privacy & GDPR

If you need GDPR compliance:
- Add cookie consent banner
- Only initialize GA after user consent
- Update the `GoogleAnalytics` component to check for consent before initializing

Example:
```typescript
const hasConsent = localStorage.getItem('cookie_consent') === 'true';
if (hasConsent && measurementId) {
  initializeGA();
}
```

