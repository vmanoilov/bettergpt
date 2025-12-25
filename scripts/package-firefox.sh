#!/bin/bash
# Package BetterGPT for Firefox Add-ons
# This script builds the extension with Firefox-specific manifest and creates a zip package
#
# NOTE: Before first submission, update the extension ID in manifest.firefox.json
#       (browser_specific_settings.gecko.id) to match your developer account

set -e  # Exit on error

echo "========================================="
echo "  BetterGPT - Firefox Add-ons Packager"
echo "========================================="
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Packaging version: $VERSION"
echo ""

# Backup Chrome manifest
echo "💾 Backing up Chrome manifest..."
cp manifest.json manifest.chrome.json.bak

# Copy Firefox manifest
echo "🦊 Using Firefox manifest..."
cp manifest.firefox.json manifest.json

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -f bettergpt-firefox-*.zip

# Build the extension
echo "🔨 Building extension..."
npm run build
BUILD_STATUS=$?

# Restore Chrome manifest
echo "🔄 Restoring Chrome manifest..."
mv manifest.chrome.json.bak manifest.json

# Check build status after restoring manifest
if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build complete"
echo ""

# Create package
echo "📦 Creating ZIP package..."
cd dist

# Exclude unnecessary files
zip -r ../bettergpt-firefox-v${VERSION}.zip . \
  -x "*.DS_Store" \
  -x "__MACOSX/*" \
  -x "*.map" \
  -x "*.ts"

cd ..

# Get file size
SIZE=$(du -h bettergpt-firefox-v${VERSION}.zip | cut -f1)

echo "✅ Package created: bettergpt-firefox-v${VERSION}.zip"
echo "📊 Package size: $SIZE"
echo ""

# Verify package contents
echo "📋 Package contents:"
unzip -l bettergpt-firefox-v${VERSION}.zip | head -20
echo "..."
echo ""

# Check for manifest
if unzip -l bettergpt-firefox-v${VERSION}.zip | grep -q "manifest.json"; then
  echo "✅ manifest.json found"
else
  echo "❌ manifest.json missing!"
  exit 1
fi

# Check for browser_specific_settings
if unzip -p bettergpt-firefox-v${VERSION}.zip manifest.json | grep -q "browser_specific_settings"; then
  echo "✅ Firefox-specific settings found"
else
  echo "⚠️  Warning: browser_specific_settings not found in manifest"
fi

# Check for required directories
if unzip -l bettergpt-firefox-v${VERSION}.zip | grep -q "icons/"; then
  echo "✅ icons directory found"
else
  echo "❌ icons directory missing!"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ Firefox package ready for upload!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to https://addons.mozilla.org/developers/"
echo "2. Upload bettergpt-firefox-v${VERSION}.zip"
echo "3. Fill out add-on listing details"
echo "4. Provide source code if using minification"
echo "5. Submit for review"
echo ""
echo "Note: Firefox review may take 1-7 business days"
echo ""
