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
 * Features:
 * - Multiple export formats with templates
 * - Bulk export operations
 * - Export history tracking in IndexedDB
 * - Error handling with retry logic
 * - Cross-platform filename validation
 * - Cleanup logic for incomplete exports
 */

import type { Conversation } from '../content/types';
import { db } from '../data/database';
import { templateManager } from './template-manager';

// Constants
const MAX_FILENAME_LENGTH = 50;
const URL_CLEANUP_DELAY_MS = 100;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

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

export interface ExportHistoryRecord {
  id: string;
  conversationId: string;
  conversationIds?: string[];
  format: ExportFormat;
  filename: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export class ExportManager {
  /**
   * Export a single conversation with retry logic
   */
  async exportConversation(
    conversationId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    return this.withRetry(async () => {
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

        const result = await this.exportConversations(conversations, options);
        
        // Record export in history
        await this.recordExportHistory({
          conversationId,
          format: options.format,
          filename: result.filename || 'unknown',
          success: result.success,
          error: result.error,
        });

        return result;
      } catch (error) {
        console.error('[ExportManager] Export failed:', error);
        const errorMsg = String(error);
        
        // Record failed export
        await this.recordExportHistory({
          conversationId,
          format: options.format,
          filename: 'failed',
          success: false,
          error: errorMsg,
        });
        
        return { success: false, error: errorMsg };
      }
    });
  }

