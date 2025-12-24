# BetterGPT - Personal AI Assistant Chrome Extension

## Overview

BetterGPT is a Chrome extension designed to provide an intelligent, context-aware AI assistant directly within your browser. Built with modern web technologies, it aims to enhance your browsing experience with seamless AI interactions.

## ✨ Current Features

### ChatGPT Integration (Phase 2)
- **API Interception**: Automatically captures ChatGPT conversations in real-time
- **DOM Monitoring**: Tracks conversation changes and updates
- **Sidebar UI**: Injected sidebar in ChatGPT for quick access to saved conversations
- **Streaming Support**: Handles both regular and streaming API responses
- **Metadata Extraction**: Captures model info, token usage, and conversation metadata

### Conversation Management (Phase 2)
- **Auto-Save**: Conversations are automatically saved to IndexedDB
- **Folder Organization**: Create folders to organize conversations
- **Archive/Favorite**: Mark conversations as archived or favorite
- **Bulk Operations**: Perform operations on multiple conversations at once
- **Thread Support**: Parent-child relationships for conversation threads
- **Search**: Full-text search across conversations
- **Import/Export**: Save and restore conversations

### Conversation Threading & Context (Phase 3) ✨ NEW
- **Conversation Linking**: Fork conversations at any message, continue from existing conversations, or create reference links
- **Graph Visualization**: Interactive D3.js-powered visualization of conversation relationships with zoom, pan, and drag
- **Smart Context Management**: Auto-load context from linked conversations with configurable settings
- **Token Counting**: Visual token usage indicators with model-specific limits
- **Context Truncation**: Three intelligent strategies (Recent, Relevant, Balanced) to fit context within token limits
- **Multiple Views**: Switch between List, Graph, and Context views for different workflows

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
- `Ctrl+Shift+A` - Toggle main BetterGPT UI
- `Ctrl+Shift+S` - Toggle ChatGPT sidebar (when on ChatGPT)

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

### ✅ Phase 3 (Completed) ✨ NEW
- Conversation linking (fork, continuation, reference)
- Interactive graph visualization with D3.js
- Smart context management and auto-loading
- Token counting and usage visualization
- Multiple truncation strategies
- Three-view UI (List, Graph, Context)

### 🚧 Phase 4 (Planned)
- Settings page and customization
- Cross-device sync (optional)
- Export improvements (Markdown, PDF, HTML)
- Additional AI platform integrations
- Themes and UI customization

## License

*To be determined*

## Contributing

*Contribution guidelines will be added as the project matures.*
