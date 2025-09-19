const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Main route handler - serve React app directly
app.get('*', (req, res) => {
  console.log('🚀 Serverless function called for:', req.url);
  
  // Always serve the React app - let polyfills handle compatibility
  const indexPath = path.join(__dirname, '../client/build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found');
  }
});

module.exports = app;