#!/bin/bash

echo "🧪 Testing Vercel Build Process Locally..."
echo "=========================================="

# Step 1: Install Dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
cd client && npm install
cd ..

# Step 2: Copy Public Folder to Src
echo "📁 Step 2: Copying public folder to src..."
cp -r client/public client/src
echo "✅ Public folder copied to src:"
ls -la client/src/ | grep -E "(index\.html|favicon|logo)"

# Step 3: Run Build Command
echo "🔨 Step 3: Running build command..."
cd client && npm run build
cd ..

# Step 4: Verify Build Output
echo "✅ Step 4: Verifying build output..."
echo "Build folder contents:"
ls -la client/build/

# Step 5: Test Routing Files
echo "🔄 Step 5: Testing routing files..."
if [ -f "client/build/index.html" ]; then
    echo "✅ index.html found - routing will work!"
else
    echo "❌ index.html missing - routing will fail!"
fi

echo ""
echo "🎉 Vercel build process test completed!"
echo "If all steps passed, your deployment should work on Vercel!"
