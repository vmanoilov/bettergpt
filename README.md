# BetterGPT - Personal AI Assistant Chrome Extension

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/vmanoilov/bettergpt)

## Overview

BetterGPT is a Chrome extension designed to provide an intelligent, context-aware AI assistant directly within your browser. Built with modern web technologies, it aims to enhance your browsing experience with seamless AI interactions.

## ✨ Features

### Command Palette
- **Universal Command Interface**: Press `Cmd/Ctrl+K` to access all extension features
- **Fuzzy Search**: Quickly find commands by typing any part of their name
- **Categorized Actions**: Commands organized by category (Conversation, Navigation, Search, Settings, Data)
- **Recent Items**: Previously used commands appear at the top for quick access
- **Keyboard Navigation**: Full keyboard support with arrow keys and Enter

### Enhanced Keyboard Shortcuts
- **Centralized Management**: All shortcuts managed through a unified system
- **Platform-Aware**: Automatically uses Cmd on Mac, Ctrl on Windows/Linux
- **Priority System**: Prevents conflicts with proper priority handling
- **Context-Aware**: Shortcuts disabled when typing in input fields (except Cmd/Ctrl+K)

**Default Shortcuts:**
- `Cmd/Ctrl+K` - Open Command Palette
- `Ctrl+Shift+A` - Toggle Main UI
- `Ctrl+Shift+S` - Toggle ChatGPT Sidebar

### Theme Support
- **Light & Dark Modes**: Fully implemented theme system
- **System Preference Detection**: Automatically follows OS theme preference
- **Persistent Settings**: Theme choice saved and restored across sessions
- **CSS Variables**: All colors use CSS custom properties for easy theming
- **Theme Toggle**: Quick theme switching via UI button or command palette

### ChatGPT Integration
- **API Interception**: Automatically captures ChatGPT conversations in real-time
- **DOM Monitoring**: Tracks conversation changes and updates
- **Sidebar UI**: Injected sidebar in ChatGPT for quick access to saved conversations
- **Streaming Support**: Handles both regular and streaming API responses
- **Metadata Extraction**: Captures model info, token usage, and conversation metadata

### Conversation Management
- **Auto-Save**: Conversations are automatically saved to IndexedDB
- **Folder Organization**: Create folders to organize conversations
- **Archive/Favorite**: Mark conversations as archived or favorite
- **Bulk Operations**: Perform operations on multiple conversations at once
- **Thread Support**: Parent-child relationships for conversation threads
- **Search**: Full-text search across conversations

### Conversation Threading & Context
- **Conversation Linking**: Fork conversations at any message, continue from existing conversations, or create reference links
- **Graph Visualization**: Interactive D3.js-powered visualization of conversation relationships with zoom, pan, and drag
- **Smart Context Management**: Auto-load context from linked conversations with configurable settings
- **Token Counting**: Visual token usage indicators with model-specific limits
- **Context Truncation**: Three intelligent strategies (Recent, Relevant, Balanced) to fit context within token limits
- **Multiple Views**: Switch between List, Graph, and Context views for different workflows

### Export & Import System
- **Multiple Formats**: Markdown (.md), Plain Text (.txt), JSON (.json), HTML (.html), PDF (.pdf), DOCX (.docx)
- **Markdown Templates**: Standard, Obsidian-compatible, GitHub-flavored
- **PDF Templates**: Minimal, Academic, Dark modes
- **Import Support**: JSON, Markdown with metadata, ChatGPT exports, Plain text
- **Bulk Operations**: Export/import multiple conversations at once
- **Thread Preservation**: Maintain parent-child conversation relationships
- **Custom Templates**: Handlebars-style syntax for custom formatting
- **Data Integrity**: All metadata and conversation structure preserved

