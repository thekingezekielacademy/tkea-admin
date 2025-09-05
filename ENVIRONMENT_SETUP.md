# 🔧 Environment Configuration Guide

## 📋 **Required Environment Variables**

### **Client-Side (.env.local)**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://evqerkqiquwxqlizdqmg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw

# Paystack Configuration (Public Key Only)
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# API Configuration
REACT_APP_API_URL=https://app.thekingezekielacademy.com/api

# Analytics (Optional)
REACT_APP_GA_MEASUREMENT_ID=G-8DXQN4Q7LD
REACT_APP_FACEBOOK_PIXEL_ID=your_facebook_pixel_id
```

### **Server-Side (.env)**
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

## 🚀 **Setup Instructions**

### **Step 1: Client Environment**
1. Create `.env.local` file in `client/` directory
2. Copy the client-side variables above
3. Replace placeholder values with your actual keys

### **Step 2: Server Environment**
1. Create `.env` file in `server/` directory
2. Copy the server-side variables above
3. Replace placeholder values with your actual keys

### **Step 3: Vercel Environment (Production)**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from both client and server sections
3. Set appropriate environment (Production/Preview/Development)

## 🔐 **Security Notes**

- ✅ **Client-side**: Only public keys and URLs
- ✅ **Server-side**: Secret keys and sensitive data
- ❌ **Never**: Put secret keys in client-side code
- ❌ **Never**: Commit `.env` files to version control

## 🧪 **Testing Environment Variables**

### **Client Test**
```javascript
// Add to any component for testing
console.log('Environment check:', {
  supabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
  supabaseKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
  paystackKey: !!process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
  apiUrl: !!process.env.REACT_APP_API_URL
});
```

### **Server Test**
```javascript
// Add to server.js for testing
console.log('Server environment check:', {
  port: process.env.PORT,
  supabaseUrl: !!process.env.SUPABASE_URL,
  supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  paystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
  paystackPublic: !!process.env.PAYSTACK_PUBLIC_KEY
});
```

## 🚨 **Common Issues**

### **Issue 1: "PAYSTACK_SECRET_KEY not configured"**
- **Solution**: Add `PAYSTACK_SECRET_KEY` to server environment
- **Location**: Server `.env` file or Vercel environment variables

### **Issue 2: "REACT_APP_SUPABASE_URL is undefined"**
- **Solution**: Add `REACT_APP_SUPABASE_URL` to client environment
- **Location**: Client `.env.local` file or Vercel environment variables

### **Issue 3: "API calls failing"**
- **Solution**: Check `REACT_APP_API_URL` is correctly set
- **Location**: Client `.env.local` file

## 📊 **Environment Validation**

Run this script to validate your environment:

```bash
# Client validation
cd client && npm run validate-env

# Server validation
cd server && npm run validate-env
```

## 🔄 **Environment Sync**

To sync environments across different deployments:

1. **Development**: Use `.env.local` and `.env` files
2. **Staging**: Use Vercel preview environment variables
3. **Production**: Use Vercel production environment variables

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Ready for Implementation
