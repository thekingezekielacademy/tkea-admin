const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Import user agent detection
const { browserDetectionMiddleware, requiresES5Fallback } = require('../server/utils/userAgentDetection');

// Load environment variables
dotenv.config();

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

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));
app.use('/build-es5', express.static(path.join(__dirname, '../client/build-es5')));

// Main route handler with conditional serving
app.get('*', (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const browserInfo = req.browserInfo || {};
  
  console.log('🚀 Serverless function called for:', req.url);
  console.log('User Agent:', userAgent);
  console.log('Browser Info:', browserInfo);
  
  // Check if this browser requires ES5 fallback
  if (browserInfo.isMiniBrowser) {
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

module.exports = app;