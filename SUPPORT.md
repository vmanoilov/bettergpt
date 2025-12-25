# BetterGPT Support & Documentation

Welcome to BetterGPT support! This document will help you get started and troubleshoot common issues.

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Common Issues](#common-issues)
- [FAQ](#faq)
- [Contact](#contact)

## Getting Started

### Installation

1. **From Chrome Web Store**:
   - Visit the [BetterGPT page](https://chrome.google.com/webstore) (link TBD)
   - Click "Add to Chrome"
   - Confirm the installation

2. **From Firefox Add-ons**:
   - Visit the [BetterGPT page](https://addons.mozilla.org) (link TBD)
   - Click "Add to Firefox"
   - Confirm the installation

3. **Developer Installation** (for testing):
   - Clone the repository: `git clone https://github.com/vmanoilov/bettergpt.git`
   - Run `npm install`
   - Run `npm run build`
   - Load the `dist/` folder as an unpacked extension

### First Steps

1. **Access the Extension**:
   - Click the BetterGPT icon in your browser toolbar
   - Or use the keyboard shortcut: `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)

2. **Start Using**:
   - The extension will automatically capture conversations when you use ChatGPT
   - Create folders to organize your conversations
   - Use the search function to find past conversations

3. **Customize**:
   - Press `Cmd/Ctrl+K` to open the command palette
   - Click the theme toggle to switch between light/dark modes
   - Configure export settings in the settings panel

## Features

### Conversation Management

- **Auto-Save**: Conversations are automatically captured and saved
- **Manual Save**: Save specific conversations using the save button
- **Edit**: Modify conversation titles and metadata
- **Delete**: Remove conversations you no longer need
- **Archive**: Archive old conversations to keep your workspace clean

### Organization

- **Folders**: Create folders to organize conversations by topic
- **Tags**: Add tags to conversations for easy filtering
- **Favorites**: Mark important conversations as favorites
- **Search**: Full-text search across all conversations

### Export Options

Export conversations in multiple formats:
- **JSON**: Complete data export (includes all metadata)
- **Markdown**: Human-readable format (multiple templates available)
- **Plain Text**: Simple text format
- **HTML**: Formatted HTML document
- **PDF**: Portable document format
- **DOCX**: Microsoft Word document

### Command Palette

Press `Cmd/Ctrl+K` to access all features quickly:
- Create new conversation
- Search conversations
- Change theme
- Export conversations
- Toggle sidebar
- And more...

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+K` | Open command palette |
| `Ctrl+Shift+A` | Toggle main UI |
| `Ctrl+Shift+S` | Toggle ChatGPT sidebar |
| `Escape` | Close dialogs/modals |
| `Arrow Keys` | Navigate lists |
| `Enter` | Select/confirm |

### Themes

Three theme options:
- **Light**: Bright, clean interface
- **Dark**: Easy on the eyes for low-light environments
- **System**: Automatically follows your OS theme preference

## Common Issues

### Extension Not Appearing

**Symptoms**: Extension icon not visible in toolbar

**Solutions**:
1. Check if the extension is enabled:
   - Chrome: Go to `chrome://extensions/`
   - Firefox: Go to `about:addons`
2. Pin the extension to your toolbar:
   - Click the puzzle icon in the toolbar
   - Find BetterGPT and click the pin icon
3. Refresh the page after installation
4. Restart your browser

### Data Not Saving

**Symptoms**: Conversations disappear or don't save

**Solutions**:
1. Check storage permissions:
   - Ensure the extension has storage permission
   - Check browser storage quota
2. Clear browser cache (may affect other data):
   - Chrome: `chrome://settings/clearBrowserData`
   - Firefox: `about:preferences#privacy`
3. Check if incognito/private mode:
   - Some browsers limit storage in private mode
4. Verify IndexedDB is enabled:
   - Check browser settings for IndexedDB support

### Export Not Working

**Symptoms**: Export button doesn't work or downloads fail

**Solutions**:
1. Check download permissions:
   - Ensure the extension has download permission
   - Check browser download settings
2. Disable popup blockers:
   - Some blockers interfere with downloads
3. Try different export format:
   - If one format fails, try another (e.g., JSON instead of PDF)
4. Check available disk space:
   - Ensure you have space for the export file
5. Try different download location:
   - Change download folder in browser settings

### Performance Issues

**Symptoms**: Extension is slow or browser lags

**Solutions**:
1. Reduce dataset size:
   - Archive or delete old conversations
   - Export and remove conversations you don't need often
2. Close unused tabs:
   - Each tab uses memory
3. Restart browser:
   - Fresh start can resolve memory leaks
4. Check for updates:
   - Ensure you have the latest version
5. Disable other extensions temporarily:
   - Test if conflict with another extension

### ChatGPT Integration Not Working

**Symptoms**: Conversations not captured automatically

**Solutions**:
1. Refresh the ChatGPT page:
   - Content scripts may need to reinitialize
2. Check if on correct URL:
   - Integration works on chat.openai.com
3. Verify permissions:
   - Extension needs scripting permission
4. Check console for errors:
   - Open browser DevTools (F12) and check console
5. Reinstall extension:
   - Sometimes a fresh install helps

### Keyboard Shortcuts Not Working

**Symptoms**: Shortcuts don't trigger actions

**Solutions**:
1. Check for conflicts:
   - Another extension might use the same shortcut
   - Browser built-in shortcuts take precedence
2. Test in different context:
   - Shortcuts may not work in input fields (except Cmd/Ctrl+K)
3. Restart browser:
   - Shortcuts register on startup
4. Check extension settings:
   - Verify shortcuts are enabled

## FAQ

### General

**Q: Is BetterGPT free?**  
A: Yes, BetterGPT is completely free and open source.

**Q: Is my data safe?**  
A: Yes! All data is stored locally in your browser. We don't have access to your conversations.

**Q: Can I use BetterGPT offline?**  
A: Yes, once installed, you can view and manage your saved conversations offline. However, you need internet to capture new conversations from ChatGPT.

**Q: Does BetterGPT work with other AI services?**  
A: Currently, BetterGPT is optimized for ChatGPT. Support for other AI services may be added in future versions.

### Data & Privacy

**Q: Can I sync my data across devices?**  
A: Not currently. All data is stored locally. You can export your data from one device and import it on another.

**Q: How do I backup my data?**  
A: Use the Export feature to download your conversations in JSON format. This includes all your data.

**Q: What happens if I uninstall the extension?**  
A: Your locally stored data will be removed. Make sure to export your data before uninstalling.

**Q: Can I import conversations?**  
A: Yes, the extension supports importing from JSON exports and some other formats.

### Features

**Q: How many conversations can I store?**  
A: Limited only by your browser's storage quota (typically several GB). The extension handles thousands of conversations efficiently.

**Q: Can I edit conversations after they're saved?**  
A: Yes, you can edit titles, add tags, change metadata, and organize conversations into folders.

**Q: Can I share conversations with others?**  
A: Export conversations and share the exported files. The recipient can import them if they have BetterGPT.

**Q: Does the extension slow down my browser?**  
A: BetterGPT is optimized for performance with features like virtual scrolling and database caching. It should have minimal impact.

### Troubleshooting

**Q: The extension isn't capturing my ChatGPT conversations. What should I do?**  
A: Try refreshing the ChatGPT page. If that doesn't work, check the [ChatGPT Integration Not Working](#chatgpt-integration-not-working) section above.

**Q: I lost my conversations. Can I recover them?**  
A: If you exported a backup, you can import it. Otherwise, conversations are only stored locally and can't be recovered if deleted or if browser data is cleared.

**Q: Can I customize the export templates?**  
A: Yes, BetterGPT supports custom export templates using a Handlebars-style syntax.

### Updates & Support

**Q: How do I update the extension?**  
A: Extensions update automatically through your browser's extension store. You can also check for updates manually in your browser's extension settings.

**Q: Where can I report bugs?**  
A: Please report bugs on our [GitHub Issues page](https://github.com/vmanoilov/bettergpt/issues).

**Q: Can I request features?**  
A: Yes! Feature requests are welcome on our GitHub Issues page. Label them as "enhancement".

**Q: Is there a mobile version?**  
A: Not currently. BetterGPT is a browser extension for desktop browsers.

## Contact & Support

### Report Issues

- **GitHub Issues**: [https://github.com/vmanoilov/bettergpt/issues](https://github.com/vmanoilov/bettergpt/issues)
- **Bug Reports**: Use the "bug" label
- **Feature Requests**: Use the "enhancement" label

### Community

- **Discussions**: [GitHub Discussions](https://github.com/vmanoilov/bettergpt/discussions)
- **Contribute**: [Contributing Guide](DEVELOPMENT.md)

### Email Support

For privacy concerns or sensitive issues:
- Email: [To be provided]

### Documentation

- **User Guide**: [README.md](README.md)
- **Developer Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Privacy Policy**: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
- **Phase Documentation**: Multiple phase summary documents available

## Additional Resources

### Video Tutorials

[To be added after release]

### Screenshots & Demos

[To be added after release]

### Changelog

See [version history and changes](https://github.com/vmanoilov/bettergpt/releases)

## Need More Help?

If this documentation doesn't answer your question:

1. Search existing GitHub issues
2. Check closed issues (your question might already be answered)
3. Create a new issue with detailed information:
   - Browser and version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

**Thank you for using BetterGPT! We're here to help.**
