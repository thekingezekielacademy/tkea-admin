#!/bin/bash

# Health check script to verify site is working
echo "🏥 Running health check on production site..."

SITE_URL="https://app.thekingezekielacademy.com"
ROUTES=("/" "/courses" "/dashboard" "/about" "/contact")

echo "🔍 Testing site: $SITE_URL"

for route in "${ROUTES[@]}"; do
    echo "Testing route: $route"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$route")
    
    if [ "$response" = "200" ]; then
        echo "✅ $route - OK"
    elif [ "$response" = "404" ]; then
        echo "❌ $route - 404 ERROR! Site needs immediate attention!"
        exit 1
    else
        echo "⚠️  $route - HTTP $response"
    fi
done

echo "✅ All routes are working correctly!"
