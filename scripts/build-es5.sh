#!/bin/bash

echo "🚀 Building ES5-Compatible Fallback for Mini Browsers"
echo "=================================================="

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ client directory not found!"
    exit 1
fi

cd client

echo "✅ client directory found"

# Check if required files exist
if [ ! -f "webpack.config.es5.js" ]; then
    echo "❌ webpack.config.es5.js not found!"
    exit 1
fi

if [ ! -f ".babelrc.es5" ]; then
    echo "❌ .babelrc.es5 not found!"
    exit 1
fi

if [ ! -f "public/index.es5.html" ]; then
    echo "❌ public/index.es5.html not found!"
    exit 1
fi

echo "✅ All required configuration files found"

# Clean previous build
echo "🧹 Cleaning previous ES5 build..."
rm -rf build-es5
mkdir -p build-es5/static/js build-es5/static/css build-es5/static/media

# Build ES5 bundle
echo "🔨 Building ES5-compatible bundle..."
npx webpack --config webpack.config.es5.js --mode production

if [ $? -ne 0 ]; then
    echo "❌ ES5 build failed!"
    exit 1
fi

echo "✅ ES5 bundle built successfully"

# Copy static assets
echo "📁 Copying static assets..."
cp -r public/* build-es5/
cp public/index.es5.html build-es5/index.html

# Verify build
echo "🔍 Verifying ES5 build..."
if [ ! -f "build-es5/index.html" ]; then
    echo "❌ ES5 index.html not found!"
    exit 1
fi

if [ ! -d "build-es5/static/js" ]; then
    echo "❌ ES5 static/js directory not found!"
    exit 1
fi

echo "✅ ES5 build verification passed"

# Show build info
echo ""
echo "📊 ES5 Build Summary:"
echo "===================="
echo "Build directory: client/build-es5"
echo "Main HTML: build-es5/index.html"
echo "JavaScript files:"
ls -la build-es5/static/js/ | grep -E "\.(js|map)$" | head -5
echo "CSS files:"
ls -la build-es5/static/css/ | grep -E "\.(css|map)$" | head -5

echo ""
echo "🎉 ES5 build completed successfully!"
echo "The fallback build is ready for mini browsers and old browsers."
echo ""
echo "To test the build:"
echo "1. Start your server: npm start"
echo "2. Test with Instagram/Facebook in-app browser"
echo "3. Check server logs for 'Serving ES5 fallback' messages"
