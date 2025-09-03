#!/bin/bash

# Deployment script for King Ezekiel Academy
# This script runs build checks and then deploys

echo "🚀 Starting deployment process..."

# Run pre-deployment checks
echo "📋 Running pre-deployment checks..."
./scripts/pre-deploy.sh

if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment checks failed. Aborting deployment."
    exit 1
fi

# Add all changes to git
echo "📝 Adding changes to git..."
git add .

# Commit with timestamp
echo "💾 Committing changes..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "Deploy: $TIMESTAMP

- Build verified and passed
- All changes committed and ready for deployment"

# Push to main branch
echo "🚀 Pushing to main branch..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to main branch!"
    echo "🌐 Deployment will be triggered automatically on Vercel"
    echo "⏳ Please wait 2-3 minutes for deployment to complete"
else
    echo "❌ Failed to push to main branch"
    exit 1
fi

echo "🎉 Deployment process completed!"
