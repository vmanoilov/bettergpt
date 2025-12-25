#!/bin/bash
# Package BetterGPT for Chrome Web Store
# This script builds the extension and creates a zip package suitable for Chrome Web Store submission

set -e  # Exit on error

echo "========================================="
echo "  BetterGPT - Chrome Web Store Packager"
echo "========================================="
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Packaging version: $VERSION"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -f bettergpt-chrome-*.zip

# Build the extension
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build complete"
echo ""

# Create package
echo "📦 Creating ZIP package..."
cd dist

# Exclude unnecessary files
zip -r ../bettergpt-chrome-v${VERSION}.zip . \
  -x "*.DS_Store" \
  -x "__MACOSX/*" \
  -x "*.map" \
  -x "*.ts"

cd ..

# Get file size
SIZE=$(du -h bettergpt-chrome-v${VERSION}.zip | cut -f1)

echo "✅ Package created: bettergpt-chrome-v${VERSION}.zip"
echo "📊 Package size: $SIZE"
echo ""

# Verify package contents
echo "📋 Package contents:"
unzip -l bettergpt-chrome-v${VERSION}.zip | head -20
echo "..."
echo ""

# Check for manifest
if unzip -l bettergpt-chrome-v${VERSION}.zip | grep -q "manifest.json"; then
  echo "✅ manifest.json found"
else
  echo "❌ manifest.json missing!"
  exit 1
fi

# Check for required directories
if unzip -l bettergpt-chrome-v${VERSION}.zip | grep -q "icons/"; then
  echo "✅ icons directory found"
else
  echo "❌ icons directory missing!"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ Chrome package ready for upload!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to https://chrome.google.com/webstore/devconsole"
echo "2. Upload bettergpt-chrome-v${VERSION}.zip"
echo "3. Fill out store listing details"
echo "4. Submit for review"
echo ""
