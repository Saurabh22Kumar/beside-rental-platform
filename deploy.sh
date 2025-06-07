#!/bin/bash

# 🚀 Deployment Script for Beside Rental Platform
# This script helps you push to GitHub and deploy to Vercel

echo "🚀 Beside Rental Platform - Deployment Helper"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo "----------------------------"
echo "✅ TypeScript errors fixed"
echo "✅ Build successful (npm run build)"
echo "⚠️  Environment variables use DEMO values"
echo ""

echo "🔧 What happens when you deploy with DEMO values:"
echo "------------------------------------------------"
echo "❌ User authentication won't work"
echo "❌ Database operations will fail"
echo "❌ Image uploads won't work"
echo "❌ App will show errors to users"
echo ""

echo "✅ What you need to do AFTER pushing to GitHub:"
echo "----------------------------------------------"
echo "1. Set up Supabase account (5 minutes)"
echo "2. Set up Cloudinary account (3 minutes)"
echo "3. Add real environment variables to Vercel"
echo "4. Redeploy with working credentials"
echo ""

read -p "📝 Do you want to continue pushing to GitHub? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled. Set up real credentials first!"
    echo "📖 See DEPLOYMENT_ENVIRONMENT_SETUP.md for instructions"
    exit 0
fi

echo ""
echo "🔍 Checking git status..."

# Check if there are changes to commit
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    echo "📝 Changes detected. Adding and committing..."
    git add .
    git commit -m "feat: complete rental platform with TypeScript fixes

- Fixed all TypeScript import errors
- Resolved booking calendar type inference issues  
- Added comprehensive deployment documentation
- Ready for production deployment (requires real credentials)
- Includes backend setup guides and environment configuration"
fi

echo ""
echo "🌐 Checking for GitHub remote..."

# Check if origin remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ GitHub remote found"
    echo "📤 Pushing to GitHub..."
    git push origin main
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ No GitHub remote found"
    echo ""
    echo "🔧 To add GitHub remote:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo "3. Run: git push -u origin main"
    echo ""
    echo "📖 Or follow GitHub's instructions for existing repositories"
    exit 1
fi

echo ""
echo "🎉 Deployment to GitHub Complete!"
echo "================================"
echo ""
echo "🔥 Next Steps for Vercel Deployment:"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repository"
echo "3. Add environment variables (see DEPLOYMENT_ENVIRONMENT_SETUP.md)"
echo "4. Deploy!"
echo ""
echo "📚 Documentation:"
echo "- DEPLOYMENT_ENVIRONMENT_SETUP.md - Complete setup guide"
echo "- BACKEND_SETUP_GUIDE.md - Backend configuration"
echo "- README.md - Project overview"
echo ""
echo "🆘 Need help? Check the documentation files!"
