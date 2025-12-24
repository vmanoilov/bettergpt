# BetterGPT Development Guide

## Phase 2: Core Features Implemented

This document describes the Phase 2 implementation of BetterGPT, which includes ChatGPT integration and conversation management features.

## Features Implemented

### 1. ChatGPT Integration

#### API Interceptor (`src/integrations/chatgpt/interceptor.ts`)
- Intercepts ChatGPT API calls using fetch and XMLHttpRequest
- Captures conversation data including:
  - Request and response payloads
  - Model information
  - Token usage
  - Streaming responses
- Automatically saves conversations to IndexedDB

#### DOM Observer (`src/integrations/chatgpt/dom-observer.ts`)
- Monitors ChatGPT page for changes
- Detects new messages in real-time
- Tracks conversation navigation
- Extracts conversation metadata (title, model)
- Emits custom events for conversation changes

#### Sidebar Injector (`src/integrations/chatgpt/sidebar.ts`)
- Injects a sidebar UI into ChatGPT interface
- Provides quick access to saved conversations
- Shows folder structure
- Includes search functionality
- Keyboard shortcut: `Ctrl+Shift+S` to toggle

### 2. Conversation Management

#### Database (`src/data/database.ts`)
- Uses DexieJS for IndexedDB operations
- Two main tables:
  - `conversations`: Stores conversation data with messages
  - `folders`: Stores folder structure for organization
- Indexes for efficient querying:
  - By folder
  - By favorite status
  - By archive status
  - By tags
  - By creation/update date

#### Conversation Manager (`src/managers/conversation-manager.ts`)
Provides operations for:
- Archive/unarchive conversations
- Favorite/unfavorite conversations
- Move to folder
- Bulk operations (archive, delete, move)
- Thread management (parent-child relationships)
- Search functionality
- Import/export conversations

#### Folder Manager (`src/managers/folder-manager.ts`)
Provides operations for:
- Create/rename/delete folders
- Nested folder structure
- Move folders
- Get folder tree
- Get folder path (breadcrumb)
- Set folder color and icon

## Architecture

```
src/
├── background/
│   └── service-worker.ts          # Background service worker
├── content/
│   ├── main.ts                     # Content script entry point
│   ├── types.ts                    # Type definitions
│   └── ui/
│       ├── UIManager.ts            # UI component manager
│       └── ChatPanel.ts            # Chat panel component
├── data/
│   └── database.ts                 # IndexedDB database layer
├── integrations/
│   └── chatgpt/
│       ├── index.ts                # Integration manager
│       ├── interceptor.ts          # API interceptor
│       ├── dom-observer.ts         # DOM observer
│       └── sidebar.ts              # Sidebar injector
└── managers/
    ├── conversation-manager.ts     # Conversation operations
    └── folder-manager.ts           # Folder operations
```

## Building the Extension

### Prerequisites
- Node.js 16+ installed
- npm or pnpm

### Installation
```bash
npm install
```

### Build for Development
```bash
npm run build
```

This will:
1. Compile TypeScript files to JavaScript
2. Bundle dependencies using esbuild
3. Copy static assets (manifest, icons)
4. Output everything to `dist/` directory

### Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder from the project

## Testing

### Manual Testing
1. Build the extension: `npm run build`
2. Load in Chrome (see above)
3. Open `test-page.html` in your browser
4. Test the following:
   - Extension loading (check status)
   - UI toggle with `Ctrl+Shift+A`
   - Database operations (via browser DevTools console)

### Testing on ChatGPT
1. Load the extension in Chrome
2. Navigate to https://chat.openai.com or https://chatgpt.com
3. Start a conversation with ChatGPT
4. Open browser DevTools console and check for:
   - `[ChatGPTInterceptor]` logs showing API calls being captured
   - `[ChatGPTDOMObserver]` logs showing DOM changes
5. Press `Ctrl+Shift+S` to open the BetterGPT sidebar
6. Your conversation should appear in the sidebar

### Database Testing
Open browser console and run:

```javascript
// Access the database
const db = window.indexedDB.databases();
db.then(databases => console.log(databases));

// The database should be named 'BetterGPTDB'
```

## Keyboard Shortcuts

- `Ctrl+Shift+A` - Toggle main BetterGPT UI
- `Ctrl+Shift+S` - Toggle ChatGPT sidebar (when on ChatGPT)

## Data Storage

All data is stored locally in IndexedDB:
- Database name: `BetterGPTDB`
- Tables: `conversations`, `folders`
- No data is sent to external servers
- Data persists across browser sessions

### Conversation Schema
```typescript
interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  folderId?: string;
  parentId?: string;
  isArchived: boolean;
  isFavorite: boolean;
  totalTokens?: number;
  tags?: string[];
}
```

### Folder Schema
```typescript
interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  icon?: string;
}
```

## Known Limitations

1. **ChatGPT Integration**: The DOM selectors and API patterns are based on the current ChatGPT interface. They may need updates if ChatGPT changes their UI or API.

2. **Auto-save**: Currently implements basic auto-save. May need refinement for edge cases.

3. **Streaming**: Streaming message capture is implemented but may need adjustment based on ChatGPT's actual streaming format.

4. **Attachments**: Attachment handling structure is in place but needs full implementation based on ChatGPT's attachment format.

## Future Enhancements

- Drag-and-drop for folder organization
- Advanced search with filters
- Export conversations in multiple formats
- Conversation templates
- Tag management UI
- Bulk operations UI
- Settings page
- Sync across devices

## Troubleshooting

### Extension not loading
- Check Chrome DevTools console for errors
- Verify `dist/` folder contains compiled files
- Try reloading the extension from `chrome://extensions/`

### Database not working
- Open IndexedDB in Chrome DevTools (Application tab)
- Check if `BetterGPTDB` database exists
- Clear the database if needed: Application > IndexedDB > BetterGPTDB > Delete database

### ChatGPT integration not working
- Ensure you're on the correct ChatGPT domain
- Check console for `[ChatGPTInterceptor]` and `[ChatGPTDOMObserver]` logs
- API endpoints may have changed - check network tab

## Contributing

When making changes:
1. Edit TypeScript files in `src/`
2. Run `npm run build` to compile
3. Test in Chrome
4. Commit only source files (not `dist/`)

## License

ISC
