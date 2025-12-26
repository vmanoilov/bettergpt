# Phase 4: Export/Import System

## Overview

Phase 4 introduces a comprehensive export and import system for BetterGPT conversations. This system allows users to export conversations in multiple formats and import them from various sources, including ChatGPT exports.

## Features

### 1. Export Formats

The export system supports multiple file formats:

- **Markdown (.md)** - Three templates available:
  - Standard: Basic markdown with emoji indicators
  - Obsidian: Compatible with Obsidian vault format with YAML frontmatter
  - GitHub: GitHub-flavored markdown

- **Plain Text (.txt)** - Simple text format for universal compatibility

- **JSON (.json)** - Native format preserving all conversation data

- **HTML (.html)** - Styled HTML for web viewing and printing

- **PDF (.pdf)** - Print-ready format (via browser print dialog)

- **DOCX (.docx)** - Microsoft Word format (planned)

### 2. Export Options

#### Single Conversation Export
```typescript
import { exportImportService } from './managers/export-import-service';

// Export as JSON
await exportImportService.exportConversation('conv_id', 'json');

// Export as Markdown (Obsidian format)
await exportImportService.exportConversation('conv_id', 'markdown', {
  template: 'obsidian',
  includeMetadata: true,
});
```

#### Multiple Conversation Export
```typescript
// Export multiple conversations
await exportImportService.exportMultipleConversations(
  ['conv_id_1', 'conv_id_2'],
  'json'
);
```

#### Include Thread Relationships
```typescript
// Export conversation with all child threads
await exportImportService.exportConversation('conv_id', 'json', {
  includeThreads: true,
});
```

### 3. Import Formats

The import system supports:

- **JSON** - Native BetterGPT format
- **Markdown with Metadata** - Markdown files with YAML frontmatter or structured format
- **ChatGPT Exports** - Official ChatGPT export format
- **Plain Text** - Basic text files with role markers

#### Import Examples

```typescript
// Import from file
const file = /* File object from file input */;

// Import JSON
const count = await exportImportService.importFromFile(file, 'json');

// Import Markdown
const count = await exportImportService.importFromFile(file, 'markdown', {
  generateNewIds: true,
  preserveFolders: false,
});

// Import ChatGPT export
const count = await exportImportService.importFromFile(file, 'chatgpt');
```

### 4. Custom Templates

The template system allows users to create custom export formats using a handlebars-like syntax.

#### Available Variables

- `{{title}}` - Conversation title
- `{{model}}` - AI model name
- `{{createdAt}}` - Creation date
- `{{updatedAt}}` - Last update date
- `{{totalTokens}}` - Token count
- `{{tags}}` - Comma-separated tags
- `{{messageCount}}` - Number of messages
- `{{#each messages}}...{{/each}}` - Loop through messages
- `{{messages[].role}}` - Message role (user/assistant)
- `{{messages[].content}}` - Message content
- `{{messages[].timestamp}}` - Message timestamp

#### Template Examples

**Simple Text Template:**
```handlebars
{{title}}

Model: {{model}}
Messages: {{messageCount}}

{{#each messages}}
[{{role}}] {{content}}

{{/each}}
```

**Custom Markdown Template:**
```handlebars
# {{title}}

> Created: {{createdAt}} | Model: {{model}}

{{#each messages}}
**{{role}}**: {{content}}

{{/each}}
```

#### Creating Custom Templates

```typescript
import { exportImportService } from './managers/export-import-service';

exportImportService.createTemplate({
  id: 'my-custom-template',
  name: 'My Custom Template',
  format: 'markdown',
  template: `# {{title}}\n\n{{#each messages}}{{content}}\n\n{{/each}}`,
  description: 'A custom template for my needs',
});
```

#### Using Custom Templates

```typescript
// Export with built-in template
await exportImportService.exportConversation('conv_id', 'markdown', {
  template: 'obsidian',
});

