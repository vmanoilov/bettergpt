# Quick Start Guide

## Installation

```bash
npm install
```

## Development

### Build the Extension

```bash
npm run build
```

### Development Mode (with hot-reload)

```bash
npm run dev
```

This will watch for changes and automatically rebuild.

### Load in Chrome

1. Build the extension: `npm run build`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `dist/` directory from this project

### Using the Extension

- Press **Ctrl+Shift+A** (or **Cmd+Shift+A** on Mac) to toggle the UI
- The chat panel will slide in from the right side of any webpage
- Type a message and press "Send" (AI integration coming in Phase 2)

## Code Quality

### Linting

```bash
npm run lint          # Check for issues
npm run lint:fix      # Fix issues automatically
```

### Formatting

```bash
npm run format:check  # Check formatting
npm run format        # Fix formatting
```

### Type Checking

```bash
npm run type-check
```

## Validation

Validate the built extension is ready to load:

```bash
./validate-extension.sh
```

## Project Structure

```
src/
├── background/           # Background service worker
├── components/          # Svelte UI components
├── content/            # Content scripts
├── lib/
│   ├── db/            # Database (DexieJS)
│   ├── search/        # Search (Fuse.js)
│   └── utils/         # Utilities
├── stores/            # Svelte stores
└── styles/            # Tailwind CSS
```

## Troubleshooting

### Extension not loading?
- Make sure you've run `npm run build`
- Check that all files exist in `dist/` directory
- Run `./validate-extension.sh` to check

### Changes not reflecting?
- If using `npm run dev`, wait for rebuild to complete
- Go to `chrome://extensions/` and click refresh icon on BetterGPT
- If that doesn't work, remove and reload the extension

### Build errors?
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Try building again with `npm run build`

## Next Steps

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed documentation.
