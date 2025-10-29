#!/bin/bash

# Script to sync local dev branch with remote dev branch
# This prevents merge conflicts when cloning or pulling from dev

set -e

echo "🔄 Syncing dev branch with remote..."

# Fetch latest changes from remote
git fetch origin

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  You are not on dev branch. Switching to dev..."
    git checkout dev
fi

# Check if local and remote have diverged
LOCAL_COMMITS=$(git rev-list --count origin/dev..dev 2>/dev/null || echo "0")
REMOTE_COMMITS=$(git rev-list --count dev..origin/dev 2>/dev/null || echo "0")

if [ "$LOCAL_COMMITS" != "0" ] || [ "$REMOTE_COMMITS" != "0" ]; then
    echo "⚠️  Local and remote dev branches have diverged!"
    echo "   Local commits ahead: $LOCAL_COMMITS"
    echo "   Remote commits ahead: $REMOTE_COMMITS"
    echo ""
    echo "📋 Options:"
    echo "   1. Reset local dev to match remote (discards local changes)"
    echo "   2. Pull and merge remote changes"
    echo "   3. Abort"
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            echo "🔄 Resetting local dev to match origin/dev..."
            git reset --hard origin/dev
            echo "✅ Local dev now matches origin/dev"
            ;;
        2)
            echo "🔄 Pulling and merging remote changes..."
            git pull origin dev --no-rebase
            echo "✅ Merged remote changes into local dev"
            ;;
        3)
            echo "❌ Aborted."
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Aborted."
            exit 1
            ;;
    esac
else
    echo "✅ Local dev is up to date with origin/dev"
fi

echo ""
echo "✅ Dev branch sync complete!"