  /**
   * Export multiple conversations with retry logic
   */
  async exportMultipleConversations(
    conversationIds: string[],
    options: ExportOptions
  ): Promise<ExportResult> {
    return this.withRetry(async () => {
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

        const result = await this.exportConversations(conversations, options);
        
        // Record export in history
        await this.recordExportHistory({
          conversationIds,
          format: options.format,
          filename: result.filename || 'unknown',
          success: result.success,
          error: result.error,
        });

        return result;
      } catch (error) {
        console.error('[ExportManager] Bulk export failed:', error);
        const errorMsg = String(error);
        
        // Record failed export
        await this.recordExportHistory({
          conversationIds,
          format: options.format,
          filename: 'failed',
          success: false,
          error: errorMsg,
        });
        
        return { success: false, error: errorMsg };
      }
    });
  }

  /**
   * Export conversations in specified format
   */
  private async exportConversations(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // Use custom template if provided
    if (options.customTemplate) {
      return this.exportWithCustomTemplate(conversations, options);
    }

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
        return await this.exportAsPDF(conversations, options);
      case 'docx':
        return await this.exportAsDOCX(conversations, options);
      default:
        return { success: false, error: 'Unsupported format' };
    }
  }

  /**
   * Export using custom template
   */
  private exportWithCustomTemplate(
    conversations: Conversation[],
    options: ExportOptions
  ): ExportResult {
    try {
      if (!options.customTemplate) {
        return { success: false, error: 'No custom template provided' };
      }

      // Validate template
      const validation = templateManager.validateTemplate(options.customTemplate);
      if (!validation.valid) {
        return { success: false, error: `Invalid template: ${validation.errors.join(', ')}` };
      }

      let content = '';
      for (const conversation of conversations) {
        content += templateManager.renderCustomTemplate(options.customTemplate, conversation);
        if (conversations.length > 1) {
          content += '\n\n---\n\n';
        }
      }

      const extension = options.format === 'markdown' ? 'md' : 
                       options.format === 'txt' ? 'txt' : 'html';
      const filename = this.generateFilename(conversations, extension);
      const mimeType = options.format === 'markdown' ? 'text/markdown' :
                      options.format === 'txt' ? 'text/plain' : 'text/html';
      const blob = new Blob([content], { type: mimeType });

      return { success: true, data: blob, filename };
    } catch (error) {
      return { success: false, error: String(error) };
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
        if (conversations.length > 1) {
          content += '\n\n---\n\n';
        }
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

        if (conversations.length > 1) {
          content += '\n---\n\n';
        }
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
    h1 {
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
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
   * Export as PDF
   * Note: This is a placeholder implementation
   * In a real implementation, we would use jsPDF library
   */
  private async exportAsPDF(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // For now, generate HTML and return with note about PDF conversion
      // TODO: Implement proper PDF generation using jsPDF library
      const htmlResult = this.exportAsHTML(conversations, options);
      
      if (!htmlResult.success || !htmlResult.data) {
        return { success: false, error: 'Failed to generate HTML for PDF' };
      }

      // Return HTML with instructions to use browser print
      return {
        success: true,
        data: htmlResult.data,
        filename: this.generateFilename(conversations, 'html'),
        error: 'PDF export will be implemented using jsPDF library. Use browser print (Ctrl+P) to save as PDF.'
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Export as DOCX
   * Note: This is a placeholder implementation
   * In a real implementation, we would use docx library
   */
  private async exportAsDOCX(
    conversations: Conversation[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // For now, export as HTML
      // TODO: Implement proper DOCX generation using docx library
      const htmlResult = this.exportAsHTML(conversations, options);
      
      if (!htmlResult.success || !htmlResult.data) {
        return { success: false, error: 'Failed to generate content for DOCX' };
      }

      return {
        success: true,
        data: htmlResult.data,
        filename: this.generateFilename(conversations, 'html'),
        error: 'DOCX export will be implemented using docx library. Use the HTML file to convert to DOCX.'
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate filename for export with cross-platform validation
   */
  private generateFilename(conversations: Conversation[], extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    if (conversations.length === 1) {
      const title = this.sanitizeFilename(conversations[0].title);
      return `${title}_${timestamp}.${extension}`;
    }
    
    return `bettergpt_conversations_${timestamp}.${extension}`;
  }

  /**
   * Sanitize filename for cross-platform compatibility
   * Removes/replaces characters that are invalid on Windows, macOS, or Linux
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    // Windows: < > : " / \ | ? *
    // Also remove control characters (0-31) and DEL (127)
    let sanitized = filename
      .replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g, '_')
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/_+/g, '_')    // Collapse multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase();
    
    // Ensure we have a valid filename
    if (!sanitized || sanitized.length === 0) {
      sanitized = 'conversation';
    }
    
    // Truncate to max length
    if (sanitized.length > MAX_FILENAME_LENGTH) {
      sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
    }
    
    // Ensure filename doesn't end with a dot or space (invalid on Windows)
    sanitized = sanitized.replace(/[.\s]+$/, '');
    
    return sanitized || 'conversation';
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const htmlEscapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char] || char);
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

  /**
   * Retry logic for export operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === attempts - 1) {
          throw error;
        }
        // Exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, i);
        console.warn(`[ExportManager] Retry attempt ${i + 1}/${attempts} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  /**
   * Record export in history (IndexedDB)
   */
  private async recordExportHistory(record: Partial<ExportHistoryRecord>): Promise<void> {
    try {
      const historyRecord: ExportHistoryRecord = {
        id: `export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        conversationId: record.conversationId || '',
        conversationIds: record.conversationIds,
        format: record.format!,
        filename: record.filename!,
        timestamp: Date.now(),
        success: record.success || false,
        error: record.error,
      };

      // Save to IndexedDB via the database
      await db.saveExportHistory(historyRecord);
      
      console.log('[ExportManager] Export history recorded:', historyRecord.id);
    } catch (error) {
      console.error('[ExportManager] Failed to record export history:', error);
      // Don't throw - recording history failure shouldn't fail the export
    }
  }

  /**
   * Get export history from IndexedDB
   */
  async getExportHistory(limit?: number): Promise<ExportHistoryRecord[]> {
    try {
      return await db.getExportHistory(limit);
    } catch (error) {
      console.error('[ExportManager] Failed to get export history:', error);
      return [];
    }
  }

  /**
   * Get export history for a specific conversation
   */
  async getConversationExportHistory(conversationId: string): Promise<ExportHistoryRecord[]> {
    try {
      return await db.getConversationExportHistory(conversationId);
    } catch (error) {
      console.error('[ExportManager] Failed to get conversation export history:', error);
      return [];
    }
  }

  /**
   * Clear export history
   */
  async clearExportHistory(): Promise<void> {
    try {
      await db.clearExportHistory();
      console.log('[ExportManager] Export history cleared');
    } catch (error) {
      console.error('[ExportManager] Failed to clear export history:', error);
    }
  }

  /**
   * Cleanup incomplete or corrupted exports
   */
  async cleanupIncompleteExports(): Promise<number> {
    try {
      const history = await this.getExportHistory();
      const incompleteExports = history.filter(record => !record.success);
      
      // In a real implementation, we would clean up any temporary files
      // For now, we just log the incomplete exports
      console.log(`[ExportManager] Found ${incompleteExports.length} incomplete exports`);
      
      return incompleteExports.length;
    } catch (error) {
      console.error('[ExportManager] Failed to cleanup incomplete exports:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
