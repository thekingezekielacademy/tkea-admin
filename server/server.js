const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

// Import routes
const contactRoutes = require('./routes/contact');
const flutterwaveRoutes = require('./routes/flutterwave');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'https://app.thekingezekielacademy.com',
    'https://thekingezekielacademy.com',
    'http://localhost:3000', // For development
    'http://localhost:3001'  // For development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
const FLUTTERWAVE_PLAN_ID = process.env.FLUTTERWAVE_PLAN_ID;

// Check Flutterwave configuration
if (!FLUTTERWAVE_SECRET_KEY || !FLUTTERWAVE_PUBLIC_KEY || !FLUTTERWAVE_ENCRYPTION_KEY) {
  console.log('⚠️ Flutterwave not configured - check environment variables');
} else {
  console.log('✅ Flutterwave configured successfully');
}

// Contact routes
app.use('/api/contact', contactRoutes);
app.use('/api/flutterwave', flutterwaveRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'King Ezekiel Academy API is running',
    paymentProvider: 'Flutterwave'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 King Ezekiel Academy API server running on port ${PORT}`);
  console.log(`💳 Flutterwave payment endpoint: http://localhost:${PORT}/api/flutterwave/initialize-payment`);
  console.log(`📡 Flutterwave webhook endpoint: http://localhost:${PORT}/api/flutterwave/webhook`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