**Note:** Export functionality is temporarily disabled due to a build error. See [Known Issues](#known-issues) below.

### Performance Optimizations
- **Virtual Scrolling**: Efficient rendering for large lists (only visible items rendered)
- **Database Caching**: Query results cached with automatic invalidation
- **Batch Operations**: Multiple database operations executed efficiently
- **Throttling & Debouncing**: Event handlers optimized for performance
- **Pagination Support**: Load data in chunks for better performance

## Core Philosophies

1. **Privacy-First**: Your data and conversations remain secure. All data is stored locally in IndexedDB.

2. **Seamless Integration**: Designed to work naturally within your browser workflow without disrupting your browsing experience.

3. **Extensible Architecture**: Built with modularity in mind, allowing for easy feature additions and customizations.

4. **Performance**: Lightweight and efficient, ensuring minimal impact on browser performance.

5. **User-Centric Design**: Focus on intuitive UI/UX that makes AI assistance accessible and helpful.

## Technology Stack

- **Framework**: TypeScript with modern ES2020+ features
- **Platform**: Chrome Extension (Manifest V3)
- **Database**: DexieJS (IndexedDB wrapper)
- **Build System**: esbuild for fast compilation and bundling
- **Architecture**: Modular design with separation of concerns

## Project Structure

```
bettergpt/
├── src/
│   ├── background/        # Background service worker
│   ├── content/          # Content scripts and UI components
│   │   ├── main.ts       # Entry point
│   │   ├── types.ts      # Type definitions
│   │   └── ui/           # UI components
│   ├── data/            # Database layer (DexieJS)
│   ├── integrations/    # ChatGPT integration modules
│   │   └── chatgpt/
│   │       ├── interceptor.ts   # API interception
│   │       ├── dom-observer.ts  # DOM monitoring
│   │       └── sidebar.ts       # Sidebar injection
│   └── managers/        # Business logic managers
│       ├── conversation-manager.ts
│       └── folder-manager.ts
├── manifest.json        # Chrome extension manifest (v3)
├── build.js            # Build script
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Google Chrome browser

### Installation & Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vmanoilov/bettergpt.git
   cd bettergpt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `dist/` folder

5. **Test it out**
   - Open `test-page.html` for basic testing
   - Visit https://chat.openai.com to test ChatGPT integration
   - Press `Ctrl+Shift+A` to toggle the main UI
   - Press `Ctrl+Shift+S` to toggle the ChatGPT sidebar

### Development Workflow

```bash
# Build the extension
npm run build

# After making changes, rebuild and reload the extension in Chrome
```

For detailed development information, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Usage

### Keyboard Shortcuts
- `Cmd/Ctrl+K` - Open Command Palette
- `Ctrl+Shift+A` - Toggle main BetterGPT UI
- `Ctrl+Shift+S` - Toggle ChatGPT sidebar (when on ChatGPT)

### Command Palette
The command palette provides quick access to all extension features:
1. Press `Cmd/Ctrl+K` to open
2. Type to search for commands
3. Use arrow keys to navigate
4. Press Enter to execute

Available commands include:
- New Conversation
- Search Conversations
- Archive/Favorite conversations
- Toggle Theme
- Export/Import data
- And more...

### Theme Support
BetterGPT supports three theme modes:
- **Light**: Always use light theme
- **Dark**: Always use dark theme  
- **System**: Automatically follow OS preference (default)

Change theme via:
- Command Palette (`Cmd/Ctrl+K` → "Toggle Theme")
- Theme toggle button in UI header (sun/moon icon)

### Features
1. **Automatic Conversation Capture**: Simply use ChatGPT normally, and BetterGPT will automatically save your conversations
2. **Organize with Folders**: Create folders and organize your conversations
3. **Search**: Quickly find conversations using full-text search
4. **Archive & Favorite**: Keep your workspace clean by archiving old conversations or marking important ones as favorites
5. **Bulk Operations**: Select multiple conversations for batch operations

## Project Status

### ✅ Completed Phases

- **Phase 1**: Basic Chrome extension structure, service worker, content scripts, UI framework
- **Phase 2**: ChatGPT API integration, conversation management, folder organization, IndexedDB storage
- **Phase 3**: Conversation linking, graph visualization, context management, token counting
- **Phase 4**: Export/import system, multiple formats, custom templates
- **Phase 5**: UI/UX polish, command palette, keyboard shortcuts, theme support, performance optimizations
- **Phase 6**: Browser compatibility documentation, packaging scripts, store submission guides

### 🚧 Future Enhancements

- Settings page and customization
- Cross-device sync (optional)
- Additional AI platform integrations
- Automated testing infrastructure

## Known Issues

### Critical: Export Functionality Temporarily Disabled

The export-manager.ts file has a persistent build error with esbuild/TypeScript template literal parsing. A temporary stub implementation is in place to allow the extension to build. Full export functionality will be restored once this issue is resolved.

- **Status**: Under investigation
- **Impact**: Export features are non-functional
- **Workaround**: Stub implementation allows other features to work normally
- **Details**: See [PHASE6_FINAL_REPORT.md](PHASE6_FINAL_REPORT.md) for complete analysis

## License

ISC License - see [LICENSE](LICENSE) file for details

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.
