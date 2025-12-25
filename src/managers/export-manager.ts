/**
 * Export Manager
 * 
 * Manages conversation export operations:
 * - Export conversations in multiple formats (JSON, Markdown, Text, HTML)
 * - Auto-export on conversation completion
 * - Bulk export operations
 * - Export history tracking
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
  <title>${this.escapeHtml(conversation.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
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
