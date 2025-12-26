# Manual Testing Guide for BetterGPT Chrome Extension

This guide walks you through testing all features of the BetterGPT extension after loading it in Chrome.

## Prerequisites

1. Chrome browser (version 88+)
2. Extension built (run `npm run build`)
3. Either:
   - OpenAI API key (get from https://platform.openai.com/api-keys), OR
   - Local AI server running (e.g., LM Studio, Ollama)

## Initial Setup

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist/` folder from your BetterGPT directory
5. Extension should load successfully with no errors

**✅ Success Criteria:**
- Extension appears in Chrome extensions list
- No errors in extension details
- BetterGPT icon visible (if you click on extensions icon in Chrome toolbar)

### 2. Open Extension UI

1. Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
2. Extension panel should slide in from the right side of the screen

**✅ Success Criteria:**
- Panel slides in smoothly
- Three tabs visible: 💬 Chat, 📚 History, ⚙️ Settings
- No console errors (open DevTools with F12)

## Testing Provider Configuration

### 3. Configure OpenAI Provider

1. Click on **⚙️ Settings** tab
2. You should see "OpenAI" provider in the list (disabled by default)
3. Click **Edit** button next to OpenAI provider

**Modal should open with:**
- Title: "Edit Provider"
- Fields: Name, Type, API Key, Model, Max Tokens, Temperature
- Save and Cancel buttons

4. Fill in the form:
   - **API Key**: Paste your OpenAI API key (starts with `sk-`)
   - **Model**: `gpt-3.5-turbo` (default)
   - **Max Tokens**: `1000` (default)
   - **Temperature**: `0.7` (default)
5. Click **Save**

6. Click **Enable** button on the OpenAI provider

**✅ Success Criteria:**
- Modal closes after saving
- Provider card shows updated information
- "Enable" button changes to "Enabled" with green color
- No errors in console

### 4. Configure Local Proxy (Optional)

If you have a local AI server:

1. Click **+ Add Provider** button
2. Fill in the form:
   - **Name**: "Local AI" (or any name)
   - **Type**: Select "Local Proxy"
   - **Endpoint URL**: Your server endpoint (e.g., `http://localhost:1234/v1/chat/completions`)
   - **Model**: Your model name (e.g., `llama-2-7b`)
   - **Max Tokens**: `1000`
   - **Temperature**: `0.7`
3. Click **Save**
4. Click **Enable** on the new provider

**✅ Success Criteria:**
- New provider appears in list
- API Key field not shown for Local Proxy type
- Endpoint URL field shown and required
- Provider can be enabled

## Testing Chat Functionality

### 5. Basic Chat Test

1. Click on **💬 Chat** tab
2. You should see:
   - Welcome message
   - Message input area at bottom
   - Send button

3. Type a simple message: "Hello, what is 2 + 2?"
4. Click **Send** button

**✅ Success Criteria:**
- Your message appears in chat (blue bubble, right side)
- Loading indicator appears ("Thinking..." with spinner)
- AI response appears (gray bubble, left side)
- Loading indicator disappears
- Response is relevant (should answer "4")
- Conversation scrolls to show new messages

### 6. Context-Aware Test

1. Open a new tab and navigate to any website (e.g., Wikipedia article)
2. Select some text on the page
3. Press `Ctrl+Shift+A` to open BetterGPT
4. Click **💬 Chat** tab
5. Type: "Summarize the selected text"
6. Click **Send**

**✅ Success Criteria:**
- AI response references or summarizes the selected text
- Context is being passed correctly

### 7. Error Handling Test

1. In **⚙️ Settings**, disable your enabled provider
2. Go to **💬 Chat** tab
3. Try to send a message

**✅ Success Criteria:**
- Error message appears in red
- Error says "No AI provider configured" or similar
- Extension doesn't crash
- Can still interact with UI

4. Re-enable the provider to continue testing

## Testing UI Features

### 8. Tab Navigation

1. Click through all three tabs: Chat, History, Settings
2. Click back and forth between tabs

**✅ Success Criteria:**
- Each tab loads correctly
- Active tab highlighted (blue color, border bottom)
- Content switches properly
- No lag or flickering
- Tabs remember their state

### 9. Theme Configuration

1. Go to **⚙️ Settings** tab
2. Find "Theme" dropdown (under General Settings)
3. Try each option:
   - System (default)
   - Light
   - Dark

**✅ Success Criteria:**
- Theme changes immediately
- Colors update across all tabs
- Chat messages still readable
- Settings saved (persist after closing/reopening)

### 10. Panel Show/Hide

1. Click anywhere outside the extension panel
   - Panel should NOT close (it's persistent)
2. Press `Ctrl+Shift+A`
   - Panel should slide out (hide)
3. Press `Ctrl+Shift+A` again
   - Panel should slide back in (show)

**✅ Success Criteria:**
- Smooth animations
- Panel state maintained (same tab, same content)
- Chat history preserved
- No console errors

## Testing Provider Management

### 11. Add New Provider

1. **⚙️ Settings** tab
2. Click **+ Add Provider**
3. Fill in a test provider:
   - **Name**: "Test Provider"
   - **Type**: "OpenAI Compatible"
   - **API Key**: "test-key-123"
   - **Endpoint URL**: "https://example.com/v1/chat/completions"
   - **Model**: "test-model"
4. Click **Save**

**✅ Success Criteria:**
- New provider appears in list
- All fields saved correctly
- Can enable/disable the test provider
- Can edit the test provider again

### 12. Edit Existing Provider

1. Click **Edit** on any provider
2. Change the model name
3. Click **Save**

**✅ Success Criteria:**
- Changes reflected in provider card
- Modal closes
- Provider still works (if it was the active one)

### 13. Enable/Disable Providers

1. Try enabling and disabling different providers
2. Try sending a message with different providers enabled

**✅ Success Criteria:**
- Toggle works smoothly
- Only one provider needs to be active
- Chat uses the active/enabled provider
- Button shows correct state (Enabled/Disabled)

## Testing Error Scenarios

### 14. Invalid API Key

1. Edit OpenAI provider
2. Enter invalid API key (e.g., "invalid-key")
3. Click Save and Enable
4. Try to send a chat message

**✅ Success Criteria:**
- Error message shows in chat (red bubble)
- Error mentions API authentication or similar
- Extension doesn't crash
- Can correct the API key and retry

### 15. Network Error Simulation

1. Enable airplane mode or disconnect internet
2. Try to send a message

**✅ Success Criteria:**
- Error message shows (network-related)
- Loading indicator stops
- Extension remains functional
- Can retry after reconnecting

### 16. Empty Message

1. Try clicking Send without typing anything
2. Try typing only spaces

**✅ Success Criteria:**
- Nothing happens (message not sent)
- No error messages
- UI remains responsive

## Testing Performance

### 17. Long Conversation

1. Send 10+ messages in a row
2. Scroll through the conversation

**✅ Success Criteria:**
- All messages display correctly
- Scrolling is smooth
- No memory leaks (check DevTools Memory tab)
- Extension remains responsive

### 18. Long Response

1. Ask for a long response: "Write a 500-word essay about artificial intelligence"
2. Wait for full response

**✅ Success Criteria:**
- Response displays fully
- Scrolling works correctly
- Text wrapping works properly
- No UI glitches

## Testing Persistence

### 19. Close and Reopen

1. Configure providers and send some messages
2. Close the extension panel (`Ctrl+Shift+A`)
3. Close Chrome completely
4. Reopen Chrome
5. Navigate to the same or different page
6. Open extension panel (`Ctrl+Shift+A`)

**✅ Success Criteria:**
- Provider configuration persists
- Settings (theme, etc.) persist
- Extension initializes without errors
- Previous chat may or may not persist (depends on implementation)

### 20. Multiple Tabs

1. Open multiple browser tabs
2. Open extension in one tab
3. Open extension in another tab

**✅ Success Criteria:**
- Extension works independently in each tab
- No conflicts between instances
- Provider configuration shared across tabs

## Console Error Check

Throughout all tests, keep Chrome DevTools open (F12):

**✅ Success Criteria:**
- No errors in Console tab
- Only info/debug messages (if any)
- Warnings (if any) should be documented and non-critical

## Final Checklist

- [ ] Extension loads without errors
- [ ] Provider configuration works (add/edit/enable/disable)
- [ ] Chat sends messages successfully
- [ ] AI responses display correctly
- [ ] Loading states show properly
- [ ] Error handling works
- [ ] Theme switching works
- [ ] Tab navigation works
- [ ] Panel show/hide works
- [ ] Context awareness works (selected text)
- [ ] Settings persist across sessions
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Multiple tabs work correctly

## Troubleshooting

### Extension won't load
- Check that you ran `npm run build`
- Check `dist/` folder exists and contains files
- Check Chrome version (need 88+)

### No response from AI
- Check provider is enabled
- Check API key is correct
- Check internet connection
- Check console for error messages

### UI looks broken
- Try refreshing the page
- Check browser zoom level (should be 100%)
- Check for CSS conflicts with page styles

### Console shows errors
- Check the error message
- Look for line numbers
- Report specific errors with context

## Reporting Issues

When reporting issues, please include:
1. Chrome version
2. Extension version
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots (if applicable)

## Next Steps After Testing

If all tests pass:
- ✅ Extension is ready for personal use
- ✅ Can prepare for Chrome Web Store submission
- ✅ Can share with beta testers

If tests fail:
- 📝 Document specific failures
- 🐛 Report issues with details
- 🔧 Wait for fixes before re-testing
