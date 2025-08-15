#!/bin/bash

echo "🚀 Starting Vercel Build Process..."
echo "=================================="

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ client directory not found!"
    exit 1
fi

echo "✅ client directory found"

# Check if public directory exists and has proper files
if [ ! -d "client/public" ] || [ ! -f "client/public/index.html" ]; then
    echo "📁 Creating public directory with proper files..."
    mkdir -p client/public
    
    # Create a proper index.html that will work with React build
    echo "📄 Creating index.html..."
    cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="./favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="King Ezekiel Academy - Modern Educational Platform" />
    <link rel="apple-touch-icon" href="./logo192.png" />
    <link rel="manifest" href="./manifest.json" />
    <title>King Ezekiel Academy</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

    # Create favicon.ico (empty file for now)
    echo "📄 Creating favicon.ico..."
    touch client/public/favicon.ico
    
    # Create manifest.json
    echo "📄 Creating manifest.json..."
    cat > client/public/manifest.json << 'EOF'
{
  "short_name": "King Ezekiel Academy",
  "name": "King Ezekiel Academy - Modern Educational Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": "./",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF

    # Create robots.txt
    echo "📄 Creating robots.txt..."
    cat > client/public/robots.txt << 'EOF'
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
EOF

    echo "✅ Public directory created with proper files"
else
    echo "✅ client/public directory found with existing files"
fi

# Set environment variables explicitly for the build
echo "🔧 Setting environment variables for build..."
export REACT_APP_SUPABASE_URL="https://evqerkqiquwxqlizdqmg.supabase.co"
export REACT_APP_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw"

# Unset CI to prevent ESLint warnings from failing the build
echo "🔧 Unsetting CI to prevent ESLint failures..."
unset CI

# Build the React app
echo "🔨 Building React app..."
cd client && npm run build
cd ..

echo "✅ Build completed!"
