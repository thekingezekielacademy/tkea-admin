# MailerLite Integration Guide

This guide explains how to set up and use the MailerLite integration in your King Ezekiel Academy Next.js application.

## 🚀 Quick Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# MailerLite Configuration
MAILERLITE_API_KEY=your_mailerlite_api_key
MAILERLITE_GROUP_ID=your_mailerlite_group_id
```

### 2. Get Your MailerLite Credentials

1. **API Key**: 
   - Go to your MailerLite dashboard
   - Navigate to Integrations → Developers → API
   - Generate a new API key

2. **Group ID**:
   - Go to Audience → Groups in your MailerLite dashboard
   - Create a new group or use an existing one
   - Copy the Group ID from the URL or group settings

## 📧 Features

### Automatic Newsletter Subscription

- **Signup Integration**: New users are automatically subscribed to your newsletter when they create an account
- **Standalone Form**: Use the `<NewsletterSignup />` component anywhere in your app
- **Duplicate Prevention**: Automatically handles existing subscribers
- **Error Handling**: Graceful error handling with user-friendly messages

### API Endpoints

- `POST /api/subscribe` - Subscribe users to newsletter

### Components

- `NewsletterSignup` - Reusable newsletter signup form
- `MailerLiteService` - Service for MailerLite API communication

## 🛠️ Usage

### Using the Newsletter Signup Component

```tsx
import NewsletterSignup from '@/components/NewsletterSignup';

// Basic usage
<NewsletterSignup />

// With custom props
<NewsletterSignup 
  title="Stay Updated"
  subtitle="Get the latest news and updates"
  showName={true}
  onSuccess={(message) => console.log(message)}
  onError={(error) => console.error(error)}
/>
```

### Programmatic Subscription

```tsx
// Subscribe a user programmatically
const response = await fetch('/api/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'User Name'
  }),
});

const result = await response.json();
```

## 📊 Bulk Import

### Import Existing Users

Use the bulk import script to migrate your existing user database:

```bash
# Import from CSV
node importUsers.js users.csv

# Import from JSON
node importUsers.js users.json

# Custom batch size and delay
node importUsers.js users.csv --batch-size 25 --delay 1000

# Dry run (test without importing)
node importUsers.js users.csv --dry-run
```

### File Formats

**CSV Format** (`users.csv`):
```csv
email,name
john.doe@example.com,John Doe
jane.smith@example.com,Jane Smith
```

**JSON Format** (`users.json`):
```json
[
  {
    "email": "john.doe@example.com",
    "name": "John Doe"
  },
  {
    "email": "jane.smith@example.com",
    "name": "Jane Smith"
  }
]
```

### Bulk Import Features

- ✅ **Rate Limiting**: Respects MailerLite API limits
- ✅ **Batch Processing**: Processes users in configurable batches
- ✅ **Duplicate Detection**: Skips existing subscribers
- ✅ **Error Handling**: Retries failed requests with exponential backoff
- ✅ **Progress Tracking**: Real-time progress reporting
- ✅ **Dry Run Mode**: Test imports without making changes
- ✅ **Detailed Statistics**: Comprehensive import reports

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MAILERLITE_API_KEY` | Yes | Your MailerLite API key |
| `MAILERLITE_GROUP_ID` | Yes | Your MailerLite group/list ID |

### Service Configuration

The `MailerLiteService` can be configured in `src/services/mailerliteService.ts`:

```typescript
const CONFIG = {
  BATCH_SIZE: 50,           // Batch size for bulk operations
  DELAY_BETWEEN_BATCHES: 2000,  // Delay between batches (ms)
  MAX_RETRIES: 3,           // Max retries for failed requests
  TIMEOUT: 10000,           // Request timeout (ms)
};
```

## 🚨 Error Handling

### Common Errors

1. **Invalid API Key**: Check your MailerLite API key
2. **Group Not Found**: Verify your Group ID is correct
3. **Rate Limiting**: Increase delays between requests
4. **Network Issues**: Check your internet connection

### Error Responses

```json
{
  "error": "This email is already subscribed to our newsletter",
  "status": 409
}
```

## 🔒 Security

- ✅ API keys are stored server-side only
- ✅ Input validation and sanitization
- ✅ Rate limiting protection
- ✅ CORS headers configured
- ✅ Error messages don't expose sensitive information

## 📈 Monitoring

### Logs

The service logs important events:

```typescript
// Success
console.log('Newsletter subscription successful');

// Errors (non-critical)
console.log('Newsletter subscription failed (non-critical)');
```

### Health Check

Check if MailerLite is configured:

```typescript
import { mailerLiteService } from '@/services/mailerliteService';

if (mailerLiteService.isConfigured()) {
  console.log('MailerLite is properly configured');
} else {
  console.log('MailerLite configuration missing');
}
```

## 🚀 Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `MAILERLITE_API_KEY`
   - `MAILERLITE_GROUP_ID`

2. Deploy your application:
   ```bash
   vercel --prod
   ```

### Environment Setup

Make sure your production environment has the required variables:

```bash
# Check environment variables
vercel env ls
```

## 🧪 Testing

### Test Newsletter Subscription

```bash
# Test the API endpoint
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Test Bulk Import

```bash
# Dry run test
node importUsers.js users-example.csv --dry-run
```

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your MailerLite credentials
3. Test with the dry run mode first
4. Check MailerLite API documentation

## 🔄 Updates

To update the integration:

1. Pull the latest changes
2. Update environment variables if needed
3. Test in development first
4. Deploy to production

---

**Note**: The newsletter subscription is non-blocking - if it fails, user signup will still succeed. This ensures a smooth user experience even if there are temporary issues with the newsletter service.
