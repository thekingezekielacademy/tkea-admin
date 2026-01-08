#!/bin/bash

echo "🔍 Verifying Vercel Setup for Admin App"
echo "========================================"
echo ""

# Check vercel.json
echo "✅ Checking vercel.json..."
if [ -f "vercel.json" ]; then
    echo "   ✓ vercel.json exists"
    BUILD_CMD=$(grep -A 1 "buildCommand" vercel.json | grep -o '"[^"]*"' | head -1 | tr -d '"')
    OUTPUT_DIR=$(grep -A 1 "outputDirectory" vercel.json | grep -o '"[^"]*"' | head -1 | tr -d '"')
    echo "   Build Command: $BUILD_CMD"
    echo "   Output Directory: $OUTPUT_DIR"
    
    if [ "$BUILD_CMD" = "npm run build:admin" ] && [ "$OUTPUT_DIR" = "build" ]; then
        echo "   ✅ Configuration is correct!"
    else
        echo "   ❌ Configuration mismatch!"
    fi
else
    echo "   ❌ vercel.json not found!"
fi

echo ""

# Check package.json
echo "✅ Checking package.json..."
if grep -q "build:admin" package.json; then
    echo "   ✓ build:admin script exists"
    BUILD_SCRIPT=$(grep "build:admin" package.json | head -1)
    echo "   $BUILD_SCRIPT"
else
    echo "   ❌ build:admin script not found!"
fi

echo ""

# Check .vercelignore
echo "✅ Checking .vercelignore..."
if [ -f ".vercelignore" ]; then
    echo "   ✓ .vercelignore exists"
    if grep -q "king-ezekiel-academy-nextjs" .vercelignore; then
        echo "   ✅ Next.js app is excluded"
    else
        echo "   ⚠️  Next.js app might not be excluded"
    fi
else
    echo "   ⚠️  .vercelignore not found (not critical)"
fi

echo ""

# Check git remote
echo "✅ Checking Git remote..."
GIT_REMOTE=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   Remote: $GIT_REMOTE"
    if [[ "$GIT_REMOTE" == *"thekingezekielacademy/tkea-admin"* ]]; then
        echo "   ✅ Correct repository"
    else
        echo "   ⚠️  Repository might be incorrect"
    fi
else
    echo "   ❌ Git remote not found"
fi

echo ""

# Check latest commit
echo "✅ Latest commits:"
git log --oneline -3

echo ""
echo "========================================"
echo "📋 Next Steps:"
echo "1. Go to: https://vercel.com/king-ezekiel-academys-projects/tkeaadmin"
echo "2. Check Settings → Git → Verify connection to GitHub"
echo "3. Check Settings → General → Verify build settings match above"
echo "4. Check Deployments → Look for latest deployment status"
echo "5. If deployment failed, check build logs"
echo ""

