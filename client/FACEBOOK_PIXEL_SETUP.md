# 🎯 Facebook Pixel Setup Guide - King Ezekiel Academy

## 📋 **Overview**

This guide explains how to set up and use Facebook Pixel tracking for the King Ezekiel Academy digital marketing education platform.

## 🚀 **Quick Setup**

### **1. Get Your Facebook Pixel ID**

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to **Events Manager** > **Data Sources** > **Pixels**
3. Create a new pixel or use an existing one
4. Copy your Pixel ID (format: `123456789012345`)

### **2. Update Configuration**

Replace `YOUR_PIXEL_ID` in `src/config/facebookPixel.ts`:

```typescript
export const FACEBOOK_PIXEL_ID = '123456789012345'; // Your actual Pixel ID
```

### **3. Environment Variables (Optional)**

Add to your `.env` file:

```env
REACT_APP_FACEBOOK_PIXEL_ID=123456789012345
```

Then update the config:

```typescript
export const FACEBOOK_PIXEL_ID = process.env.REACT_APP_FACEBOOK_PIXEL_ID || 'YOUR_PIXEL_ID';
```

## 📊 **Tracked Events**

### **Standard Events**

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `PageView` | Page views | Automatic on route changes |
| `Lead` | Lead generation | Contact form submissions |
| `CompleteRegistration` | User registration | Sign up completion |
| `ViewContent` | Content views | Course and blog views |
| `Search` | Search activity | Course and blog searches |
| `AddToCart` | Course enrollment intent | Course enrollment clicks |
| `InitiateCheckout` | Checkout start | Subscription page visits |
| `Purchase` | Successful purchases | Subscription payments |
| `Contact` | Contact form submissions | Contact form submissions |
| `Subscribe` | Newsletter subscriptions | Email signups |
| `StartTrial` | Trial starts | Free trial activations |

### **Custom Events**

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `CourseView` | Course page views | Individual course page visits |
| `CourseEnroll` | Course enrollments | Course enrollment completions |
| `CourseComplete` | Course completions | Course completion |
| `BlogView` | Blog post views | Blog post page visits |
| `BlogShare` | Blog sharing | Social media sharing |
| `VideoPlay` | Video starts | Course video playback starts |
| `VideoComplete` | Video completions | Course video completions |
| `Download` | File downloads | Resource downloads |
| `SignUp` | User registrations | Account creation |
| `Login` | User logins | User authentication |
| `Logout` | User logouts | User sign out |

## 🛠 **Usage Examples**

### **Basic Usage**

```typescript
import { useFacebookPixel } from '../hooks/useFacebookPixel';

const MyComponent = () => {
  const { trackPageView, trackLead, trackCourseView } = useFacebookPixel();
  
  // Track page view
  trackPageView();
  
  // Track lead
  trackLead('course_inquiry', 0, {
    lead_source: 'landing_page',
    course_interest: 'digital_marketing'
  });
  
  // Track course view
  trackCourseView('course-123', 'Digital Marketing Mastery', 2500, {
    course_category: 'digital_marketing',
    user_type: 'student'
  });
};
```

### **Course Tracking**

```typescript
// Track course view
trackCourseView(courseId, courseTitle, coursePrice, {
  course_category: 'digital_marketing',
  course_level: 'beginner',
  user_role: user?.role
});

// Track course enrollment
trackCourseEnroll(courseId, courseTitle, coursePrice, {
  enrollment_method: 'subscription',
  trial_used: hasTrialAccess
});

// Track course completion
trackCourseComplete(courseId, courseTitle, {
  completion_time: completionTime,
  lessons_completed: lessonsCompleted
});
```

### **Purchase Tracking**

```typescript
// Track subscription purchase
trackPurchase(transactionId, amount, 'NGN', {
  plan_name: 'Monthly Membership',
  subscription_id: subscriptionId,
  payment_method: 'paystack'
});

// Track subscription
trackSubscription(planName, planPrice, subscriptionId, {
  trial_conversion: true,
  user_type: 'new_user'
});
```

### **Blog Tracking**

```typescript
// Track blog view
trackBlogView(blogId, blogTitle, blogCategory, {
  author: 'King Ezekiel',
  read_time: estimatedReadTime
});

// Track blog share
trackBlogShare(blogId, blogTitle, 'facebook', {
  share_method: 'social_button'
});
```

### **Video Tracking**

