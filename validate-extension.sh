#!/bin/bash

# BetterGPT Extension Validation Script
# This script validates that the extension is properly built and ready to load

echo "==================================="
echo "BetterGPT Extension Validation"
echo "==================================="
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Please run 'npm run build' first."
    exit 1
fi

echo "✓ dist directory exists"

# Check if manifest.json exists
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ Error: manifest.json not found in dist directory."
    exit 1
fi

echo "✓ manifest.json exists"

# Check if background service worker exists
if [ ! -f "dist/background/service-worker.js" ]; then
    echo "❌ Error: background service worker not found."
    exit 1
fi

echo "✓ background/service-worker.js exists"

# Check if content script exists
if [ ! -f "dist/content/main.js" ]; then
    echo "❌ Error: content script not found."
    exit 1
fi

echo "✓ content/main.js exists"

# Check if CSS exists
if [ ! -f "dist/assets/main.css" ]; then
    echo "❌ Error: main.css not found."
    exit 1
fi

echo "✓ assets/main.css exists"

# Check if icons exist
for size in 16 48 128; do
    if [ ! -f "dist/icons/icon${size}.png" ]; then
        echo "❌ Error: icon${size}.png not found."
        exit 1
    fi
    echo "✓ icons/icon${size}.png exists"
done

echo ""
echo "==================================="
echo "✅ All validation checks passed!"
echo "==================================="
echo ""
echo "The extension is ready to be loaded in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist' directory"
echo ""
echo "To test the extension:"
echo "- Press Ctrl+Shift+A to toggle the UI"
echo "- Check the browser console for logs"
