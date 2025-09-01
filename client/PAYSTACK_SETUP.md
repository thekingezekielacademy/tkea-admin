# 🔧 Paystack Setup & Subscription Cancellation Fix

## 🚨 **Current Issue: Subscription Cancellation Not Working**

### **Problem Analysis:**
- **Error**: `POST https://api.paystack.co/subscription/disable 400 (Bad Request)`
- **Root Cause**: Missing or invalid `REACT_APP_PAYSTACK_SECRET_KEY`
- **Security Issue**: Client-side API calls expose secret keys

## 🛠️ **Solutions Implemented:**

### **1. Created Subscription Service (`src/services/subscriptionService.ts`)**
- Secure subscription management through backend API
- Fallback to direct Paystack calls if needed
- Proper error handling and logging

### **2. Created API Route (`api/subscriptions/cancel.ts`)**
- Serverless function for Vercel deployment
- Secure server-side Paystack API calls
- Proper environment variable handling

### **3. Updated Subscription Component**
- Integrated with subscription service
- Better error handling and user feedback
- Secure cancellation flow

## 🔑 **Environment Variables Required:**

### **Local Development (.env.local):**
```bash
# Paystack Configuration
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_test_key_here
REACT_APP_PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
REACT_APP_PAYSTACK_PLAN_CODE=PLN_your_plan_code_here

# API Configuration
REACT_APP_API_URL=http://localhost:3000/api
```

### **Production (Vercel Environment Variables):**
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
PAYSTACK_PLAN_CODE=PLN_your_live_plan_code_here

# API Configuration
REACT_APP_API_URL=https://app.thekingezekielacademy.com/api
```

## 🚀 **Setup Steps:**

### **Step 1: Get Your Paystack Keys**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Copy your **Secret Key** and **Public Key**
4. Note your **Plan Code** from **Settings** > **Plans**

### **Step 2: Configure Local Environment**
1. Create `.env.local` file in client directory
2. Add your Paystack keys:
   ```bash
   REACT_APP_PAYSTACK_SECRET_KEY=sk_test_your_actual_key
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_key
   ```

### **Step 3: Configure Vercel Environment**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add:
   - `PAYSTACK_SECRET_KEY` = your live secret key
   - `PAYSTACK_PUBLIC_KEY` = your live public key

### **Step 4: Deploy API Route**
1. The API route is already created at `api/subscriptions/cancel.ts`
2. Deploy to Vercel: `vercel --prod`
3. The route will be available at: `https://app.thekingezekielacademy.com/api/subscriptions/cancel`

## 🔍 **Testing the Fix:**

### **1. Test Local Development:**
```bash
# Start development server
npm start

# Test subscription cancellation
# Check browser console for detailed logs
```

### **2. Test Production:**
```bash
# Deploy to production
vercel --prod

# Test on live site
# Monitor Vercel function logs
```

## 📊 **Expected Behavior After Fix:**

### **Before Fix:**
- ❌ 400 Bad Request from Paystack
- ❌ "sk_test..." fallback key error
- ❌ Client-side secret key exposure

### **After Fix:**
- ✅ Secure server-side API calls
- ✅ Proper error handling
- ✅ Environment variable security
- ✅ Detailed error logging

## 🚨 **Common Issues & Solutions:**

### **Issue 1: "PAYSTACK_SECRET_KEY not configured"**
**Solution**: Set environment variable in Vercel dashboard

### **Issue 2: "Method not allowed"**
**Solution**: Ensure API route is deployed and accessible

### **Issue 3: "Missing required fields"**
**Solution**: Check that subscriptionId and paystackSubscriptionId are passed

### **Issue 4: "Paystack API error: 400"**
**Solution**: Verify subscription code is valid and not already cancelled

## 🔒 **Security Improvements:**

1. **No More Client-Side Secret Keys**
2. **Server-Side API Validation**
3. **Proper Authentication Checks**
4. **Environment Variable Protection**

## 📞 **Support:**

If you continue to experience issues:

1. **Check Vercel Function Logs** for detailed error information
2. **Verify Environment Variables** are properly set
3. **Test Paystack API** directly with your keys
4. **Contact Support** with specific error messages

---

**Last Updated**: January 31, 2025  
**Status**: ✅ Implemented, needs environment configuration  
**Next Step**: Configure Paystack environment variables
