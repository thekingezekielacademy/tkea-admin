const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// Security middleware
app.use(helmet());
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
  // Serve static assets
  app.use(express.static(path.join(__dirname, '../client/build')));
  
        // Main route handler with conditional serving
        app.get('*', (req, res) => {
          const userAgent = req.get('User-Agent') || '';
          const browserInfo = req.browserInfo || {};
          
          // Check if this browser requires mini browser fallback
          if (browserInfo.isMiniBrowser) {
            console.log('📱 Serving mini browser fallback for:', userAgent);
            console.log('Browser Info:', {
              isInstagram: browserInfo.isInstagram,
              isFacebook: browserInfo.isFacebook,
              isMiniBrowser: browserInfo.isMiniBrowser
            });
            
            // Serve static mini HTML for Instagram/Facebook browsers
            const miniHtmlPath = path.join(__dirname, '../client/public/index-mini.html');
            if (fs.existsSync(miniHtmlPath)) {
              res.sendFile(miniHtmlPath);
            } else {
              // Fallback if file doesn't exist
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