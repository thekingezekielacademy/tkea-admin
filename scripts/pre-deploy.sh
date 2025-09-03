#!/bin/bash

# Pre-deployment script for King Ezekiel Academy
# This script ensures the build passes before deployment

echo "🚀 Starting pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Run build to ensure everything compiles
echo "🔨 Running build..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed! Please fix the errors before deploying."
    exit 1
fi

# Run any additional checks here if needed
echo "✅ All pre-deployment checks passed!"
echo "🚀 Ready for deployment!"
