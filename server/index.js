const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const SubscriptionService = require('./services/subscriptionService');

// Import user agent detection
const { browserDetectionMiddleware, requiresES5Fallback } = require('./utils/userAgentDetection');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const paymentRoutes = require('./routes/payments');
const flutterwaveRoutes = require('./routes/flutterwave');
// const paystackRoutes = require('./routes/paystack'); // Disabled - using Flutterwave instead

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Security middleware with relaxed CSP for analytics
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://connect.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://analytics.google.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors());

// Browser detection middleware
app.use(browserDetectionMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://evqerkqiquwxqlizdqmg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3MTQ1NSwiZXhwIjoyMDcwMjQ3NDU1fQ.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Make supabase available to routes
app.locals.supabase = supabase;

console.log('✅ Supabase connected successfully');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/flutterwave', flutterwaveRoutes);
// app.use('/api/paystack', paystackRoutes); // Disabled - using Flutterwave instead

// --- Automated Cleanup of Expired Subscriptions ---
const subscriptionService = new SubscriptionService();
cron.schedule('0 * * * *', async () => {
  try {
    console.log('[CRON] Running hourly expired subscription cleanup...');
    const cleanedUp = await subscriptionService.cleanupExpiredSubscriptions();
    console.log(`[CRON] Cleanup complete: ${cleanedUp.length || 0} expired subscriptions`);
  } catch (error) {
    console.error('[CRON] Cleanup failed:', error);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'King Ezekiel Academy API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve service worker with correct MIME type
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../public/sw.js'));
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  // Middleware to set correct MIME types for static files
  app.use((req, res, next) => {
    if (req.url.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (req.url.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (req.url.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    next();
  });
  
  // Serve static assets from both builds
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.use('/build-es5', express.static(path.join(__dirname, '../client/build-es5')));
  
  // Main route handler with conditional serving
  app.get('*', (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const browserInfo = req.browserInfo || {};
    
    // Check if this browser requires ES5 fallback
    if (browserInfo.requiresES5Fallback) {
      console.log('📱 Serving ES5 build for mini browser:', userAgent);
      console.log('Browser Info:', {
        isInstagram: browserInfo.isInstagram,
        isFacebook: browserInfo.isFacebook,
        isMiniBrowser: browserInfo.isMiniBrowser
      });
      
      // Serve ES5-compatible build for Instagram/Facebook browsers
      const es5Path = path.join(__dirname, '../client/build-es5', 'index.html');
      if (fs.existsSync(es5Path)) {
        res.sendFile(es5Path);
      } else {
        // Fallback to mini HTML if ES5 build doesn't exist
        const miniHtmlPath = path.join(__dirname, '../client/public/index-mini.html');
        if (fs.existsSync(miniHtmlPath)) {
          res.sendFile(miniHtmlPath);
        } else {
          // Final fallback
          res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>King Ezekiel Academy</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background: #f8f9fa;
            text-align: center;
        }
        .container { 
            max-width: 600px; margin: 0 auto; padding: 40px 20px;
            background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 30px; }
        .btn { 
            background: #007bff; color: white; border: none; 
            padding: 12px 24px; border-radius: 6px; cursor: pointer;
            font-size: 16px; text-decoration: none; display: inline-block;
        }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>King Ezekiel Academy</h1>
        <p>Welcome to King Ezekiel Academy! For the best experience, please open this link in your regular browser.</p>
        <p>You can also try refreshing the page or using a different browser.</p>
        <a href="javascript:window.location.reload()" class="btn">Refresh Page</a>
        <br><br>
        <a href="https://app.thekingezekielacademy.com" class="btn">Open in Browser</a>
    </div>
</body>
</html>
          `);
        }
      }
    } else {
      // Serve normal React build for modern browsers
      console.log('🌐 Serving modern build for:', userAgent);
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 King Ezekiel Academy API is live!`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 