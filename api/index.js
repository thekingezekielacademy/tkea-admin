const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

module.exports = (req, res) => {
  console.log('🚀 Serverless function called for:', req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Always serve the React app - let polyfills handle compatibility
    const indexPath = join(__dirname, '../client/build', 'index.html');
    
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } else {
      res.status(404).send('Build not found');
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Internal server error');
  }
};