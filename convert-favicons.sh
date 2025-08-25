#!/bin/bash

# 🎨 KEA Favicon Conversion Script
# This script converts your SVG favicon to all required formats

echo "🚀 Starting KEA favicon conversion..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it first:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Navigate to the public directory
cd client/public

echo "📁 Working in: $(pwd)"

# Convert SVG to ICO (32x32)
echo "🔄 Converting to favicon.ico (32x32)..."
convert favicon.svg -resize 32x32 favicon.ico

# Convert SVG to PNG sizes
echo "🔄 Converting to favicon-16x16.png..."
convert favicon.svg -resize 16x16 favicon-16x16.png

echo "🔄 Converting to favicon-32x32.png..."
convert favicon.svg -resize 32x32 favicon-32x32.png

echo "🔄 Converting to apple-touch-icon.png (180x180)..."
convert favicon.svg -resize 180x180 apple-touch-icon.png

# Create a larger version for high-DPI displays
echo "🔄 Converting to favicon-48x48.png..."
convert favicon.svg -resize 48x48 favicon-48x48.png

echo "✅ Favicon conversion complete!"
echo ""
echo "📁 Generated files:"
ls -la favicon* apple-touch-icon.png
echo ""
echo "🎯 Next steps:"
echo "1. Deploy these files to your live site"
echo "2. Clear browser cache and test"
echo "3. Check browser tab for KEA logo"
echo ""
echo "🌐 Test URL: https://app.thekingezekielacademy.com"
