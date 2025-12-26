# Testing Guide for Phase 3 Features

## Prerequisites

1. Load the extension in Chrome:
   - Build the extension: `npm run build`
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

2. Verify extension is loaded:
   - Check for BetterGPT icon in extensions
   - Open any webpage
   - Press `Ctrl+Shift+A` to toggle the UI

## Testing Conversation Linking

### Creating Test Conversations

Since the extension captures conversations from ChatGPT, you'll need to:

1. Go to https://chat.openai.com
2. Have a few conversations with ChatGPT
3. The conversations will be automatically saved

Alternatively, you can manually add test data via the browser console (see test-data-generator.ts for reference).

### Test Fork Functionality

1. Press `Ctrl+Shift+A` to open BetterGPT UI
2. You should see the **List View** by default
3. Find any conversation with messages
4. Click the **Fork** button (green)
5. Verify:
   - ✅ Alert confirms fork creation
   - ✅ New conversation appears in the list
   - ✅ New conversation has "Fork of" prefix in title
   - ✅ Link badge shows "🔗 1 link" on both conversations

### Test Continue Functionality

1. In List View, find any conversation
2. Click the **Continue** button (purple)
3. Verify:
   - ✅ Alert confirms continuation creation
   - ✅ New conversation appears with "Continued:" prefix
   - ✅ New conversation has all messages from original
   - ✅ Link badge shows connection

### Test Reference Links

Reference links are currently created programmatically. To test:

1. Use the browser console to create a reference:
   ```javascript
   // Access via extension context
   conversationLinkManager.createReference('conv_id_1', 'conv_id_2', 'Related topics')
   ```

## Testing Graph Visualization

### Access Graph View

1. Press `Ctrl+Shift+A` to open BetterGPT UI
2. Click the **🔗 Graph** button in the header
3. You should see an interactive force-directed graph

### Test Graph Interactions

1. **Zoom**: Use mouse wheel to zoom in/out
   - ✅ Graph scales smoothly
   - ✅ Zoom works from 0.1x to 4x

2. **Pan**: Click and drag on empty space
   - ✅ Graph moves smoothly
   - ✅ Can pan to see all nodes

3. **Drag Nodes**: Click and drag on a conversation node
   - ✅ Node follows cursor
   - ✅ Connected edges stretch
   - ✅ Physics simulation adjusts other nodes

4. **Click Node**: Click on any conversation circle
   - ✅ Switches to Context View
   - ✅ Shows selected conversation's context

5. **Hover Node**: Hover over any node
   - ✅ Tooltip appears with conversation details
   - ✅ Shows title, model, message count, created date

### Verify Visual Encoding

1. **Link Colors**:
   - Blue arrows = Fork links
   - Green arrows = Continuation links
   - Purple arrows = Reference links

2. **Node Colors**:
   - Gold circles = Favorite conversations
   - Gray circles = Archived conversations
   - Blue circles = Regular conversations

3. **Link Directions**:
   - Arrows point from source to target
   - Arrows appear at the end of each edge

## Testing Context Management

### Access Context View

1. Press `Ctrl+Shift+A` to open BetterGPT UI
2. Method 1: Click **View** button on any conversation in List View
3. Method 2: Click a node in Graph View
4. You should see the Context Panel

### Test Token Count Display

1. In Context View, check the token usage bar
   - ✅ Bar shows percentage filled
   - ✅ Color changes based on usage:
     - Green < 50%
     - Yellow 50-75%
     - Orange 75-90%
     - Red > 90%
   - ✅ Shows "X / Y" token counts
   - ✅ Shows percentage text

2. If context was truncated:
   - ✅ Warning banner appears below token bar
   - ✅ Message explains truncation reason

### Test Context Sources

1. Scroll to "Context Sources" section
2. Verify:
   - ✅ Lists all conversations contributing to context
   - ✅ Shows message count per source
   - ✅ Shows token count per source
   - ✅ Sources have conversation titles

### Test Context Settings

1. Find "Context Settings" section
2. Test **Auto-load parent conversation**:
   - ✅ Checkbox is clickable
   - ✅ Toggling triggers context reload
   - ✅ Setting is saved (persists on refresh)

3. Test **Auto-load linked conversations**:
   - ✅ Checkbox is clickable
   - ✅ Enabling loads linked conversation context
   - ✅ Disabling removes linked context

4. Test **Truncation Strategy** dropdown:
   - ✅ Shows three options: Balanced, Recent, Relevant
   - ✅ Changing strategy triggers context reload
   - ✅ Token counts update based on strategy

