/**
 * Export Manager
 * 
 * Manages conversation export operations:
 * - Export conversations in multiple formats (JSON, Markdown, Text, HTML)
 * - Auto-export on conversation completion
 * - Bulk export operations
 * - Export history tracking
 */

import type { Conversation } from '../content/types';
import { db } from '../data/database';

export type ExportFormat = 'json' | 'markdown' | 'text' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  autoExport?: boolean;
  fileName?: string;
}

export interface ExportRecord {
  id: string;
  conversationId: string;
  format: ExportFormat;
  timestamp: number;
  fileName: string;
}

export class ExportManager {
  private autoExportEnabled = false;
  private autoExportFormat: ExportFormat = 'markdown';
  private exportHistory: ExportRecord[] = [];

  /**
   * Initialize export manager
   */
  async initialize(): Promise<void> {
    console.log('[ExportManager] Initializing');
    await this.loadSettings();
  }

  /**
   * Load export settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      // Check if Chrome storage API is available
      if (!chrome?.storage?.local) {
        console.warn('[ExportManager] Chrome storage API not available, using defaults');
        return;
      }
      
      const result = await chrome.storage.local.get(['autoExport', 'autoExportFormat']);
      this.autoExportEnabled = result.autoExport || false;
      this.autoExportFormat = result.autoExportFormat || 'markdown';
      console.log('[ExportManager] Settings loaded:', { 
        autoExport: this.autoExportEnabled, 
        format: this.autoExportFormat 
      });
    } catch (error) {
      console.error('[ExportManager] Error loading settings:', error);
    }
  }

  /**
   * Save export settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      if (!chrome?.storage?.local) {
        console.warn('[ExportManager] Chrome storage API not available');
        return;
      }
      
      await chrome.storage.local.set({
        autoExport: this.autoExportEnabled,
        autoExportFormat: this.autoExportFormat
      });
    } catch (error) {
      console.error('[ExportManager] Error saving settings:', error);
    }
  }

  /**
   * Enable/disable auto-export
   */
  async setAutoExport(enabled: boolean, format?: ExportFormat): Promise<void> {
    this.autoExportEnabled = enabled;
    if (format) {
      this.autoExportFormat = format;
    }
    await this.saveSettings();
    console.log('[ExportManager] Auto-export:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Export conversation when completed
   * Called by integrations when a conversation is finished
   */
  async onConversationCompleted(conversationId: string): Promise<void> {
    if (!this.autoExportEnabled) {
      return;
    }

    console.log('[ExportManager] Auto-exporting completed conversation:', conversationId);
    
    try {
      await this.exportConversation(conversationId, {
        format: this.autoExportFormat,
        includeMetadata: true
      });
    } catch (error) {
      console.error('[ExportManager] Error auto-exporting conversation:', error);
    }
  }

  /**
   * Export a single conversation
   */
  async exportConversation(
    conversationId: string, 
    options: ExportOptions = { format: 'json' }
  ): Promise<void> {
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const fileName = options.fileName || this.generateFileName(conversation, options.format);
    const content = this.formatConversation(conversation, options);
    
    await this.downloadFile(content, fileName);
    
    // Track export in history
    this.addToExportHistory({
      id: `export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      conversationId,
      format: options.format,
      timestamp: Date.now(),
      fileName
    });

    console.log('[ExportManager] Exported conversation:', conversationId, 'as', fileName);
  }

  /**
   * Export multiple conversations
   */
  async exportConversations(
    conversationIds: string[], 
    options: ExportOptions = { format: 'json' }
  ): Promise<void> {
    console.log('[ExportManager] Bulk exporting conversations:', conversationIds.length);
    
    const conversations: Conversation[] = [];
    for (const id of conversationIds) {
      const conversation = await db.getConversation(id);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    const fileName = options.fileName || `conversations_export_${Date.now()}.${this.getFileExtension(options.format)}`;
    const content = this.formatConversations(conversations, options);
    
    await this.downloadFile(content, fileName);
    
    console.log('[ExportManager] Bulk export complete:', fileName);
  }

  /**
   * Format a single conversation based on export format
   */
  private formatConversation(conversation: Conversation, options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.formatAsJSON(conversation, options.includeMetadata);
      case 'markdown':
        return this.formatAsMarkdown(conversation, options.includeMetadata);
      case 'text':
        return this.formatAsText(conversation, options.includeMetadata);
      case 'html':
        return this.formatAsHTML(conversation, options.includeMetadata);
      default:
        return this.formatAsJSON(conversation, options.includeMetadata);
    }
  }

  /**
   * Format multiple conversations
   */
  private formatConversations(conversations: Conversation[], options: ExportOptions): string {
    if (options.format === 'json') {
      return JSON.stringify(conversations, null, 2);
    }

    // For other formats, concatenate individual exports
    return conversations.map(conv => this.formatConversation(conv, options)).join('\n\n---\n\n');
  }

  /**
   * Format as JSON
   */
  private formatAsJSON(conversation: Conversation, includeMetadata = true): string {
    if (includeMetadata) {
      return JSON.stringify(conversation, null, 2);
    }

    // Export only messages without metadata
    return JSON.stringify({
      title: conversation.title,
      messages: conversation.messages
    }, null, 2);
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(conversation: Conversation, includeMetadata = true): string {
    let markdown = `# ${conversation.title}\n\n`;

    if (includeMetadata) {
      markdown += `**Model:** ${conversation.model}\n`;
      markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      markdown += `**Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      if (conversation.totalTokens) {
        markdown += `**Total Tokens:** ${conversation.totalTokens}\n`;
      }
      markdown += '\n---\n\n';
    }

    for (const message of conversation.messages) {
      const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
      markdown += `## ${role}\n\n${message.content}\n\n`;
      
      if (message.attachments && message.attachments.length > 0) {
        markdown += '**Attachments:**\n';
        for (const attachment of message.attachments) {
          markdown += `- ${attachment.name} (${attachment.type})\n`;
        }
        markdown += '\n';
      }
    }

    return markdown;
  }

  /**
   * Format as plain text
   */
  private formatAsText(conversation: Conversation, includeMetadata = true): string {
    let text = `${conversation.title}\n${'='.repeat(conversation.title.length)}\n\n`;

    if (includeMetadata) {
      text += `Model: ${conversation.model}\n`;
      text += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
      text += `Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      if (conversation.totalTokens) {
        text += `Total Tokens: ${conversation.totalTokens}\n`;
      }
      text += '\n' + '-'.repeat(50) + '\n\n';
    }

    for (const message of conversation.messages) {
      const role = message.role.toUpperCase();
      text += `[${role}]\n${message.content}\n\n`;
      
      if (message.attachments && message.attachments.length > 0) {
        text += 'Attachments:\n';
        for (const attachment of message.attachments) {
          text += `  - ${attachment.name} (${attachment.type})\n`;
        }
        text += '\n';
      }
    }

    return text;
  }

  /**
   * Format as HTML
   */
  private formatAsHTML(conversation: Conversation, includeMetadata = true): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(conversation.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .metadata {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .message {
      margin: 20px 0;
      padding: 15px;
      border-radius: 5px;
    }
    .user {
      background: #e3f2fd;
    }
    .assistant {
      background: #f5f5f5;
    }
    .system {
      background: #fff3e0;
    }
    .role {
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-size: 0.9em;
    }
    .content {
      white-space: pre-wrap;
    }
    .attachments {
      margin-top: 10px;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(conversation.title)}</h1>
`;

    if (includeMetadata) {
      html += `  <div class="metadata">
    <p><strong>Model:</strong> ${this.escapeHtml(conversation.model)}</p>
    <p><strong>Created:</strong> ${new Date(conversation.createdAt).toLocaleString()}</p>
    <p><strong>Updated:</strong> ${new Date(conversation.updatedAt).toLocaleString()}</p>`;
      
      if (conversation.totalTokens) {
        html += `    <p><strong>Total Tokens:</strong> ${conversation.totalTokens}</p>`;
      }
      
      html += `  </div>\n`;
    }

    for (const message of conversation.messages) {
      html += `  <div class="message ${message.role}">
    <div class="role">${this.escapeHtml(message.role)}</div>
    <div class="content">${this.escapeHtml(message.content)}</div>`;
      
      if (message.attachments && message.attachments.length > 0) {
        html += `    <div class="attachments">
      <strong>Attachments:</strong><br>`;
        for (const attachment of message.attachments) {
          html += `      • ${this.escapeHtml(attachment.name)} (${this.escapeHtml(attachment.type)})<br>`;
        }
        html += `    </div>`;
      }
      
      html += `  </div>\n`;
    }

    html += `</body>
</html>`;

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    // Use a more robust escaping method that doesn't rely on DOM
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
   * Generate a filename for the export
   */
  private generateFileName(conversation: Conversation, format: ExportFormat): string {
    let sanitizedTitle = conversation.title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase()
      .substring(0, 50);
    
    // Ensure we have a valid filename
    if (!sanitizedTitle || sanitizedTitle.length === 0) {
      sanitizedTitle = 'conversation';
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getFileExtension(format);
    
    return `${sanitizedTitle}_${timestamp}.${extension}`;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return 'json';
      case 'markdown':
        return 'md';
      case 'text':
        return 'txt';
      case 'html':
        return 'html';
      default:
        return 'txt';
    }
  }

  /**
   * Download file to user's computer
   */
  private async downloadFile(content: string, fileName: string): Promise<void> {
    // Determine appropriate MIME type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'text/plain';
    
    switch (extension) {
      case 'json':
        mimeType = 'application/json';
        break;
      case 'html':
        mimeType = 'text/html';
        break;
      case 'md':
        mimeType = 'text/markdown';
        break;
      case 'txt':
        mimeType = 'text/plain';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    try {
      // Use Chrome downloads API if available
      if (chrome?.downloads) {
        try {
          await chrome.downloads.download({
            url: url,
            filename: fileName,
            saveAs: true
          });
        } catch (downloadError) {
          console.error('[ExportManager] Chrome downloads API failed:', downloadError);
          // Fall back to DOM method if downloads API fails
          this.downloadViaDomLink(url, fileName);
        }
      } else {
        // Fallback to creating a download link
        this.downloadViaDomLink(url, fileName);
      }
    } finally {
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Download file using DOM link element (fallback method)
   */
  private downloadViaDomLink(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Add export to history
   */
  private addToExportHistory(record: ExportRecord): void {
    this.exportHistory.push(record);
    
    // Keep only last 100 exports in memory
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(-100);
    }
  }

  /**
   * Get export history
   */
  getExportHistory(): ExportRecord[] {
    return [...this.exportHistory];
  }

  /**
   * Get export history for a specific conversation
   */
  getConversationExportHistory(conversationId: string): ExportRecord[] {
    return this.exportHistory.filter(record => record.conversationId === conversationId);
  }

  /**
   * Clear export history
   */
  clearExportHistory(): void {
    this.exportHistory = [];
    console.log('[ExportManager] Export history cleared');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    console.log('[ExportManager] Destroying');
    this.exportHistory = [];
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
