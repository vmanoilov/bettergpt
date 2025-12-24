# BetterGPT - Personal AI Assistant Chrome Extension

## Overview

BetterGPT is a Chrome extension designed to provide an intelligent, context-aware AI assistant directly within your browser. Built with modern web technologies, it aims to enhance your browsing experience with seamless AI interactions.

## 🎉 Phase 1: Foundation & Architecture - COMPLETED

Phase 1 has been successfully completed! The project now has a solid foundation with:

- ✅ **Svelte + TypeScript + Vite** build system
- ✅ **Tailwind CSS** with custom design tokens
- ✅ **Manifest V3** Chrome extension structure
- ✅ **ESLint + Prettier** for code quality
- ✅ **Hot-reload** development workflow
- ✅ **DexieJS** database schema for conversations, prompts, and folders
- ✅ **Fuse.js** search functionality
- ✅ **Svelte components** for UI
- ✅ **State management** with Svelte stores
- ✅ **Utility functions** for dates, exports, and helpers

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for installation and usage instructions.

## Core Philosophies

1. **Privacy-First**: Your data and conversations remain secure. The extension prioritizes user privacy in all interactions.

2. **Seamless Integration**: Designed to work naturally within your browser workflow without disrupting your browsing experience.

3. **Extensible Architecture**: Built with modularity in mind, allowing for easy feature additions and customizations.

4. **Performance**: Lightweight and efficient, ensuring minimal impact on browser performance.

5. **User-Centric Design**: Focus on intuitive UI/UX that makes AI assistance accessible and helpful.

## Technology Stack

- **Framework**: Svelte 4 with TypeScript
- **Build System**: Vite 5
- **Styling**: Tailwind CSS 3 with custom design tokens
- **Database**: DexieJS (IndexedDB wrapper)
- **Search**: Fuse.js for fuzzy search
- **Utilities**: Day.js, JSZip, FileSaver.js
- **Code Quality**: ESLint, Prettier
- **Platform**: Chrome Extension (Manifest V3)

## Project Structure

```
bettergpt/
├── src/
│   ├── background/        # Background service worker
│   ├── content/          # Content scripts and UI components
│   ├── components/       # Svelte components
│   ├── lib/
│   │   ├── db/          # DexieJS database layer
│   │   ├── search/      # Fuse.js search functionality
│   │   └── utils/       # Utility functions
│   ├── stores/          # Svelte stores for state management
│   └── styles/          # Tailwind CSS styles
├── icons/               # Extension icons
├── dist/                # Build output (generated)
├── manifest.json        # Chrome extension manifest (v3)
├── QUICKSTART.md        # Quick start guide
└── DEVELOPMENT.md       # Detailed development guide
```

## Features (Roadmap)

### ✅ Phase 1: Foundation & Architecture (COMPLETED)
- Project setup with modern tooling
- Core architecture implementation
- Database schema design
- Base UI components

### 🔜 Phase 2: AI Integration (Coming Soon)
- AI API integration
- Message handling
- Conversation management
- Response streaming

### 🔜 Phase 3: Advanced Features (Planned)
- Prompt library
- Conversation history
- Search and filtering
- Export/import functionality
- Settings panel

## Development

For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development with hot-reload
npm run build        # Build for production
npm run lint         # Check code quality
npm run format       # Format code
```

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`
4. Load the extension in Chrome from the `dist/` directory

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## License

*To be determined*

## Contributing

*Contribution guidelines will be added as the project matures.*
