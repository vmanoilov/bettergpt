# BetterGPT - ChatGPT Enhanced

## Overview

BetterGPT is a Chrome extension that supercharges ChatGPT with conversation management, search, export, and organization features. Inspired by Superpower ChatGPT, it observes and enhances your ChatGPT experience without replacing it.

## 🎯 What It Does

BetterGPT **augments** the ChatGPT web interface - it doesn't implement its own AI. Instead, it:

- **Observes** ChatGPT conversations in real-time
- **Captures** user prompts and assistant responses  
- **Stores** everything locally in your browser (IndexedDB)
- **Enhances** ChatGPT with powerful organization tools

## ✨ Features

### Conversation Capture
- ✅ Automatically detects and saves ChatGPT conversations
- ✅ Monitors DOM for new messages via MutationObserver
- ✅ Handles streaming responses correctly
- ✅ Works across page navigations

### Sidebar
- ✅ Browse all captured conversations
- ✅ Search through chat history
- ✅ Filter by folders/tags
- ✅ Export conversations (Markdown/JSON)
- ✅ Quick actions (pin, delete, export)
- ✅ Toggle with **Ctrl+B** (Cmd+B on Mac)

### Command Palette
- ✅ Quick access with **Ctrl+K** (Cmd+K on Mac)
- ✅ Keyboard navigation
- ✅ Search conversations
- ✅ Jump to specific messages
- ✅ Export and organize

### Local-Only Storage
- ✅ All data stored in IndexedDB
- ✅ No external servers
- ✅ Complete privacy
- ✅ Works offline

## 🚀 Installation

### Build from Source

```bash
# Clone repository
git clone https://github.com/vmanoilov/bettergpt.git
cd bettergpt

# Install dependencies
npm install

# Build extension
npm run build
```

### Load in Chrome

1. Build the extension (see above)
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist/` directory

## 💡 Usage

### First Time Setup

1. **Navigate to ChatGPT**: Go to https://chat.openai.com or https://chatgpt.com
2. **Look for the toggle button**: You'll see a floating button in the top-right
3. **Start chatting**: BetterGPT automatically captures your conversations

### Keyboard Shortcuts

- **Ctrl+B** (Cmd+B): Toggle sidebar
- **Ctrl+K** (Cmd+K): Open command palette
- **Escape**: Close any open panel

### Using the Sidebar

Click the floating button or press **Ctrl+B** to open the sidebar. From there you can:

- **Browse** all your conversations
- **Search** through message history
- **Export** conversations as Markdown or JSON
- **Delete** unwanted conversations
- **Pin** important chats

### Command Palette

Press **Ctrl+K** to open the command palette for quick actions:

- Search conversations
- Export current chat
- Jump to specific messages
- Organize with folders

## 🏗️ How It Works

### Architecture

```
ChatGPT Page
    ↓
Content Script (main.ts)
    ↓
ChatGPT Observer (monitors DOM)
    ↓
Captures Messages
    ↓
Sends to Background Worker
    ↓
Stores in IndexedDB
    ↓
Displays in Sidebar/Command Palette
```

### DOM Observation

BetterGPT uses a `MutationObserver` to watch for changes in the ChatGPT DOM. When new messages appear, it:

1. Detects the message element
2. Extracts role (user/assistant) and content
3. Generates unique message ID
4. Saves to IndexedDB
5. Updates conversation metadata

### Conversation Detection

Conversations are identified by:
- URL pattern: `/c/[conversation-id]`
- Automatic title extraction from page
- First message as fallback title

## 🛠️ Development

### Tech Stack

- **Framework**: Svelte 4 + TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS 3
- **Storage**: DexieJS (IndexedDB)
- **Platform**: Chrome Extension (Manifest V3)

### Project Structure

```
src/
├── components/
│   ├── App.svelte              # Main container
│   ├── Sidebar.svelte          # Conversation sidebar
│   └── CommandPalette.svelte   # Command palette (Ctrl+K)
├── content/
│   └── main.ts                 # Content script entry
├── background/
│   └── service-worker.ts       # Message/storage handler
├── lib/
│   ├── chatgpt/
│   │   └── observer.ts         # DOM observation logic
│   ├── db/
│   │   └── database.ts         # IndexedDB schema
│   └── utils/                  # Utility functions
└── styles/
    └── global.css              # Tailwind CSS
```

### Development Commands

```bash
npm run dev          # Watch mode with hot-reload
npm run build        # Production build
npm run lint         # Check code quality
npm run format       # Format code
```

### Testing Locally

1. Run `npm run dev` in one terminal
2. Load extension in Chrome from `dist/`
3. Make changes to source files
4. Refresh extension in `chrome://extensions/`

## 🔒 Privacy & Security

### What We DON'T Do

- ❌ Send data to external servers
- ❌ Track your usage
- ❌ Access your ChatGPT account
- ❌ Modify ChatGPT's behavior
- ❌ Inject ads or promotions

### What We DO

- ✅ Store everything locally in your browser
- ✅ Only observe ChatGPT's public DOM
- ✅ Use minimal Chrome permissions
- ✅ Open source for auditing

### Permissions

- **storage**: Store conversations in IndexedDB
- That's it! No network permissions needed.

## 🤔 Troubleshooting

### Extension Not Working?

1. **Check URL**: Only works on `chat.openai.com` and `chatgpt.com`
2. **Refresh page**: Hard refresh ChatGPT page (Ctrl+Shift+R)
3. **Reload extension**: Go to `chrome://extensions/` and click reload

### Messages Not Capturing?

1. **ChatGPT DOM changes**: ChatGPT may have updated their DOM structure
2. **Check console**: Look for BetterGPT logs
3. **Report issue**: Open a GitHub issue with details

### Sidebar Not Showing?

1. **Press Ctrl+B**: Toggle sidebar with keyboard shortcut
2. **Check toggle button**: Look for floating button in top-right
3. **Z-index issues**: Check if another extension is conflicting

## 📝 Roadmap

### Coming Soon

- [ ] Folder/tag system for organization
- [ ] Full-text search across all messages
- [ ] Custom keyboard shortcuts
- [ ] Dark mode improvements
- [ ] Token counting per conversation
- [ ] Message-level copy tools
- [ ] Bulk export options

### Future Ideas

- [ ] Sync across devices (optional)
- [ ] Advanced search filters
- [ ] Conversation analytics
- [ ] Custom themes
- [ ] API for extensions

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## �� Acknowledgments

- Inspired by Superpower ChatGPT
- Built with Svelte, Vite, and Tailwind CSS
- Thanks to the open source community

---

**Note**: This extension observes ChatGPT's DOM. If ChatGPT updates their structure, the extension may need updates. We'll maintain compatibility as ChatGPT evolves.
