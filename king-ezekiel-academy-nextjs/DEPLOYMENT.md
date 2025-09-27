# King Ezekiel Academy - Next.js Deployment Guide

## 🚀 Quick Start

This Next.js 14 application is ready for deployment on Vercel with Supabase as the backend.

## 📋 Prerequisites

- Node.js 18+ installed
- Vercel account
- Supabase project
- Flutterwave account

## 🛠️ Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your keys
3. Run the database migrations in `supabase/migrations/`

### 2. Flutterwave Configuration

1. Create a Flutterwave account at [flutterwave.com](https://flutterwave.com)
2. Get your API keys from the dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/payments/flutterwave/webhook`

### 3. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_HASH=your_hash

# Next.js
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-domain.com
```

## 🗄️ Database Setup

### 1. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 2. Set up RLS Policies

The migration files include all necessary RLS policies for security.

### 3. Insert Sample Data

```bash
# Run the migration script
npm run migrate:db
```

## 🚀 Vercel Deployment

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will automatically detect Next.js

### 2. Configure Environment Variables

In Vercel dashboard, add all environment variables from your `.env.local` file.

### 3. Deploy

Vercel will automatically deploy on every push to main branch.

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run database migration
npm run migrate:db

# Build for production
npm run build

# Start production server
npm start
```

## 📱 Features

### ✅ Implemented Features

- **Authentication System** - Sign up, sign in, password reset
- **Video Player** - YouTube, HLS, MP4 support with iOS compatibility
- **Payment Integration** - Flutterwave payment processing
- **Subscription Management** - Trial and paid subscriptions
- **Progress Tracking** - Lesson progress and completion
- **Gamification** - XP, streaks, achievements
- **Admin Dashboard** - Analytics and user management
- **Responsive Design** - Mobile-first design
- **PWA Support** - Offline capabilities
- **Security** - RLS policies and secure API routes

### 🎯 Key Components

- **Advanced Video Player** - HLS.js + YouTube integration
- **Lesson Player** - Progress tracking and navigation
- **Payment System** - Flutterwave integration with webhooks
- **Dashboard** - User and admin dashboards
- **Authentication** - Supabase Auth with httpOnly cookies

## 🔒 Security Features

- Row Level Security (RLS) policies
- httpOnly cookies for session management
- Webhook signature verification
- Server-side payment processing
- Input validation and sanitization

## 📊 Database Schema

### Core Tables

- `profiles` - User profiles and settings
- `courses` - Course information
- `lessons` - Lesson content and metadata
- `user_subscriptions` - Subscription management
- `user_trials` - Free trial tracking
- `user_lesson_progress` - Progress tracking
- `user_achievements` - Achievement system
- `user_streaks` - Streak tracking
- `payment_attempts` - Payment records
- `achievements` - Achievement definitions

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts** - Kill existing processes on ports 3000 and 5000
2. **Supabase connection** - Check environment variables
3. **Payment webhooks** - Ensure webhook URL is accessible
4. **Video playback** - Check CORS settings for video domains

### Debug Commands

```bash
# Check port usage
lsof -i :3000
lsof -i :5000

# Kill processes
pkill -f "node server/index.js"
pkill -f "react-scripts start"

# Check Supabase connection
npm run test:supabase
```

## 📈 Performance Optimization

- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic code splitting
- **Caching** - API route caching
- **CDN** - Vercel Edge Network
- **PWA** - Service worker caching

## 🔄 CI/CD Pipeline

The application is configured for automatic deployment:

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Environment variables are injected
4. Database migrations run automatically

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review the Supabase logs
3. Check Vercel deployment logs
4. Contact support team

## 🎉 Success!

Your Next.js application is now deployed and ready for users!

### Next Steps

1. Test all features in production
2. Set up monitoring and analytics
3. Configure custom domain
4. Set up backup and recovery
5. Monitor performance and user feedback
