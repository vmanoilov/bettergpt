# Browser Compatibility Testing Guide

This guide provides a comprehensive testing checklist for ensuring BetterGPT works correctly across different browsers.

## Testing Matrix

| Feature | Chrome | Edge | Firefox | Priority |
|---------|--------|------|---------|----------|
| Installation | ⬜ | ⬜ | ⬜ | High |
| Extension Icon | ⬜ | ⬜ | ⬜ | High |
| Popup/UI | ⬜ | ⬜ | ⬜ | High |
| Storage Operations | ⬜ | ⬜ | ⬜ | High |
| Content Script Injection | ⬜ | ⬜ | ⬜ | High |
| Background Service Worker | ⬜ | ⬜ | ⬜ | High |
| ChatGPT Integration | ⬜ | ⬜ | ⬜ | High |
| Conversation Capture | ⬜ | ⬜ | ⬜ | High |
| Search Functionality | ⬜ | ⬜ | ⬜ | High |
| Folder Management | ⬜ | ⬜ | ⬜ | Medium |
| Export (JSON) | ⬜ | ⬜ | ⬜ | High |
| Export (Markdown) | ⬜ | ⬜ | ⬜ | Medium |
| Export (HTML) | ⬜ | ⬜ | ⬜ | Medium |
| Export (Text) | ⬜ | ⬜ | ⬜ | Medium |
| Theme Switching | ⬜ | ⬜ | ⬜ | Low |
| Keyboard Shortcuts | ⬜ | ⬜ | ⬜ | Medium |
| Command Palette | ⬜ | ⬜ | ⬜ | Medium |
| Virtual Scrolling | ⬜ | ⬜ | ⬜ | Medium |
| Performance (Large Dataset) | ⬜ | ⬜ | ⬜ | High |
| Memory Usage | ⬜ | ⬜ | ⬜ | High |

## Detailed Test Cases

### 1. Installation & Setup

#### Test Case 1.1: Fresh Installation

**Steps**:
1. Install extension from store/unpacked
2. Verify extension icon appears in toolbar
3. Click extension icon
4. Verify UI opens correctly

**Expected Result**:
- Extension installs without errors
- Icon visible in toolbar
- UI loads and is functional
- No console errors

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 1.2: Post-Installation Setup

**Steps**:
1. Open extension UI
2. Verify welcome screen or empty state
3. Check that settings are accessible
4. Verify theme selection works

**Expected Result**:
- Clean initial state
- Settings panel accessible
- Theme changes apply correctly
- No errors in console

**Test in**: Chrome, Edge, Firefox

---

### 2. Storage Operations

#### Test Case 2.1: Save Data

**Steps**:
1. Create a test conversation
2. Save it
3. Close extension
4. Reopen extension
5. Verify conversation persists

**Expected Result**:
- Data saves successfully
- Data persists across sessions
- No data loss
- IndexedDB operations complete without error

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 2.2: Update Data

**Steps**:
1. Load existing conversation
2. Edit title or add tags
3. Save changes
4. Reload extension
5. Verify changes persisted

**Expected Result**:
- Updates save correctly
- No data corruption
- Changes visible immediately
- Consistent across browser restarts

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 2.3: Delete Data

**Steps**:
1. Select a conversation
2. Delete it
3. Verify deletion confirmation
4. Confirm deletion
5. Verify conversation removed

**Expected Result**:
- Deletion prompt appears
- Item removed from list
- Data removed from storage
- No orphaned data

**Test in**: Chrome, Edge, Firefox

---

### 3. ChatGPT Integration

#### Test Case 3.1: Conversation Capture

**Prerequisites**: Be logged into ChatGPT

**Steps**:
1. Navigate to chat.openai.com
2. Start a new conversation
3. Send a message
4. Receive response
5. Check BetterGPT for captured conversation

**Expected Result**:
- Conversation automatically captured
- Both user and assistant messages saved
- Metadata captured correctly
- Real-time updates reflect in extension

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 3.2: Sidebar Injection

**Prerequisites**: Be on ChatGPT page

