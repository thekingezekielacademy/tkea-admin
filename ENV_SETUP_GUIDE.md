# 🔧 Environment Variables Setup Guide

## ✅ **YES! You CAN put Flutterwave keys in .env file**

This is actually the **BEST PRACTICE** for managing environment variables locally.

## 📝 **How to Set Up Your .env File**

### 1. **Create .env file in your project root:**

```bash
# Navigate to your project directory
cd /Users/mac/thekingezekielacademy

# Create .env file
touch .env
```

### 2. **Add your Flutterwave keys to .env:**

```env
# Flutterwave Configuration
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-454fa0a1faa931dcccf6672ed71645cd-X
REACT_APP_FLUTTERWAVE_SECRET_KEY=FLWSECK-eb50a05e74e4a648510719bfa75dad5b-1993ab9913bvt-X
REACT_APP_FLUTTERWAVE_CLIENT_ID=dc123fca-4b34-4241-8003-d41a15b96fa0
REACT_APP_FLUTTERWAVE_ENCRYPTION_KEY=eb50a05e74e459b334aad266
REACT_APP_FLUTTERWAVE_PLAN_ID=146851
REACT_APP_FLUTTERWAVE_MODE=live

# Server-side Flutterwave Keys (for API routes)
FLUTTERWAVE_SECRET_KEY=FLWSECK-eb50a05e74e4a648510719bfa75dad5b-1993ab9913bvt-X
FLUTTERWAVE_PLAN_ID=146851

# Supabase Configuration (add your actual keys)
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Other Environment Variables
NODE_ENV=development
```

## 🔒 **Security Benefits:**

✅ **`.env` files are already in `.gitignore`** - your keys won't be committed to git  
✅ **Local development** - keys stay on your machine  
✅ **Easy management** - all keys in one place  
✅ **No hardcoding** - clean, professional code  

## 🚀 **How It Works:**

### **Client-side (React):**
- Uses `REACT_APP_FLUTTERWAVE_PUBLIC_KEY` from `.env`
- Automatically loaded by Create React App
- Available as `process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY`

### **Server-side (Vercel API):**
- Uses `FLUTTERWAVE_SECRET_KEY` from `.env` (locally)
- Uses Vercel environment variables (in production)
- Available as `process.env.FLUTTERWAVE_SECRET_KEY`

## 📋 **Current Setup Status:**

✅ **Vercel Production**: Keys already configured in Vercel dashboard  
✅ **Local Development**: Create `.env` file with keys above  
✅ **Git Security**: `.env` files are ignored (won't be committed)  

## 🎯 **Next Steps:**

1. **Create `.env` file** with the keys above
2. **Restart your development server** (`npm start`)
3. **Test locally** - your app will use the `.env` keys
4. **Deploy to production** - Vercel will use its environment variables

## 💡 **Pro Tips:**

- **Never commit `.env` files** to git (already configured ✅)
- **Use different keys** for development vs production
- **Keep your `.env` file secure** - don't share it
- **Restart dev server** after changing `.env` files

---

**Your Flutterwave integration will work perfectly with this setup!** 🎉
