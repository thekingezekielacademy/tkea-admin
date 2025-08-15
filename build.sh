#!/bin/bash

# Custom build script for Vercel deployment
echo "🚀 Starting custom build process..."

# Ensure we're in the right directory
cd /vercel/path0

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Ensure public folder exists and has all files
echo "📁 Verifying public folder..."
ls -la public/

# Build the React app
echo "🔨 Building React app..."
npm run build

# Verify build output
echo "✅ Build complete! Checking output..."
ls -la build/

echo "🎉 Build process finished successfully!"
