/**
 * Build script for BetterGPT Chrome Extension
 * 
 * This script:
 * - Compiles TypeScript to JavaScript using esbuild
 * - Bundles dependencies
 * - Copies static assets
 * - Outputs to dist/ directory
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Clean dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Create subdirectories
fs.mkdirSync(path.join(distDir, 'background'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'content'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'content/ui'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'icons'), { recursive: true });

// Build configuration
const buildOptions = {
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  target: 'es2020',
  platform: 'browser',
};

// Build background service worker
esbuild.build({
  ...buildOptions,
  entryPoints: ['src/background/service-worker.ts'],
  outfile: 'dist/background/service-worker.js',
}).then(() => {
  console.log('✓ Background service worker built');
}).catch((error) => {
  console.error('✗ Background service worker build failed:', error);
  process.exit(1);
});

// Build content script
esbuild.build({
  ...buildOptions,
  entryPoints: ['src/content/main.ts'],
  outfile: 'dist/content/main.js',
}).then(() => {
  console.log('✓ Content script built');
}).catch((error) => {
  console.error('✗ Content script build failed:', error);
  process.exit(1);
});

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);
console.log('✓ Manifest copied');

// Copy icons
const iconsDir = path.join(__dirname, 'icons');
if (fs.existsSync(iconsDir)) {
  const iconFiles = fs.readdirSync(iconsDir);
  iconFiles.forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distDir, 'icons', file)
    );
  });
  console.log('✓ Icons copied');
} else {
  console.warn('⚠ Icons directory not found');
}

console.log('\n✓ Build complete!');