```typescript
// Track video play
trackVideoPlay(videoId, videoTitle, videoDuration, {
  course_id: courseId,
  lesson_number: lessonNumber
});

// Track video completion
trackVideoComplete(videoId, videoTitle, videoDuration, {
  completion_percentage: 100,
  watch_time: actualWatchTime
});
```

### **Search Tracking**

```typescript
// Track search
trackSearch(searchTerm, searchResults.length, {
  search_type: 'courses',
  filters_applied: appliedFilters
});
```

### **Contact Tracking**

```typescript
// Track contact form submission
trackContact('contact_form', {
  contact_name: formData.name,
  contact_email: formData.email,
  contact_subject: formData.subject
});

// Track lead generation
trackLead('contact_form', 0, {
  lead_source: 'contact_form',
  contact_subject: formData.subject
});
```

## 🎯 **Event Parameters**

### **Standard Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `content_type` | string | Type of content (course, article, video) |
| `content_category` | string | Content category (digital_marketing, business) |
| `content_ids` | array | Array of content IDs |
| `content_name` | string | Content title |
| `value` | number | Monetary value |
| `currency` | string | Currency code (NGN) |

### **Custom Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `course_id` | string | Course identifier |
| `course_title` | string | Course name |
| `course_category` | string | Course category |
| `course_price` | number | Course price |
| `user_id` | string | User identifier |
| `user_email` | string | User email |
| `user_role` | string | User role (student, admin) |
| `plan_name` | string | Subscription plan name |
| `subscription_id` | string | Subscription identifier |
| `trial_days` | number | Trial period duration |
| `payment_method` | string | Payment method used |

## 🔧 **Advanced Configuration**

### **Custom Event Tracking**

```typescript
// Track custom events
trackCustomEvent('CustomEventName', {
  custom_parameter: 'value',
  another_parameter: 123
});
```

### **Enhanced Ecommerce Tracking**

```typescript
// Track add to cart
trackAddToCart(courseId, courseTitle, coursePrice, {
  course_category: 'digital_marketing',
  enrollment_method: 'subscription'
});

// Track initiate checkout
trackInitiateCheckout(courseId, courseTitle, coursePrice, {
  checkout_step: 'subscription_selection'
});
```

## 📈 **Analytics & Reporting**

### **Facebook Events Manager**

1. **Events Overview**: View all tracked events
2. **Conversion Tracking**: Monitor lead and purchase conversions
3. **Audience Insights**: Understand your audience
4. **Custom Audiences**: Create targeted audiences
5. **Lookalike Audiences**: Find similar users

### **Key Metrics to Monitor**

- **Lead Generation**: Contact form submissions
- **Course Engagement**: Course views and enrollments
- **Purchase Conversion**: Subscription signups
- **Content Performance**: Blog and video engagement
- **User Journey**: Page view and interaction patterns

## 🛡 **Privacy & Compliance**

### **GDPR Compliance**

- Implement cookie consent banners
- Allow users to opt-out of tracking
- Provide clear privacy policy
- Honor user data deletion requests

### **Cookie Consent**

```typescript
// Check for cookie consent before tracking
const hasConsent = localStorage.getItem('cookie_consent') === 'true';

if (hasConsent && FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
  // Proceed with tracking
  ReactPixel.track(eventName, parameters);
}
```

### **Opt-out Functionality**

```typescript
// Allow users to opt-out
const optOut = () => {
  ReactPixel.revokeConsent();
  localStorage.setItem('facebook_pixel_opt_out', 'true');
};
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Pixel Not Loading**
   - Check Pixel ID is correct
   - Verify network connectivity
   - Check browser console for errors

2. **Events Not Tracking**
   - Ensure Pixel ID is not 'YOUR_PIXEL_ID'
   - Check Facebook Events Manager
   - Verify event parameters

3. **Duplicate Events**
   - Check for multiple Pixel initializations
   - Review event trigger conditions
   - Monitor for React re-renders

### **Debug Mode**

Enable debug mode in development:

```typescript
export const PIXEL_OPTIONS = {
  autoConfig: true,
  debug: process.env.NODE_ENV === 'development'
};
```

### **Testing Events**

Use Facebook Pixel Helper browser extension to test events in real-time.

## 📞 **Support**

For technical support or questions about Facebook Pixel implementation:

- **Email**: tech@thekingezekielacademy.com
- **Documentation**: [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel/)
- **Events Manager**: [Facebook Events Manager](https://business.facebook.com/events_manager)

---

**Last Updated**: January 31, 2025  
**Version**: 1.0.0  
**Maintained By**: King Ezekiel Academy Development Team
