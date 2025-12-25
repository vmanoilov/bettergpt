# BetterGPT - Personal AI Assistant Chrome Extension

## Overview

BetterGPT is a Chrome extension designed to provide an intelligent, context-aware AI assistant directly within your browser. Built with modern web technologies, it aims to enhance your browsing experience with seamless AI interactions.

## ✨ Phase 5 Features (Current - UI & UX Polish)

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

### Performance Optimizations
- **Virtual Scrolling**: Efficient rendering for large lists (only visible items rendered)
- **Database Caching**: Query results cached with automatic invalidation
- **Batch Operations**: Multiple database operations executed efficiently
- **Throttling & Debouncing**: Event handlers optimized for performance
- **Pagination Support**: Load data in chunks for better performance

### Developer Features
- **Memoization**: Cache expensive function results
- **Batch Scheduler**: Group multiple updates into single animation frame
- **Performance Utilities**: Throttle, debounce, and timing helpers

## ✨ Phase 2 Features (Completed)

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
- **Import/Export**: Save and restore conversations

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

## Current Status

### ✅ Phase 1 (Completed)
- Basic Chrome extension structure
- Service worker setup
- Content script infrastructure
- UI component framework

### ✅ Phase 2 (Completed)
- ChatGPT API integration
- Conversation management
- Folder organization
- IndexedDB storage
- Search functionality

### ✅ Phase 5 (Completed - UI & UX Polish)
- Command palette with keyboard shortcuts
- Theme manager (Light/Dark/System)
- Virtual scroll for large lists
- Performance optimizations (caching, throttling, batch operations)
- Enhanced keyboard shortcut system
- CSS variable-based theming

### 🚧 Phase 6 (Planned)
- Advanced UI features
- Settings page
- Cross-device sync
- Export/import improvements
- Additional integrations

## License

*To be determined*

## Contributing

*Contribution guidelines will be added as the project matures.*