**Steps**:
1. Use shortcut `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
2. Verify sidebar appears
3. Check sidebar functionality
4. Close sidebar
5. Reopen sidebar

**Expected Result**:
- Sidebar injects correctly
- No layout issues
- Sidebar interactive and functional
- Can toggle on/off smoothly

**Test in**: Chrome, Edge, Firefox

---

### 4. Search & Filter

#### Test Case 4.1: Text Search

**Prerequisites**: Have multiple conversations saved

**Steps**:
1. Open search
2. Type search query
3. Verify results filter correctly
4. Clear search
5. Verify all conversations visible again

**Expected Result**:
- Search is fast and responsive
- Results match query
- Highlighting works (if applicable)
- Clear search restores full list

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 4.2: Filter by Tags

**Prerequisites**: Have tagged conversations

**Steps**:
1. Select a tag filter
2. Verify only tagged items show
3. Select multiple tags
4. Verify OR/AND logic works
5. Clear filters

**Expected Result**:
- Filtering works correctly
- Multiple filters combine properly
- Clear filter restores view
- No performance issues

**Test in**: Chrome, Edge, Firefox

---

### 5. Export Functionality

#### Test Case 5.1: Export as JSON

**Steps**:
1. Select conversations to export
2. Choose JSON format
3. Click export
4. Verify download starts
5. Open downloaded file
6. Verify data integrity

**Expected Result**:
- Export completes without error
- File downloads successfully
- JSON is valid and complete
- All data preserved

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 5.2: Export as Markdown

**Steps**:
1. Select conversation(s)
2. Choose Markdown format
3. Select template (standard/obsidian/github)
4. Click export
5. Verify download
6. Open file and check formatting

**Expected Result**:
- Markdown formatted correctly
- Template applied properly
- File readable
- Metadata included if selected

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 5.3: Bulk Export

**Prerequisites**: Have multiple conversations

**Steps**:
1. Select multiple conversations
2. Choose export format
3. Click export all
4. Verify single file or multiple files
5. Check all conversations included

**Expected Result**:
- All selected items exported
- No missing conversations
- File size appropriate
- No errors during export

**Test in**: Chrome, Edge, Firefox

---

### 6. Keyboard Shortcuts

#### Test Case 6.1: Command Palette

**Steps**:
1. Press `Cmd/Ctrl+K`
2. Verify command palette opens
3. Type to search commands
4. Use arrow keys to navigate
5. Press Enter to execute

**Expected Result**:
- Palette opens instantly
- Search works
- Navigation smooth
- Commands execute correctly

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 6.2: Toggle UI

**Steps**:
1. Press `Ctrl+Shift+A` (or `Cmd+Shift+A`)
2. Verify main UI toggles
3. Press again to toggle back
4. Test multiple times

**Expected Result**:
- UI shows/hides correctly
- Smooth transition
- State preserved
- No conflicts with page shortcuts

**Test in**: Chrome, Edge, Firefox

---

### 7. Theme System

#### Test Case 7.1: Manual Theme Switch

**Steps**:
1. Open extension
2. Click theme toggle
3. Verify theme changes
4. Cycle through all themes
5. Check persistence after restart

**Expected Result**:
- Theme changes instantly
- All UI elements update
- Choice persists
- Smooth transitions

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 7.2: System Theme

**Steps**:
1. Set theme to "System"
2. Change OS theme (light/dark)
3. Verify extension follows OS
4. Test back and forth

**Expected Result**:
- Extension matches OS theme
- Updates when OS changes
- No lag or flash of wrong theme
- MediaQuery listener works

**Test in**: Chrome, Edge, Firefox

---

### 8. Performance

#### Test Case 8.1: Large Dataset

**Prerequisites**: Create or import 1000+ conversations

**Steps**:
1. Open extension with large dataset
2. Measure load time
3. Scroll through list
4. Test search
5. Test filtering

**Expected Result**:
- Loads in < 2 seconds
- Smooth scrolling (60fps)
- Search completes in < 500ms
- Virtual scrolling works
- No lag or freezing

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 8.2: Memory Usage

**Steps**:
1. Open browser task manager
2. Note initial memory usage
3. Use extension extensively
4. Check memory after 30 minutes
5. Check for memory leaks

**Expected Result**:
- Reasonable memory usage (< 100MB typical)
- No significant memory growth
- No leaks over time
- Stable performance

**Test in**: Chrome, Edge, Firefox

---

### 9. Error Handling

#### Test Case 9.1: Storage Full

**Steps**:
1. Fill browser storage (if possible)
2. Try to save new conversation
3. Verify error handling
4. Check error message clarity

**Expected Result**:
- Clear error message
- Graceful degradation
- No data loss
- Recovery suggestions provided

**Test in**: Chrome, Edge, Firefox

---

#### Test Case 9.2: Network Offline

**Steps**:
1. Disable network
2. Try to use extension
3. Verify offline functionality
4. Check error messages for network-dependent features

**Expected Result**:
- Local features work offline
- Clear messages for unavailable features
- No crashes
- Graceful handling

**Test in**: Chrome, Edge, Firefox

---

### 10. Permissions

#### Test Case 10.1: Verify Permissions

**Steps**:
1. Open browser extension management
2. Check requested permissions
3. Verify all are necessary
4. Test with minimal permissions

**Expected Result**:
- Only necessary permissions requested
- Clear explanation for each
- Extension works with granted permissions
- Fails gracefully if permissions denied

**Test in**: Chrome, Edge, Firefox

---

## Browser-Specific Tests

### Firefox-Specific

#### Test Case F.1: Browser Namespace

**Steps**:
1. Check if `browser.*` API works
2. Verify `chrome.*` API with polyfill
3. Test both interchangeably

**Expected Result**:
- Both APIs available
- Consistent behavior
- No namespace errors

---

#### Test Case F.2: Service Worker Support

**Steps**:
1. Verify service worker starts
2. Check persistence
3. Test event handling

**Expected Result**:
- Service worker functions in Firefox 109+
- Events handled correctly
- No background script errors

---

### Edge-Specific

#### Test Case E.1: Sync with Chrome

**Steps**:
1. Test all features work identically to Chrome
2. Verify no Edge-specific bugs
3. Check performance parity

**Expected Result**:
- Identical functionality
- Similar performance
- No unique bugs

---

## Testing Tools

### Manual Testing Tools

- **Chrome DevTools**: F12 or Cmd/Opt+I
- **Firefox Developer Tools**: F12 or Cmd/Opt+I
- **Extension Inspector**: Right-click extension → Inspect
- **Console Monitoring**: Check for errors
- **Network Panel**: Monitor requests
- **Performance Panel**: Profile performance
- **Memory Panel**: Check for leaks

### Automated Testing

```bash
# Run any existing automated tests
npm test

