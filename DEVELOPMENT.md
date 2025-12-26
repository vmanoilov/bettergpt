# BetterGPT - Development Guide

## Phase 1: Foundation & Architecture (Completed)

This document outlines the completed setup and how to work with the project.

## Tech Stack

- **Framework**: Svelte 4 with TypeScript
- **Build System**: Vite 5
- **Styling**: Tailwind CSS 3 with custom design tokens
- **Database**: DexieJS (IndexedDB wrapper)
- **Search**: Fuse.js
- **Utilities**: Day.js, JSZip, FileSaver
- **Code Quality**: ESLint, Prettier
- **Platform**: Chrome Extension Manifest V3

## Project Structure

```
bettergpt/
├── src/
│   ├── background/           # Background service worker
│   │   └── service-worker.ts
│   ├── content/              # Content scripts
│   │   ├── main.ts          # Entry point
│   │   ├── types.ts         # Type definitions
│   │   └── ui/              # Legacy UI (to be removed)
│   ├── components/          # Svelte components
│   │   ├── App.svelte       # Main app component
│   │   └── ChatPanel.svelte # Chat interface
│   ├── lib/                 # Shared libraries
│   │   ├── db/             # Database layer (DexieJS)
│   │   ├── search/         # Search functionality (Fuse.js)
│   │   └── utils/          # Utility functions
│   ├── stores/             # Svelte stores
│   └── styles/             # Global styles (Tailwind)
├── icons/                   # Extension icons
├── dist/                    # Build output (gitignored)
├── public/                  # Static assets
├── manifest.json           # Chrome extension manifest
└── [config files]          # Various configuration files
```

## Development Workflow

### Installation

```bash
npm install
```

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

This will build the extension in watch mode. Any changes to source files will automatically rebuild.

### Building

Build the extension for production:

```bash
npm run build
```

The built extension will be in the `dist/` directory.

### Code Quality

Run linting:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

Run formatting:

```bash
npm run format:check  # Check formatting
npm run format        # Fix formatting
```

Type checking:

```bash
npm run type-check
```

### Loading the Extension in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist/` directory

### Hot Reload During Development

While `npm run dev` is running:
1. Make changes to source files
2. Wait for the build to complete
3. Go to `chrome://extensions/`
4. Click the refresh icon on the BetterGPT extension

## Architecture Overview

### Background Service Worker

- Handles extension lifecycle events
- Manages communication between content scripts
- Initializes and manages DexieJS database
- Handles background tasks

### Content Script

- Injects the Svelte UI into web pages
- Manages keyboard shortcuts
- Communicates with background script
- Handles page-level interactions

### Svelte Components

- **App.svelte**: Main container component
- **ChatPanel.svelte**: Chat interface component

### Database Schema

DexieJS stores the following:
- **Conversations**: Chat history
- **Messages**: Individual messages
- **Prompts**: Saved prompt templates
- **Folders**: Organization structure
- **Settings**: User preferences

### State Management

Uses Svelte stores for:
- Configuration
- UI visibility
- Loading states
- Current conversation
- Search queries

## Tailwind Configuration

Custom design tokens defined in `tailwind.config.js`:
- Primary colors (blue palette)
- Secondary colors (purple palette)
- Semantic colors (success, warning, error, info)
- Custom spacing values
- Shadow elevations
- Animations and transitions

## Next Steps (Phase 2+)

- AI Integration
- Advanced UI Components
- Prompt Management
- Conversation History
- Export/Import Functionality
- Settings Panel
- Search Implementation

## Contributing

Please ensure all code passes linting and formatting checks before committing:

```bash
npm run lint
npm run format
npm run type-check
```
