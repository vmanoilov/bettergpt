# BetterGPT - Personal AI Assistant Chrome Extension

## Overview

BetterGPT is a production-ready Chrome extension that provides an intelligent, context-aware AI assistant directly within your browser. Built with modern web technologies, it seamlessly integrates AI capabilities into your browsing experience.

## 🎉 Status: Production Ready! ✅

The extension is now fully functional with end-to-end AI integration, streaming responses, conversation management, and a complete settings UI.

## ✨ Features

### Core Functionality
- ✅ **Real AI Integration** - Connect to OpenAI, local Ollama, or any OpenAI-compatible API
- ✅ **Streaming Responses** - Real-time AI responses with animated streaming indicator
- ✅ **Context-Aware** - Automatically captures selected text, page URL, and metadata
- ✅ **Conversation History** - All conversations stored locally in IndexedDB
- ✅ **Export Conversations** - Export as JSON or Markdown
- ✅ **Multiple Providers** - Configure and switch between different AI providers
- ✅ **Privacy-First** - All data stored locally, no telemetry

### User Interface
- ✅ **Slide-in Panel** - Elegant UI that doesn't disrupt browsing
- ✅ **Settings Panel** - Easy provider configuration with test connection
- ✅ **History Panel** - Browse and search past conversations
- ✅ **Keyboard Shortcut** - Quick access with **Ctrl+Shift+A** (Cmd+Shift+A on Mac)

## Quick Start

### Installation

1. **Clone and build:**
   ```bash
   git clone https://github.com/vmanoilov/bettergpt.git
   cd bettergpt
   npm install
   npm run build
   ```

2. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` directory from the project

### Configuration

1. **Open Settings:**
   - Press **Ctrl+Shift+A** to open the extension
   - Click the "⚙️ Settings" button at the bottom

2. **Add AI Provider:**
   
   **For OpenAI:**
   - Click "Add Provider"
   - Name: "My OpenAI"
   - Type: OpenAI
   - API URL: `https://api.openai.com`
   - API Key: Your OpenAI API key from https://platform.openai.com/api-keys
   - Model: `gpt-3.5-turbo` or `gpt-4`
   - Click "Add Provider"
   - Click "Activate" to set as active

   **For Local Ollama:**
   - Install Ollama from https://ollama.ai
   - Run `ollama serve` in terminal
   - In BetterGPT: Click "Add Provider"
   - Name: "Local Ollama"
   - Type: Local
   - API URL: `http://localhost:11434`
   - API Key: (leave empty)
   - Model: `llama2` (or your installed model)
   - Click "Add Provider" and "Activate"

3. **Test Connection:**
   - Click "Test" button next to your provider
   - Verify "Connection successful!" message

### Usage

1. **Start Chatting:**
   - Navigate to any webpage
   - Select text you want to ask about (optional)
   - Press **Ctrl+Shift+A** (Cmd+Shift+A on Mac)
   - Type your message in the input field
   - Press Enter or click "Send"

2. **View History:**
   - Click "📜 History" button at the bottom
   - Click any conversation to continue it
   - Use export buttons (📄 Markdown, 💾 JSON) to save conversations

3. **New Conversation:**
   - Click "New Chat" button in the header
   - Or close and reopen the panel

## Technology Stack

- **Framework**: Svelte 4 with TypeScript
- **Build System**: Vite 5
- **Styling**: Tailwind CSS 3 with custom design tokens
- **Database**: DexieJS (IndexedDB wrapper)
- **Search**: Fuse.js for fuzzy search
- **AI**: Pluggable provider system (OpenAI-compatible)
- **Code Quality**: ESLint, Prettier
- **Platform**: Chrome Extension (Manifest V3)

## Project Structure

```
bettergpt/
├── src/
│   ├── background/              # Background service worker
│   │   └── service-worker.ts    # AI request handling, provider management
│   ├── content/                 # Content scripts
│   │   ├── main.ts             # Entry point, UI injection
│   │   ├── context.ts          # Page context capture
│   │   └── types.ts            # Type definitions
│   ├── components/             # Svelte components
│   │   ├── App.svelte          # Main container with navigation
│   │   ├── ChatPanel.svelte    # Chat interface
│   │   ├── Settings.svelte     # Provider configuration
│   │   └── History.svelte      # Conversation history
│   ├── lib/                    # Shared libraries
│   │   ├── ai/                # AI provider system
│   │   ├── db/                # Database layer (DexieJS)
│   │   ├── search/            # Search functionality (Fuse.js)
│   │   └── utils/             # Utility functions
│   ├── stores/                # Svelte stores
│   └── styles/                # Tailwind CSS
├── icons/                      # Extension icons
├── dist/                       # Build output (generated)
└── manifest.json              # Chrome extension manifest
```

## Development

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development with hot-reload
npm run build        # Build for production
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code
npm run type-check   # TypeScript type checking
```

### Development Workflow

1. **Start dev mode:**
   ```bash
   npm run dev
   ```

2. **Make changes to source files**

3. **Refresh extension:**
   - Go to `chrome://extensions/`
   - Click refresh icon on BetterGPT extension

### Adding Custom AI Providers

The extension supports any OpenAI-compatible API. Examples:

- **OpenRouter**: Use `https://openrouter.ai/api` as API URL
- **LocalAI**: Use `http://localhost:8080` as API URL
- **LM Studio**: Use `http://localhost:1234` as API URL
- **Custom**: Any endpoint that follows OpenAI's chat completions format

## Keyboard Shortcuts

- **Ctrl+Shift+A** (Cmd+Shift+A on Mac): Toggle extension panel
- **Enter**: Send message (Shift+Enter for new line)
- **Escape**: Close panel (when input is not focused)

## Privacy & Security

- ✅ **Local Storage**: All conversations stored locally in your browser
- ✅ **No Telemetry**: No data sent to BetterGPT servers (because there are none!)
- ✅ **API Keys Secured**: API keys stored in Chrome's secure storage
- ✅ **Minimal Permissions**: Only requests necessary Chrome permissions
- ✅ **Open Source**: Full source code available for audit

## Troubleshooting

### Extension Not Working?
- Verify the extension is loaded in `chrome://extensions/`
- Check that at least one AI provider is configured and active
- Try reloading the page

### No AI Response?
- Test your provider connection in Settings
- Check your API key is valid
- For local providers, ensure the server is running
- Check browser console for errors

### Streaming Not Working?
- Some providers may not support streaming
- Check provider configuration in Settings
- Try a non-streaming request first

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

ISC

## Acknowledgments

Built with love using Svelte, Vite, and Tailwind CSS.