# Check for TypeScript errors
npm run lint

# Build for testing
npm run build
```

### Testing Checklist Script

```javascript
// test/compatibility-check.js
// Run this in the browser console to perform basic checks

const CompatibilityTest = {
  checkStorage: async () => {
    try {
      await chrome.storage.local.set({ test: 'value' });
      const result = await chrome.storage.local.get('test');
      return result.test === 'value';
    } catch (e) {
      console.error('Storage test failed:', e);
      return false;
    }
  },
  
  checkRuntime: () => {
    return !!chrome.runtime && !!chrome.runtime.getManifest;
  },
  
  checkTabs: () => {
    return !!chrome.tabs;
  },
  
  runAll: async () => {
    console.log('Running compatibility tests...');
    const results = {
      storage: await CompatibilityTest.checkStorage(),
      runtime: CompatibilityTest.checkRuntime(),
      tabs: CompatibilityTest.checkTabs(),
    };
    console.table(results);
    return results;
  }
};

// Run tests
CompatibilityTest.runAll();
```

## Reporting Issues

When reporting browser-specific issues, include:

1. **Browser**: Name and version
2. **OS**: Operating system and version
3. **Extension Version**: From manifest
4. **Steps to Reproduce**: Detailed steps
5. **Expected vs Actual**: What should happen vs what happens
6. **Console Errors**: Any error messages
7. **Screenshots**: If applicable
8. **Workarounds**: Any temporary fixes found

## Sign-Off Checklist

Before releasing, ensure all critical tests pass:

- [ ] All High priority tests pass on Chrome
- [ ] All High priority tests pass on Edge
- [ ] All High priority tests pass on Firefox
- [ ] No critical console errors on any browser
- [ ] Export functionality works on all browsers
- [ ] Storage operations reliable on all browsers
- [ ] Performance acceptable on all browsers
- [ ] Memory usage acceptable on all browsers
- [ ] All permissions necessary and functional
- [ ] Documentation updated with known issues

---

**Testing is crucial for multi-browser support. Take time to test thoroughly before release!**
