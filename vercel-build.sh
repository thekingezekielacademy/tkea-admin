#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Check current directory
echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ client directory not found!"
    exit 1
fi

# Check if public directory exists
if [ ! -d "client/public" ]; then
    echo "❌ client/public directory not found!"
    echo "📁 client directory contents:"
    ls -la client/
    exit 1
fi

echo "✅ client/public directory found"

# Copy public folder to src
echo "📁 Copying public folder to src..."
cp -r client/public client/src/

# Verify copy
echo "✅ Public folder copied. Checking src contents:"
ls -la client/src/ | grep -E "(index\.html|favicon|logo)"

# Build the React app
echo "🔨 Building React app..."
cd client
npm run build

echo "🎉 Build process completed!"
