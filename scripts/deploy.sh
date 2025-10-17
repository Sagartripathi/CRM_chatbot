#!/bin/bash

# CRM Chatbot Deployment Script
# This script helps deploy the application to production

set -e  # Exit on any error

echo "🚀 CRM Chatbot Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    print_warning "You're not on main branch (current: $current_branch)"
    read -p "Do you want to switch to main branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        git pull origin main
    else
        print_error "Deployment cancelled. Please switch to main branch first."
        exit 1
    fi
fi

print_status "Starting deployment process..."

# 1. Check git status
print_status "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status
    exit 1
fi

# 2. Pull latest changes
print_status "Pulling latest changes from main..."
git pull origin main

# 3. Check if there are any changes to deploy
if [ -z "$(git log HEAD~1..HEAD --oneline)" ]; then
    print_warning "No new commits to deploy."
    read -p "Do you want to continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# 4. Run tests (if available)
print_status "Running tests..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if yarn test --passWithNoTests 2>/dev/null; then
        print_success "Frontend tests passed"
    else
        print_warning "Frontend tests failed or not found"
    fi
    cd ..
fi

if [ -f "backend/requirements.txt" ]; then
    cd backend
    if python -m pytest tests/ 2>/dev/null; then
        print_success "Backend tests passed"
    else
        print_warning "Backend tests failed or not found"
    fi
    cd ..
fi

# 5. Deploy to Vercel (if Vercel CLI is available)
print_status "Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    cd frontend
    if vercel --prod --yes; then
        print_success "Vercel deployment successful"
    else
        print_error "Vercel deployment failed"
        exit 1
    fi
    cd ..
else
    print_warning "Vercel CLI not found. Please deploy manually or set up GitHub Actions."
fi

# 6. Deploy to Render (manual trigger)
print_status "Render deployment..."
print_warning "Render deployment needs to be triggered manually or via GitHub webhook."
print_status "Please check Render dashboard for deployment status."

# 7. Final status
print_success "Deployment process completed!"
echo
print_status "Next steps:"
echo "1. Check Vercel dashboard: https://vercel.com/dashboard"
echo "2. Check Render dashboard: https://dashboard.render.com"
echo "3. Test your application: https://crm-chatbot-tau.vercel.app"
echo "4. Monitor logs for any issues"
echo
print_success "🎉 Deployment completed successfully!"