### Test Message Preview

1. Scroll to "Message Preview" section
2. Verify:
   - ✅ Shows up to 5 messages
   - ✅ User messages have blue background
   - ✅ Assistant messages have gray background
   - ✅ Shows role label (User/Assistant)
   - ✅ Long messages are truncated with "..."
   - ✅ If more than 5 messages, shows "+ N more messages"

## Testing Truncation Strategies

To test truncation, you need a conversation that exceeds token limits:

### Setup

1. Create or find a conversation with 20+ messages
2. Set a low max token limit (if configurable)
3. Or use a model with low token limit (gpt-3.5-turbo: 4K)

### Test "Recent" Strategy

1. Select conversation in Context View
2. Set truncation strategy to "Keep Most Recent"
3. Verify:
   - ✅ Most recent messages are kept
   - ✅ Older messages are dropped
   - ✅ Messages are in chronological order
   - ✅ Token count fits within limit

### Test "Relevant" Strategy

1. Set truncation strategy to "Keep Most Relevant"
2. Verify:
   - ✅ System messages are prioritized
   - ✅ First and last messages are kept
   - ✅ Longer messages (more context) are preferred
   - ✅ Recent messages have higher relevance

### Test "Balanced" Strategy

1. Set truncation strategy to "Balanced"
2. Verify:
   - ✅ Beginning messages are included
   - ✅ Ending messages are included
   - ✅ Some middle messages are sampled
   - ✅ Good representation of full conversation

## Testing View Mode Switching

### Test Seamless Transitions

1. Start in **List View**
2. Click **🔗 Graph** button
   - ✅ Smoothly transitions to Graph View
   - ✅ Graph renders without flickering

3. Click a node in Graph View
   - ✅ Transitions to Context View
   - ✅ Shows correct conversation

4. Click **📋 List** button
   - ✅ Returns to List View
   - ✅ List refreshes with latest data

5. Repeat transitions multiple times
   - ✅ No memory leaks (check browser task manager)
   - ✅ No console errors

## Edge Cases to Test

### Empty States

1. Delete all conversations
2. Open BetterGPT UI
3. Verify:
   - ✅ List View shows "No conversations yet"
   - ✅ Graph View shows "No conversation links to display"
   - ✅ Context View shows "Select a conversation to view context"

### Single Conversation (No Links)

1. Create one conversation with no links
2. Open Graph View
   - ✅ Shows single node
   - ✅ No edges/arrows
   - ✅ Node is positioned in center

### Complex Graph Structure

1. Create multiple forks and continuations
2. Create a chain: A → B → C → D
3. Create a tree: A → B, A → C, B → D, C → E
4. Open Graph View
5. Verify:
   - ✅ All nodes are visible
   - ✅ Links are correctly drawn
   - ✅ Layout is readable (no overlapping nodes)
   - ✅ Can navigate entire graph via pan/zoom

### Long Conversation Titles

1. Create conversation with very long title (100+ chars)
2. Verify:
   - ✅ Title is truncated in List View
   - ✅ Title is truncated in Graph View nodes
   - ✅ Full title visible in tooltip/Context View

### Performance Testing

1. Create 50+ conversations
2. Create 100+ links
3. Test each view:
   - ✅ List View: Smooth scrolling
   - ✅ Graph View: Renders in < 5 seconds
   - ✅ Context View: Loads instantly
4. Monitor browser memory
   - ✅ No excessive memory growth
   - ✅ Memory released when view changes

## Known Issues / Limitations

1. **Fork Point**: Currently forks at last message only
   - Future: Allow selecting specific message

2. **Link Editing**: Cannot modify links after creation
   - Future: Add edit/delete UI for links

3. **Graph Layout**: May be cluttered with 100+ nodes
   - Future: Add layout algorithms (tree, hierarchical)

4. **Token Estimation**: ~5-10% variance from actual
   - Acceptable for UX purposes
   - Actual counts from API are still recorded

## Reporting Issues

If you find bugs or issues:

1. Check browser console for errors
2. Note the steps to reproduce
3. Include screenshot if UI-related
4. Check browser compatibility (Chrome 88+)

## Success Criteria

Phase 3 testing is successful if:

- ✅ All conversation linking operations work
- ✅ Graph visualizes relationships correctly
- ✅ Context management loads and displays properly
- ✅ Token counting is reasonable (±10%)
- ✅ All three truncation strategies produce valid results
- ✅ UI is responsive and performant
- ✅ No critical bugs or crashes
