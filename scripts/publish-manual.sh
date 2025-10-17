#!/bin/bash

# Manual publish script - publish to both npm and GitHub Packages
# This script saves GitHub Actions minutes by running locally

set -e

echo "🚀 Manual Publish Script for @kiwina/jules-api-sdk"
echo ""

# Check if logged into npm
echo "📦 Step 1: Checking npm authentication..."
if npm whoami &> /dev/null; then
    echo "✅ Logged into npm as $(npm whoami)"
else
    echo "❌ Not logged into npm. Please run: npm login"
    exit 1
fi

# Check version
VERSION=$(node -p "require('./package.json').version")
echo ""
echo "📌 Current version: $VERSION"
echo ""

# Clean and build
echo "🧹 Step 2: Cleaning and building..."
bun run clean
bun run build

# Run tests
echo "🧪 Step 3: Running tests..."
bun run test:run

# Publish to npm
echo ""
echo "📤 Step 4: Publishing to npm..."

# Temporarily rename .npmrc if it exists (it might route to GitHub Packages)
if [ -f ".npmrc" ]; then
    mv .npmrc .npmrc.bak
fi

# Temporarily unset scoped registry
SCOPED_REGISTRY=$(npm config get @kiwina:registry)
npm config delete @kiwina:registry

npm publish --access public --registry=https://registry.npmjs.org/

# Restore scoped registry
if [ "$SCOPED_REGISTRY" != "undefined" ]; then
    npm config set @kiwina:registry "$SCOPED_REGISTRY"
fi

# Restore .npmrc
if [ -f ".npmrc.bak" ]; then
    mv .npmrc.bak .npmrc
fi

echo "✅ Published to npm!"

# Publish to GitHub Packages
echo ""
echo "📤 Step 5: Publishing to GitHub Packages..."

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set. Skipping GitHub Packages publish."
    echo "   To publish to GitHub Packages, set GITHUB_TOKEN:"
    echo "   export GITHUB_TOKEN=your_token"
else
    # Create tarball (already built from npm publish)
    TARBALL=$(npm pack 2>/dev/null | tail -1)
    
    # Set npm config temporarily for this session
    npm config set //npm.pkg.github.com/:_authToken "$GITHUB_TOKEN"
    
    # Publish the tarball to GitHub Packages
    npm publish "$TARBALL" --registry=https://npm.pkg.github.com/
    
    # Clean up
    npm config delete //npm.pkg.github.com/:_authToken
    rm -f "$TARBALL"
    
    echo "✅ Published to GitHub Packages!"
fi

# Create and push git tag
echo ""
echo "🏷️  Step 6: Creating git tag..."
git tag "v$VERSION" 2>/dev/null || echo "Tag v$VERSION already exists"
git push origin "v$VERSION" 2>/dev/null || echo "Tag already pushed"

echo ""
echo "🎉 Publishing complete!"
echo ""
echo "📍 Package locations:"
echo "   • npm: https://www.npmjs.com/package/@kiwina/jules-api-sdk"
echo "   • GitHub: https://github.com/kiwina/jules-api-sdk/packages"
echo ""
echo "📥 Install with:"
echo "   npm install @kiwina/jules-api-sdk"
echo "   # or from GitHub Packages:"
echo "   npm install @kiwina/jules-api-sdk --registry=https://npm.pkg.github.com"
