#!/bin/bash

echo "🚀 Archive Fever AI 2.0 - Deployment Helper"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Archive Fever AI 2.0"
fi

# Check for required environment variables
echo "🔍 Checking environment..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env with your API keys before deploying"
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo "1. ✅ Ensure you have a Railway account"
echo "2. ✅ Install Railway CLI: npm install -g @railway/cli"
echo "3. ✅ Add your ANTHROPIC_API_KEY to .env"
echo "4. ✅ (Optional) Add email credentials for Substack"
echo ""

echo "🚂 Railway deployment steps:"
echo "1. Run: railway login"
echo "2. Run: railway init"
echo "3. Run: railway up"
echo "4. Run: railway open"
echo ""

echo "⚡ Quick deploy (if Railway CLI is installed):"
read -p "Deploy now with Railway? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway login && railway init && railway up
fi

echo ""
echo "🕸️ Archive Fever AI is ready for deployment!" 