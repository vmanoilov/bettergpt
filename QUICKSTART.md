# BetterGPT Quick Start Guide

## What is BetterGPT?

BetterGPT is a Chrome extension that enhances your ChatGPT experience by automatically saving your conversations, organizing them into folders, and providing quick search and navigation features.

## Features at a Glance

✅ **Automatic Saving**: Your ChatGPT conversations are automatically saved locally  
✅ **Folder Organization**: Create folders to organize your conversations  
✅ **Quick Search**: Find any conversation instantly with full-text search  
✅ **Archive & Favorites**: Keep your workspace clean and mark important conversations  
✅ **Privacy First**: All data is stored locally on your computer - nothing is sent to external servers  

## Installation

### Step 1: Build the Extension
```bash
# Clone the repository
git clone https://github.com/vmanoilov/bettergpt.git
cd bettergpt

# Install dependencies
npm install

# Build the extension
npm run build
```

### Step 2: Load in Chrome
1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked"
4. Select the `dist/` folder from the BetterGPT project
5. The extension is now installed! You should see the BetterGPT icon

### Step 3: Test It Out
1. Open the included `test-page.html` file in Chrome
2. Click "Check Extension Status" to verify it's working
3. Visit https://chat.openai.com to test the ChatGPT integration

## How to Use

### Using the Main UI

**Toggle the UI Panel**
- Press `Ctrl+Shift+A` on any webpage
- A panel will slide in from the right side of your screen
- This is your BetterGPT control center

### Using on ChatGPT

**1. Start a Conversation**
- Go to https://chat.openai.com
- Start chatting with ChatGPT as you normally would
- Your conversation is automatically being saved!

**2. View Saved Conversations**
- Press `Ctrl+Shift+S` to open the BetterGPT sidebar
- You'll see all your saved conversations
- Click any conversation to view details

**3. Organize with Folders**
- In the sidebar, click "+ New Folder"
- Enter a folder name (e.g., "Work", "Personal", "Research")
- Drag conversations into folders (or use the context menu)

**4. Mark as Favorite**
- Right-click on any conversation
- Select "Mark as Favorite"
- Favorites appear in their own section for quick access

**5. Archive Old Conversations**
- Right-click on any conversation
- Select "Archive"
- Archived conversations are hidden from the main view but can still be searched

**6. Search Conversations**
- Use the search box at the top of the sidebar
- Search by title or message content
- Results appear instantly as you type

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Toggle main BetterGPT UI |
| `Ctrl+Shift+S` | Toggle ChatGPT sidebar |

## Privacy & Data

### Where is my data stored?
All your conversations are stored locally in your browser's IndexedDB. Nothing is sent to external servers.

### Can I export my data?
Yes! You can export individual conversations or your entire database. See the DEVELOPMENT.md file for details.

### What data is collected?
Only the conversation data you generate with ChatGPT. We don't collect any analytics or usage data.

## Troubleshooting

### Extension Not Loading
- Make sure you built the extension (`npm run build`)
- Check that you selected the `dist/` folder when loading
- Try reloading the extension from `chrome://extensions/`

### ChatGPT Integration Not Working
- Verify you're on the correct ChatGPT domain (chat.openai.com)
- Open browser DevTools (F12) and check the Console tab for errors
- Try refreshing the ChatGPT page

### Sidebar Not Appearing
- Press `Ctrl+Shift+S` to toggle
- Check that you're on a ChatGPT page
- Look for errors in the browser console

### Database Not Saving
- Open DevTools > Application tab > IndexedDB
- Look for "BetterGPTDB" - if it doesn't exist, something went wrong
- Try clearing browser data and reloading the extension

## Getting Help

1. **Check the Documentation**: See DEVELOPMENT.md for technical details
2. **Test Page**: Open test-page.html to verify basic functionality
3. **Browser Console**: Press F12 and check for error messages
4. **GitHub Issues**: Report bugs or request features on GitHub

## Tips & Tricks

### Organizing Conversations
- Create folders by topic (e.g., "Code Help", "Writing", "Research")
- Use favorites for conversations you refer to frequently
- Archive old conversations to keep your workspace clean

### Efficient Search
- Search works across both titles and message content
- Results are limited to 100 for performance
- More specific queries return better results

### Keyboard Navigation
- Learn the keyboard shortcuts to work faster
- `Ctrl+Shift+A` for main UI
- `Ctrl+Shift+S` for ChatGPT sidebar

### Backup Your Data
- Regularly export important conversations
- Keep backups before clearing browser data
- Export is in JSON format for portability

## What's Next?

This is Phase 2 of the BetterGPT project. Planned features for future releases include:

- Visual drag-and-drop organization
- Advanced filtering and sorting
- Export to multiple formats (Markdown, PDF)
- Settings page for customization
- Optional cloud sync
- Theme customization
- And much more!

## Contributing

Interested in contributing? See the main README.md for contribution guidelines.

## License

ISC License - See LICENSE file for details.

---

**Enjoy using BetterGPT!** 🚀

For questions or issues, please visit the GitHub repository.
