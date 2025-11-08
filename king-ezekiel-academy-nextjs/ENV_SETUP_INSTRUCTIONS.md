# Environment Variables Setup Instructions

## ✅ Your API Keys

You've provided:
- **Resend API Key**: `re_BmBQU7fg_4Pm5qG2YonMMsbViCVMrrMVx`
- **Google Analytics ID**: `G-8DXQN4Q7LD`

## 📝 Add to .env.local

Add these lines to your `.env.local` file:

```bash
# Resend Configuration (for transactional emails)
RESEND_API_KEY=re_BmBQU7fg_4Pm5qG2YonMMsbViCVMrrMVx
RESEND_FROM_EMAIL=noreply@thekingezekielacademy.com

# Google Analytics Configuration
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-8DXQN4Q7LD
```

## 🔒 Security Note

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to Git (it should be in `.gitignore`)
- Never share your API keys publicly
- For production, add these to your hosting platform's environment variables (Vercel, etc.)

## ✅ After Adding

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Verify Resend is working**:
   - Sign up a new user
   - Check console for: "Welcome email sent successfully"
   - Check user's email inbox

3. **Verify Google Analytics is working**:
   - Open browser console
   - Look for: "Google Analytics: Initialized successfully"
   - Check Google Analytics Realtime reports

## 🚀 Production Deployment

When deploying to production (Vercel, etc.):

1. Go to your hosting platform's environment variables settings
2. Add the same variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
3. Deploy