// Export with custom template
const customTemplate = `{{title}}\n{{#each messages}}{{role}}: {{content}}\n{{/each}}`;
await exportImportService.exportWithCustomTemplate(
  'conv_id',
  customTemplate,
  'markdown'
);
```

### 5. Built-in Templates

#### Markdown Templates

1. **Standard** (`markdown-standard`)
   - Clean markdown with emoji indicators
   - Metadata section at top
   - Clear message separation

2. **Obsidian** (`markdown-obsidian`)
   - YAML frontmatter for Obsidian compatibility
   - Callout blocks for messages
   - Tags support

3. **GitHub** (`markdown-github`)
   - GitHub-flavored markdown
   - Code blocks for metadata
   - Heading-based message separation

#### HTML Templates

1. **Academic** (`html-academic`)
   - Professional typography (Times New Roman)
   - Centered title and metadata
   - Justified text alignment
   - Print-friendly styling

#### Text Templates

1. **Minimal** (`txt-minimal`)
   - Simple role markers
   - No metadata
   - Maximum readability

## API Reference

### ExportImportService

Main service for export/import operations.

#### Methods

**exportConversation(conversationId, format, options?)**
- Export a single conversation
- Parameters:
  - `conversationId`: string
  - `format`: 'markdown' | 'txt' | 'json' | 'html' | 'pdf' | 'docx'
  - `options`: Partial<ExportOptions>
- Returns: Promise<void>

**exportMultipleConversations(conversationIds, format, options?)**
- Export multiple conversations
- Parameters:
  - `conversationIds`: string[]
  - `format`: Export format
  - `options`: Partial<ExportOptions>
- Returns: Promise<void>

**importFromFile(file, format, options?)**
- Import conversations from file
- Parameters:
  - `file`: File object
  - `format`: 'json' | 'markdown' | 'chatgpt' | 'txt'
  - `options`: Partial<ImportOptions>
- Returns: Promise<number> (count of imported conversations)

**getExportFormats()**
- Get list of available export formats
- Returns: Array of format objects

**getImportFormats()**
- Get list of available import formats
- Returns: Array of format objects

**getTemplates(format?)**
- Get available templates
- Parameters:
  - `format`: Optional format filter
- Returns: Template[]

**createTemplate(template)**
- Create a custom template
- Parameters:
  - `template`: Template object
- Returns: void

**getTemplateVariables()**
- Get list of available template variables
- Returns: Array of variable objects

### Export Options

```typescript
interface ExportOptions {
  format: ExportFormat;
  template?: string; // Template ID
  includeMetadata?: boolean;
  includeThreads?: boolean;
  customTemplate?: string; // Handlebars template
}
```

### Import Options

```typescript
interface ImportOptions {
  format: ImportFormat;
  generateNewIds?: boolean;
  preserveFolders?: boolean;
}
```

## Data Integrity

The export/import system ensures data integrity by:

1. **Preserving Conversation Structure**
   - All messages maintained in order
   - Timestamps preserved
   - Metadata retained

2. **Thread Relationships**
   - Parent-child relationships maintained
   - Option to include or exclude threads

3. **Validation**
   - Import validation ensures required fields exist
   - Invalid data is skipped with warnings
   - Graceful error handling

4. **ID Management**
   - Option to generate new IDs on import (default)
   - Prevents conflicts with existing conversations
   - Maintains referential integrity

## Usage Examples

### Basic Export

```typescript
import { exportImportService } from './managers/export-import-service';

// Export as JSON
await exportImportService.exportConversation('conv_123', 'json');

// Export as Markdown
await exportImportService.exportConversation('conv_123', 'markdown');

// Export as HTML
await exportImportService.exportConversation('conv_123', 'html');
```

### Advanced Export

```typescript
// Export with specific template
await exportImportService.exportConversation('conv_123', 'markdown', {
  template: 'obsidian',
  includeMetadata: true,
  includeThreads: true,
});

// Bulk export
const convIds = ['conv_1', 'conv_2', 'conv_3'];
await exportImportService.exportMultipleConversations(convIds, 'json');
```

### Basic Import

```typescript
// Import JSON
const file = /* File from input */;
const count = await exportImportService.importFromFile(file, 'json');
console.log(`Imported ${count} conversations`);
```

### Advanced Import

```typescript
// Import with options
const count = await exportImportService.importFromFile(file, 'markdown', {
  generateNewIds: true,
  preserveFolders: false,
});
```

## File Format Specifications

### JSON Format

```json
{
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "conversations": [
    {
      "id": "conv_123",
      "title": "Conversation Title",
      "model": "gpt-4",
      "createdAt": 1234567890000,
      "updatedAt": 1234567890000,
      "messages": [
        {
          "id": "msg_1",
          "role": "user",
          "content": "Hello!",
          "timestamp": 1234567890000
        }
      ],
      "isArchived": false,
      "isFavorite": false,
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Markdown Format (Obsidian)

```markdown
---
title: Conversation Title
model: gpt-4
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [tag1, tag2]
---

# Conversation Title

> [!user] User
> Hello!

> [!assistant] Assistant
> Hi there!
```

### Plain Text Format

```
Conversation Title
==================

Model: gpt-4
Created: 1/1/2024

[USER]
Hello!

[ASSISTANT]
Hi there!

---
```

## Testing

A comprehensive test suite is available in `src/test/export-import-test.ts`:

```typescript
import { runAllTests } from './test/export-import-test';

// Run all tests
await runAllTests();
```

Individual test functions:
- `testExport()` - Test export functionality
- `testImport()` - Test import functionality
- `testTemplates()` - Test template system
- `testBulkExport()` - Test bulk export

## Future Enhancements

Planned improvements for future phases:

1. **PDF Generation**
   - Native PDF generation without browser print dialog
   - Custom PDF templates with styling

2. **DOCX Export**
   - Full Microsoft Word document generation
   - Styling and formatting support

3. **Zip Archives**
   - True zip archive support for bulk exports
   - Individual files per conversation

4. **Cloud Export**
   - Export directly to cloud storage
   - Google Drive, Dropbox integration

5. **Scheduled Exports**
   - Automatic backup exports
   - Configurable export schedules

6. **Export Profiles**
   - Save export configurations
   - Quick export with saved settings

## Architecture

The export/import system consists of four main components:

1. **ExportManager** (`export-manager.ts`)
   - Handles all export operations
   - Format conversion
   - File generation

2. **ImportManager** (`import-manager.ts`)
   - Handles all import operations
   - Format parsing
   - Data validation

3. **TemplateManager** (`template-manager.ts`)
   - Template storage and management
   - Template rendering engine
   - Variable substitution

4. **ExportImportService** (`export-import-service.ts`)
   - Unified API for export/import
   - Coordinates all managers
   - High-level operations

## Contributing

When adding new export/import features:

1. Add format support to appropriate manager
2. Update type definitions
3. Add tests to test suite
4. Update this documentation
5. Consider backward compatibility

## License

See main project LICENSE file.
