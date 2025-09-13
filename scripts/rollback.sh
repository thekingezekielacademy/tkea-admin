#!/bin/bash

# Emergency rollback script for quick recovery
echo "🚨 Emergency rollback initiated..."

# Get the last known good deployment
echo "📋 Getting last known good deployment..."
LAST_GOOD=$(npx vercel ls | grep "Ready" | head -2 | tail -1 | awk '{print $2}')

if [ -z "$LAST_GOOD" ]; then
    echo "❌ No good deployment found!"
    exit 1
fi

echo "🔄 Rolling back to: $LAST_GOOD"

# Rollback to last good deployment
npx vercel rollback $LAST_GOOD --prod

if [ $? -eq 0 ]; then
    echo "✅ Rollback successful!"
    echo "🌐 Site should be working at: https://app.thekingezekielacademy.com/"
else
    echo "❌ Rollback failed!"
    exit 1
fi
