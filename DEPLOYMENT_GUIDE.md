# 🚀 **COMPREHENSIVE DEPLOYMENT GUIDE**

## 📋 **Overview**

This guide covers the complete deployment process for The King Ezekiel Academy application, including frontend, backend, and database setup.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Vercel)      │◄──►│   (Supabase)    │
│   React App     │    │   API Routes    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 **Prerequisites**

- Node.js 18+ installed
- Git installed
- Vercel account
- Supabase account
- Paystack account

## 📦 **Environment Setup**

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/thekingezekielacademy.git
cd thekingezekielacademy
```

### **2. Install Dependencies**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### **3. Environment Variables**

#### **Client Environment (.env.local)**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://evqerkqiquwxqlizdqmg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Paystack Configuration (Public Key Only)
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here

# API Configuration
REACT_APP_API_URL=https://your-app.vercel.app/api

# Analytics (Optional)
REACT_APP_GA_MEASUREMENT_ID=G-8DXQN4Q7LD
REACT_APP_FACEBOOK_PIXEL_ID=your_facebook_pixel_id
```

#### **Server Environment (.env)**
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://evqerkqiquwxqlizdqmg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Paystack Configuration (Secret Keys - Server Only)
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_PLAN_CODE=PLN_your_plan_code_here

# Webhook Configuration
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🗄️ **Database Setup**

### **1. Supabase Setup**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon key
5. Go to Settings → Database
6. Copy your service role key

### **2. Run Database Migrations**
```bash
# Run the database setup script
psql -h your-db-host -U postgres -d postgres -f fix_user_achievements_table.sql
```

### **3. Verify Database Tables**
```sql
-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 
  'courses', 
  'lessons', 
  'user_courses', 
  'user_lesson_progress', 
  'user_achievements',
  'subscriptions',
  'subscription_payments'
);
```

## 🚀 **Deployment Process**

### **Option 1: Vercel Deployment (Recommended)**

#### **1. Frontend Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from client directory
cd client
vercel

# Set environment variables
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY
vercel env add REACT_APP_PAYSTACK_PUBLIC_KEY
vercel env add REACT_APP_API_URL
```

#### **2. Backend Deployment**
```bash
# Deploy API routes
cd server
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add PAYSTACK_SECRET_KEY
vercel env add PAYSTACK_PUBLIC_KEY
vercel env add PAYSTACK_PLAN_CODE
vercel env add PAYSTACK_WEBHOOK_SECRET
```

### **Option 2: Manual Deployment**

#### **1. Build Frontend**
```bash
cd client
npm run build
```

#### **2. Deploy to Static Hosting**
- Upload `build/` folder to your hosting provider
- Configure redirects for SPA routing
- Set up environment variables

#### **3. Deploy Backend**
```bash
cd server
npm start
```

## 🔐 **Security Configuration**

### **1. Supabase Security**
```sql
-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
```

### **2. CORS Configuration**
```javascript
// In your API routes
const cors = require('cors');
app.use(cors({
  origin: ['https://your-domain.com', 'https://www.your-domain.com'],
  credentials: true
}));
```

### **3. Environment Variable Security**
- Never commit `.env` files
- Use Vercel environment variables for production
- Rotate keys regularly
- Use different keys for development and production

## 📊 **Monitoring and Analytics**

### **1. Error Tracking**
- Set up Sentry for error tracking
- Configure error reporting in `ErrorHandler`
- Monitor error logs in Vercel

### **2. Performance Monitoring**
- Use Vercel Analytics
- Monitor Core Web Vitals
- Set up performance alerts

### **3. Database Monitoring**
- Monitor Supabase usage
- Set up database alerts
- Track query performance

## 🔄 **CI/CD Pipeline**

### **1. GitHub Actions (Optional)**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **2. Automated Testing**
```bash
# Run tests before deployment
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **2. Environment Variable Issues**
- Check variable names (case-sensitive)
- Ensure all required variables are set
- Verify variable values are correct

#### **3. Database Connection Issues**
- Check Supabase URL and keys
- Verify database is accessible
- Check RLS policies

#### **4. Payment Issues**
- Verify Paystack keys are correct
- Check webhook configuration
- Test in Paystack test mode first

### **Debug Commands**
```bash
# Check environment variables
npm run validate-env

# Test database connection
npm run test-db

# Test API endpoints
npm run test-api
```

## 📈 **Performance Optimization**

### **1. Frontend Optimization**
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images

### **2. Backend Optimization**
- Use connection pooling
- Implement caching
- Optimize database queries
- Use compression middleware

### **3. Database Optimization**
- Create proper indexes
- Optimize queries
- Use connection pooling
- Monitor query performance

## 🔄 **Maintenance**

### **1. Regular Updates**
- Update dependencies monthly
- Monitor security advisories
- Update Node.js version
- Update Supabase client

### **2. Backup Strategy**
- Enable Supabase backups
- Export data regularly
- Test restore procedures
- Document backup schedule

### **3. Monitoring**
- Set up uptime monitoring
- Monitor error rates
- Track performance metrics
- Set up alerts

## 📞 **Support**

### **1. Documentation**
- API documentation
- Component documentation
- Database schema
- Deployment guides

### **2. Contact Information**
- Technical support: support@thekingezekielacademy.com
- Development team: dev@thekingezekielacademy.com
- Emergency contact: +1-XXX-XXX-XXXX

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready
