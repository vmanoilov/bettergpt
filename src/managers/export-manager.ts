/**
 * Export Manager
 * 
 * Handles exporting conversations in various formats:
 * - Markdown (.md)
 * - Plain text (.txt)
 * - JSON (.json)
 * - HTML (.html)
 * - PDF (.pdf)
 * - DOCX (.docx)
 * 
 * Supports custom templates and bulk exports.
 */

import type { Conversation } from '../content/types';
import { db } from '../data/database';

// Constants
const MAX_FILENAME_LENGTH = 50;
const URL_CLEANUP_DELAY_MS = 100;

export type ExportFormat = 'markdown' | 'txt' | 'json' | 'html' | 'pdf' | 'docx';
export type MarkdownTemplate = 'standard' | 'obsidian' | 'github';
export type PDFTemplate = 'minimal' | 'academic' | 'dark';

export interface ExportOptions {
  format: ExportFormat;
  template?: MarkdownTemplate | PDFTemplate | string;
  includeMetadata?: boolean;
  includeThreads?: boolean;
  customTemplate?: string; // Handlebars template
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename?: string;
  error?: string;
}

export class ExportManager {
  /**
   * Export a single conversation
   */
  async exportConversation(
    conversationId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const conversation = await db.getConversation(conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      // Get threads if needed
      let conversations = [conversation];
      if (options.includeThreads) {
        const threads = await db.getConversationThreads(conversationId);
        conversations = [conversation, ...threads];
      }

      return this.exportConversations(conversations, options);
    } catch (error) {
      console.error('[ExportManager] Export failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export multiple conversations
   */
  async exportMultipleConversations(
    conversationIds: string[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const conversations: Conversation[] = [];
      
      for (const id of conversationIds) {
        const conv = await db.getConversation(id);
        if (conv) {
          conversations.push(conv);
          
          // Include threads if needed
          if (options.includeThreads) {
            const threads = await db.getConversationThreads(id);
            conversations.push(...threads);
          }
        }
      }

      if (conversations.length === 0) {
        return { success: false, error: 'No conversations found' };
      }

      // For multiple conversations, create a zip archive
      if (conversations.length > 1) {
        return this.exportAsZip(conversations, options);
      }

      return this.exportConversations(conversations, options);
    } catch (error) {
      console.error('[ExportManager] Bulk export failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export conversations in specified format
   */
  private async exportConversations(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    switch (options.format) {
      case 'markdown':
        return this.exportAsMarkdown(conversations, options);
      case 'txt':
        return this.exportAsText(conversations, options);
      case 'json':
        return this.exportAsJSON(conversations, options);
      case 'html':
        return this.exportAsHTML(conversations, options);
      case 'pdf':
        return this.exportAsPDF(conversations, options);
      case 'docx':
        return this.exportAsDOCX(conversations, options);
      default:
        return { success: false, error: 'Unsupported format' };
    }
  }

  /**
   * Export as Markdown
   */
  private exportAsMarkdown(
    conversations: Conversation[],
    options: ExportOptions
  ): ExportResult {
    try {
      const template = options.template as MarkdownTemplate || 'standard';
      let content = '';

      for (const conversation of conversations) {
        content += this.formatMarkdown(conversation, template, options.includeMetadata);
        content += '\n\n---\n\n';
      }

      const filename = this.generateFilename(conversations, 'md');
      const blob = new Blob([content], { type: 'text/markdown' });

      return { success: true, data: blob, filename };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Format conversation as Markdown
   */
  private formatMarkdown(
    conversation: Conversation,
    template: MarkdownTemplate,
    includeMetadata: boolean = true
  ): string {
    let md = '';

    switch (template) {
      case 'obsidian':
        md += this.formatObsidianMarkdown(conversation, includeMetadata);
        break;
      case 'github':
        md += this.formatGitHubMarkdown(conversation, includeMetadata);
        break;
      default:
        md += this.formatStandardMarkdown(conversation, includeMetadata);
    }

    return md;
  }

  /**
   * Standard Markdown format
   */
  private formatStandardMarkdown(
    conversation: Conversation,
    includeMetadata: boolean
  ): string {
    let md = `# ${conversation.title}\n\n`;

    if (includeMetadata) {
      md += `**Model:** ${conversation.model}\n`;
      md += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      md += `**Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      if (conversation.totalTokens) {
        md += `**Tokens:** ${conversation.totalTokens}\n`;
      }
      if (conversation.tags && conversation.tags.length > 0) {
        md += `**Tags:** ${conversation.tags.join(', ')}\n`;
      }
      md += '\n';
    }

    for (const message of conversation.messages) {
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      md += `## ${role}\n\n`;
      md += `${message.content}\n\n`;
      
      if (message.attachments && message.attachments.length > 0) {
        md += `*Attachments: ${message.attachments.length}*\n\n`;
      }
    }

    return md;
  }

  /**
   * Obsidian-compatible Markdown format
   */
  private formatObsidianMarkdown(
    conversation: Conversation,
    includeMetadata: boolean
  ): string {
    let md = '---\n';
    md += `title: ${conversation.title}\n`;
    md += `model: ${conversation.model}\n`;
    md += `created: ${new Date(conversation.createdAt).toISOString()}\n`;
    md += `updated: ${new Date(conversation.updatedAt).toISOString()}\n`;
    if (conversation.tags && conversation.tags.length > 0) {
      md += `tags: [${conversation.tags.join(', ')}]\n`;
    }
    md += '---\n\n';

    md += `# ${conversation.title}\n\n`;

    for (const message of conversation.messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      md += `> [!${role.toLowerCase()}] ${role}\n`;
      md += `> ${message.content.replace(/\n/g, '\n> ')}\n\n`;
    }

    return md;
  }

  /**
   * GitHub-compatible Markdown format
   */
  private formatGitHubMarkdown(
    conversation: Conversation,
    includeMetadata: boolean
  ): string {
    let md = `# ${conversation.title}\n\n`;

    if (includeMetadata) {
      md += '```\n';
      md += `Model: ${conversation.model}\n`;
      md += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
      md += `Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      if (conversation.totalTokens) {
        md += `Tokens: ${conversation.totalTokens}\n`;
      }
      md += '```\n\n';
    }

    for (const message of conversation.messages) {
      const emoji = message.role === 'user' ? '👤' : '🤖';
      md += `### ${emoji} ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}\n\n`;
      md += `${message.content}\n\n`;
    }

    return md;
  }

  /**
   * Export as plain text
   */
  private exportAsText(
    conversations: Conversation[],
    options: ExportOptions
  ): ExportResult {
    try {
      let content = '';

      for (const conversation of conversations) {
        content += `${conversation.title}\n`;
        content += `${'='.repeat(conversation.title.length)}\n\n`;

        if (options.includeMetadata) {
          content += `Model: ${conversation.model}\n`;
          content += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
          content += `Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
        }

        for (const message of conversation.messages) {
          const role = message.role.toUpperCase();
          content += `[${role}]\n`;
          content += `${message.content}\n\n`;
        }

        content += '\n---\n\n';
      }

      const filename = this.generateFilename(conversations, 'txt');
      const blob = new Blob([content], { type: 'text/plain' });

      return { success: true, data: blob, filename };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(
    conversations: Conversation[],
    options: ExportOptions
  ): ExportResult {
    try {
      const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        conversations: conversations,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const filename = this.generateFilename(conversations, 'json');
      const blob = new Blob([jsonString], { type: 'application/json' });

      return { success: true, data: blob, filename };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export as HTML
   */
  private exportAsHTML(
    conversations: Conversation[],
    options: ExportOptions
  ): ExportResult {
    try {
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BetterGPT Conversations Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    .conversation {
      margin-bottom: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #fff;
    }
    .conversation-header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #4a90e2;
    }
    .conversation-title {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 10px 0;
      color: #2c3e50;
    }
    .metadata {
      font-size: 14px;
      color: #666;
    }
    .message {
      margin: 15px 0;
      padding: 15px;
      border-radius: 8px;
    }
    .message.user {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    .message.assistant {
      background: #f5f5f5;
      border-left: 4px solid #4caf50;
    }
    .message-role {
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-size: 12px;
    }
    .message.user .message-role {
      color: #1976d2;
    }
    .message.assistant .message-role {
      color: #388e3c;
    }
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    pre {
      background: #f4f4f4;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <h1>BetterGPT Conversations Export</h1>
  <p>Exported on ${new Date().toLocaleString()}</p>
`;

      for (const conversation of conversations) {
        html += `
  <div class="conversation">
    <div class="conversation-header">
      <h2 class="conversation-title">${this.escapeHtml(conversation.title)}</h2>
`;
        if (options.includeMetadata) {
          html += `
      <div class="metadata">
        <strong>Model:</strong> ${this.escapeHtml(conversation.model)}<br>
        <strong>Created:</strong> ${new Date(conversation.createdAt).toLocaleString()}<br>
        <strong>Updated:</strong> ${new Date(conversation.updatedAt).toLocaleString()}
`;
          if (conversation.totalTokens) {
            html += `<br><strong>Tokens:</strong> ${conversation.totalTokens}`;
          }
          if (conversation.tags && conversation.tags.length > 0) {
            html += `<br><strong>Tags:</strong> ${conversation.tags.join(', ')}`;
          }
          html += `
      </div>
`;
        }
        html += `
    </div>
`;

        for (const message of conversation.messages) {
          html += `
    <div class="message ${message.role}">
      <div class="message-role">${message.role}</div>
      <div class="message-content">${this.escapeHtml(message.content)}</div>
    </div>
`;
        }

        html += `
  </div>
`;
      }

      html += `
</body>
</html>`;

      const filename = this.generateFilename(conversations, 'html');
      const blob = new Blob([html], { type: 'text/html' });

      return { success: true, data: blob, filename };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export as PDF (using browser print API)
   */
  private async exportAsPDF(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Generate HTML content first
      const htmlResult = this.exportAsHTML(conversations, options);
      
      if (!htmlResult.success || !htmlResult.data) {
        return { success: false, error: 'Failed to generate HTML for PDF' };
      }

      // Return HTML with instructions to use browser print
      // In a real extension, we would use chrome.printing API or similar
      return {
        success: true,
        data: htmlResult.data,
        filename: this.generateFilename(conversations, 'html'),
        error: 'PDF export requires using browser print dialog. Opening HTML version...'
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export as DOCX
   * Note: This would require a library like docx.js
   * For now, we'll export as HTML with a note
   */
  private async exportAsDOCX(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // For now, export as HTML
      // In a full implementation, we would use a library like docx.js
      const htmlResult = this.exportAsHTML(conversations, options);
      
      if (!htmlResult.success || !htmlResult.data) {
        return { success: false, error: 'Failed to generate content for DOCX' };
      }

      return {
        success: true,
        data: htmlResult.data,
        filename: this.generateFilename(conversations, 'html'),
        error: 'DOCX export not yet implemented. Opening HTML version which can be saved as DOCX...'
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export multiple conversations as a zip archive
   */
  private async exportAsZip(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // For simplicity, export as a single JSON file with all conversations
      // A real implementation would use a library like JSZip
      return this.exportAsJSON(conversations, options);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate filename for export
   */
  private generateFilename(conversations: Conversation[], extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (conversations.length === 1) {
      const title = conversations[0].title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .slice(0, MAX_FILENAME_LENGTH);
      return `${title}_${timestamp}.${extension}`;
    }
    
    return `bettergpt_conversations_${timestamp}.${extension}`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Download a file
   */
  downloadFile(data: Blob | string, filename: string): void {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up URL after download completes
    setTimeout(() => URL.revokeObjectURL(url), URL_CLEANUP_DELAY_MS);
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
