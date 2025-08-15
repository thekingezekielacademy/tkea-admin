# 🚀 Namecheap Hosting Deployment Guide

## 📋 **Prerequisites**
- Namecheap hosting account
- Domain name (optional but recommended)
- FileZilla or similar FTP client

## 🎯 **Deployment Options**

### **Option 1: Shared Hosting (Recommended for beginners)**

#### **Step 1: Prepare Your Files**
Your files are ready in the `namecheap-deploy/` folder. This contains:
- Built React app
- `.htaccess` file for proper routing
- All static assets

#### **Step 2: Upload to Namecheap**
1. **Login to Namecheap cPanel**
2. **Go to File Manager**
3. **Navigate to `public_html/` folder**
4. **Upload all files from `namecheap-deploy/` folder**

#### **Step 3: Configure Domain**
1. **Point your domain to Namecheap nameservers**
2. **Wait for DNS propagation (24-48 hours)**
3. **Enable SSL certificate in cPanel**

### **Option 2: VPS Hosting (Advanced users)**

#### **Step 1: Server Setup**
```bash
# Connect to your VPS
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt update
sudo apt install nginx
```

#### **Step 2: Deploy Backend**
```bash
# Upload your server folder
# Install dependencies
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start server/index.js --name "king-ezekiel-academy"
pm2 startup
pm2 save
```

#### **Step 3: Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend (React app)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 **Environment Configuration**

### **Frontend Environment Variables**
Create `.env.production` in your client folder:
```env
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key
REACT_APP_API_URL=https://yourdomain.com/api
```

### **Backend Environment Variables**
Create `.env` in your server folder:
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
PORT=5000
NODE_ENV=production
```

## 📱 **Testing Your Deployment**

1. **Visit your domain** in a browser
2. **Test navigation** between pages
3. **Test authentication** (sign up/sign in)
4. **Test course browsing**
5. **Check mobile responsiveness**

## 🚨 **Common Issues & Solutions**

### **404 Errors on Page Refresh**
- Ensure `.htaccess` file is uploaded
- Check if mod_rewrite is enabled in cPanel

### **API Calls Failing**
- Verify backend server is running
- Check CORS configuration
- Ensure API URL is correct in frontend

### **Static Assets Not Loading**
- Check file permissions (644 for files, 755 for folders)
- Verify all files were uploaded completely

## 💰 **Cost Comparison**

| Platform | Cost | Features | Difficulty |
|----------|------|----------|------------|
| **GitHub Pages** | Free | Basic hosting | Easy |
| **Namecheap Shared** | $3-10/month | Full hosting + domain | Easy |
| **Namecheap VPS** | $15-50/month | Full control + performance | Advanced |

## 🎉 **Benefits of Namecheap Hosting**

✅ **Professional domain** (e.g., `kingezekielacademy.com`)
✅ **Better performance** than free platforms
✅ **Full control** over your hosting
✅ **SSL certificate** included
✅ **Email hosting** available
✅ **24/7 support** from Namecheap
✅ **No GitHub limitations** or routing issues

## 📞 **Support Resources**

- **Namecheap Support**: Live chat and ticket system
- **cPanel Documentation**: Comprehensive hosting guides
- **Community Forums**: User-generated solutions

---

**Ready to deploy?** Your files are prepared in the `namecheap-deploy/` folder! 🚀
