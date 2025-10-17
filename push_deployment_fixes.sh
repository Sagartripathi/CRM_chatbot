#!/bin/bash

# Deployment Fix - Commit and Push Script
# This script commits all deployment fixes and pushes them to trigger Render redeploy

echo "🚀 Preparing to push deployment fixes..."
echo ""

# Show what will be committed
echo "📋 Files that will be committed:"
git status --short
echo ""

# Ask for confirmation
read -p "❓ Do you want to commit and push these changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "✅ Committing changes..."
    
    # Add all files
    git add .
    
    # Commit with descriptive message
    git commit -m "Fix: Render deployment issues - port binding and MongoDB SSL

- Updated database.py with proper SSL/TLS handling for MongoDB Atlas
- Fixed start command in all deployment guides (use uvicorn, not python run.py)
- Added comprehensive troubleshooting documentation
- Created deployment guides and troubleshooting references
- Added environment variable templates"
    
    echo ""
    echo "📤 Pushing to repository..."
    
    # Push to remote
    git push
    
    echo ""
    echo "✅ Push completed!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to Render Dashboard → Your Service → Settings"
    echo "2. Update Start Command to: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
    echo "3. Verify all 10 environment variables are set"
    echo "4. Wait for automatic redeploy (3-5 minutes)"
    echo "5. Test: https://your-backend.onrender.com/api/health"
    echo ""
    echo "📚 If issues persist, check:"
    echo "   - RENDER_DEPLOYMENT_FIX.md"
    echo "   - COMMON_DEPLOYMENT_ERRORS.md"
    echo ""
else
    echo "❌ Push cancelled. No changes were made."
    echo ""
fi

