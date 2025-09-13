#!/bin/bash

# Pre-deployment testing script to prevent routing errors
echo "🔍 Running pre-deployment tests..."

# Test 1: Build the project locally
echo "📦 Testing build process..."
cd client && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi
echo "✅ Build successful"

# Test 2: Test local server
echo "🌐 Testing local server..."
cd .. && node server/index.js &
SERVER_PID=$!
sleep 5

# Test 3: Test key routes
echo "🔗 Testing key routes..."
ROUTES=("/" "/courses" "/dashboard" "/about" "/contact")

for route in "${ROUTES[@]}"; do
    echo "Testing route: $route"
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
    if [ "$response" != "200" ]; then
        echo "❌ Route $route returned $response. Aborting deployment."
        kill $SERVER_PID
        exit 1
    fi
    echo "✅ Route $route OK"
done

# Cleanup
kill $SERVER_PID
echo "✅ All pre-deployment tests passed!"
