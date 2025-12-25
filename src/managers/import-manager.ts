/**
 * Import Manager
 * 
 * Handles importing conversations from various formats:
 * - JSON (native format)
 * - Markdown with metadata
 * - ChatGPT export format
 * - Plain text
 * 
 * Validates and processes imported data.
 */

import type { Conversation, ConversationMessage } from '../content/types';
import { db } from '../data/database';

export type ImportFormat = 'json' | 'markdown' | 'chatgpt' | 'txt';

export interface ImportOptions {
  format: ImportFormat;
  generateNewIds?: boolean;
  preserveFolders?: boolean;
}

export interface ImportResult {
  success: boolean;
  conversationsImported?: number;
  conversations?: Conversation[];
  error?: string;
  warnings?: string[];
}

export class ImportManager {
  /**
   * Import conversations from a file
   */
  async importFromFile(
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      const content = await this.readFile(file);
      return this.importFromString(content, options);
    } catch (error) {
      console.error('[ImportManager] Import failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Import conversations from a string
   */
  async importFromString(
    content: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      let conversations: Conversation[];
      const warnings: string[] = [];

      switch (options.format) {
        case 'json':
          conversations = this.parseJSON(content, warnings);
          break;
        case 'markdown':
          conversations = this.parseMarkdown(content, warnings);
          break;
        case 'chatgpt':
          conversations = this.parseChatGPT(content, warnings);
          break;
        case 'txt':
          conversations = this.parseText(content, warnings);
          break;
        default:
          return { success: false, error: 'Unsupported import format' };
      }

      if (conversations.length === 0) {
        return { success: false, error: 'No valid conversations found in file' };
      }

      // Validate and process conversations
      const processedConversations = this.processConversations(
        conversations,
        options
      );

      // Save to database
      for (const conversation of processedConversations) {
        await db.saveConversation(conversation);
      }

      console.log(`[ImportManager] Imported ${processedConversations.length} conversations`);

      return {
        success: true,
        conversationsImported: processedConversations.length,
        conversations: processedConversations,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('[ImportManager] Import failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Parse JSON format
   */
  private parseJSON(content: string, warnings: string[]): Conversation[] {
    try {
      const data = JSON.parse(content);
      
      // Check if it's our export format
      if (data.version && data.conversations) {
        return this.validateConversations(data.conversations, warnings);
      }
      
      // Check if it's a single conversation
      if (data.id && data.messages) {
        return this.validateConversations([data], warnings);
      }
      
      // Check if it's an array of conversations
      if (Array.isArray(data)) {
        return this.validateConversations(data, warnings);
      }
      
      warnings.push('Unrecognized JSON format');
      return [];
    } catch (error) {
      warnings.push(`Failed to parse JSON: ${error}`);
      return [];
    }
  }

  /**
   * Parse Markdown with metadata
   */
  private parseMarkdown(content: string, warnings: string[]): Conversation[] {
    const conversations: Conversation[] = [];
    
    // Split by conversation separator
    const sections = content.split(/\n---\n/).filter(s => s.trim());
    
    for (const section of sections) {
      try {
        const conversation = this.parseMarkdownSection(section);
        if (conversation) {
          conversations.push(conversation);
        }
      } catch (error) {
        warnings.push(`Failed to parse markdown section: ${error}`);
      }
    }
    
    return conversations;
  }

  /**
   * Parse a single Markdown section
   */
  private parseMarkdownSection(content: string): Conversation | null {
    const lines = content.split('\n');
    let title = 'Imported Conversation';
    let model = 'unknown';
    let createdAt = Date.now();
    let metadata: any = {};
    const messages: ConversationMessage[] = [];
    
    // Check for YAML frontmatter (Obsidian format)
    if (content.startsWith('---')) {
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd > 0) {
        const frontmatter = content.slice(3, frontmatterEnd);
        metadata = this.parseYAMLFrontmatter(frontmatter);
        
        title = metadata.title || title;
        model = metadata.model || model;
        if (metadata.created) {
          createdAt = new Date(metadata.created).getTime();
        }
        
        // Remove frontmatter from content
        content = content.slice(frontmatterEnd + 3);
      }
    }
    
    // Parse messages
    let currentRole: 'user' | 'assistant' | 'system' = 'user';
    let currentContent = '';
    
    const messageRegex = /^##\s*(👤\s*User|🤖\s*Assistant|User|Assistant)/i;
    const blockRegex = /^>\s*\[!(\w+)\]/i;
    
    for (const line of content.split('\n')) {
      // Check for message header
      const headerMatch = line.match(messageRegex);
      if (headerMatch) {
        // Save previous message
        if (currentContent.trim()) {
          messages.push({
            id: `msg_${Date.now()}_${messages.length}`,
            role: currentRole,
            content: currentContent.trim(),
            timestamp: Date.now(),
          });
        }
        
        // Start new message
        currentRole = headerMatch[0].toLowerCase().includes('user') ? 'user' : 'assistant';
        currentContent = '';
        continue;
      }
      
      // Check for Obsidian callout format
      const blockMatch = line.match(blockRegex);
      if (blockMatch) {
        // Save previous message
        if (currentContent.trim()) {
          messages.push({
            id: `msg_${Date.now()}_${messages.length}`,
            role: currentRole,
            content: currentContent.trim(),
            timestamp: Date.now(),
          });
        }
        
        // Start new message
        currentRole = blockMatch[1].toLowerCase() === 'user' ? 'user' : 'assistant';
        currentContent = '';
        continue;
      }
      
      // Extract title from first heading
      if (line.startsWith('# ') && !title) {
        title = line.slice(2).trim();
        continue;
      }
      
      // Add to current message content
      if (line.startsWith('> ')) {
        currentContent += line.slice(2) + '\n';
      } else if (line.trim() && !line.startsWith('**') && !line.startsWith('###')) {
        currentContent += line + '\n';
      }
    }
    
    // Save last message
    if (currentContent.trim()) {
      messages.push({
        id: `msg_${Date.now()}_${messages.length}`,
        role: currentRole,
        content: currentContent.trim(),
        timestamp: Date.now(),
      });
    }
    
    if (messages.length === 0) {
      return null;
    }
    
    return {
      id: `conv_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      model,
      createdAt,
      updatedAt: Date.now(),
      messages,
      isArchived: false,
      isFavorite: false,
      tags: metadata.tags || [],
    };
  }

  /**
   * Parse YAML frontmatter
   */
  private parseYAMLFrontmatter(yaml: string): any {
    const metadata: any = {};
    
    for (const line of yaml.split('\n')) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key.trim()] = value
            .slice(1, -1)
            .split(',')
            .map(v => v.trim());
        } else {
          metadata[key.trim()] = value;
        }
      }
    }
    
    return metadata;
  }

  /**
   * Parse ChatGPT export format
   */
  private parseChatGPT(content: string, warnings: string[]): Conversation[] {
    try {
      const data = JSON.parse(content);
      const conversations: Conversation[] = [];
      
      // ChatGPT export format has different structures
      // Try to detect and parse
      
      // Format 1: Array of conversations
      if (Array.isArray(data)) {
        for (const item of data) {
          const conv = this.convertChatGPTConversation(item);
          if (conv) {
            conversations.push(conv);
          }
        }
      }
      
      // Format 2: Single conversation
      else if (data.mapping || data.messages) {
        const conv = this.convertChatGPTConversation(data);
        if (conv) {
          conversations.push(conv);
        }
      }
      
      return conversations;
    } catch (error) {
      warnings.push(`Failed to parse ChatGPT export: ${error}`);
      return [];
    }
  }

  /**
   * Convert ChatGPT conversation to our format
   */
  private convertChatGPTConversation(data: any): Conversation | null {
    try {
      const messages: ConversationMessage[] = [];
      
      // Extract messages from mapping structure
      if (data.mapping) {
        const messageIds = Object.keys(data.mapping);
        for (const id of messageIds) {
          const node = data.mapping[id];
          if (node.message && node.message.content) {
            const content = node.message.content;
            if (content.parts && content.parts.length > 0) {
              messages.push({
                id: node.message.id || `msg_${Date.now()}_${messages.length}`,
                role: node.message.author?.role || 'user',
                content: content.parts.join('\n'),
                timestamp: node.message.create_time 
                  ? new Date(node.message.create_time * 1000).getTime()
                  : Date.now(),
              });
            }
          }
        }
      }
      
      // Extract messages from messages array
      else if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          messages.push({
            id: msg.id || `msg_${Date.now()}_${messages.length}`,
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: msg.timestamp || Date.now(),
          });
        }
      }
      
      if (messages.length === 0) {
        return null;
      }
      
      return {
        id: data.id || `conv_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title || 'Imported from ChatGPT',
        model: data.model || 'gpt-3.5-turbo',
        createdAt: data.create_time 
          ? new Date(data.create_time * 1000).getTime()
          : Date.now(),
        updatedAt: data.update_time 
          ? new Date(data.update_time * 1000).getTime()
          : Date.now(),
        messages,
        isArchived: false,
        isFavorite: false,
      };
    } catch (error) {
      console.error('Failed to convert ChatGPT conversation:', error);
      return null;
    }
  }

  /**
   * Parse plain text format
   */
  private parseText(content: string, warnings: string[]): Conversation[] {
    const conversations: Conversation[] = [];
    
    // Split by conversation separator
    const sections = content.split(/\n---\n/).filter(s => s.trim());
    
    for (const section of sections) {
      try {
        const conversation = this.parseTextSection(section);
        if (conversation) {
          conversations.push(conversation);
        }
      } catch (error) {
        warnings.push(`Failed to parse text section: ${error}`);
      }
    }
    
    return conversations;
  }

  /**
   * Parse a plain text section
   */
  private parseTextSection(content: string): Conversation | null {
    const lines = content.split('\n');
    let title = 'Imported Conversation';
    const messages: ConversationMessage[] = [];
    
    let currentRole: 'user' | 'assistant' | 'system' = 'user';
    let currentContent = '';
    
    for (const line of lines) {
      // Check for role markers
      const roleMatch = line.match(/^\[(USER|ASSISTANT|SYSTEM)\]/i);
      if (roleMatch) {
        // Save previous message
        if (currentContent.trim()) {
          messages.push({
            id: `msg_${Date.now()}_${messages.length}`,
            role: currentRole,
            content: currentContent.trim(),
            timestamp: Date.now(),
          });
        }
        
        // Start new message
        currentRole = roleMatch[1].toLowerCase() as 'user' | 'assistant' | 'system';
        currentContent = '';
        continue;
      }
      
      // Check for title (first line with equals signs below)
      if (line.match(/^=+$/) && lines.indexOf(line) > 0) {
        title = lines[lines.indexOf(line) - 1].trim();
        continue;
      }
      
      // Add to current content
      if (line.trim() && !line.match(/^=+$/) && !line.match(/^Model:/i) && !line.match(/^Created:/i)) {
        currentContent += line + '\n';
      }
    }
    
    // Save last message
    if (currentContent.trim()) {
      messages.push({
        id: `msg_${Date.now()}_${messages.length}`,
        role: currentRole,
        content: currentContent.trim(),
        timestamp: Date.now(),
      });
    }
    
    if (messages.length === 0) {
      return null;
    }
    
    return {
      id: `conv_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      model: 'unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages,
      isArchived: false,
      isFavorite: false,
    };
  }

  /**
   * Validate conversations
   */
  private validateConversations(
    conversations: any[],
    warnings: string[]
  ): Conversation[] {
    const valid: Conversation[] = [];
    
    for (const conv of conversations) {
      try {
        // Validate required fields
        if (!conv.id || !conv.title || !conv.messages) {
          warnings.push(`Skipping invalid conversation: missing required fields`);
          continue;
        }
        
        // Validate messages
        if (!Array.isArray(conv.messages) || conv.messages.length === 0) {
          warnings.push(`Skipping conversation "${conv.title}": no valid messages`);
          continue;
        }
        
        // Ensure all required message fields exist
        const validMessages = conv.messages.filter((msg: any) => 
          msg.content && msg.role
        );
        
        if (validMessages.length === 0) {
          warnings.push(`Skipping conversation "${conv.title}": no valid messages`);
          continue;
        }
        
        valid.push({
          ...conv,
          messages: validMessages.map((msg: any) => ({
            id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || Date.now(),
            attachments: msg.attachments || undefined,
            streaming: msg.streaming || undefined,
            tokens: msg.tokens || undefined,
          })),
          createdAt: conv.createdAt || Date.now(),
          updatedAt: conv.updatedAt || Date.now(),
          isArchived: conv.isArchived || false,
          isFavorite: conv.isFavorite || false,
        });
      } catch (error) {
        warnings.push(`Error validating conversation: ${error}`);
      }
    }
    
    return valid;
  }

  /**
   * Process conversations before import
   */
  private processConversations(
    conversations: Conversation[],
    options: ImportOptions
  ): Conversation[] {
    return conversations.map(conv => {
      const processed = { ...conv };
      
      // Generate new IDs if requested
      if (options.generateNewIds) {
        processed.id = `conv_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        processed.messages = processed.messages.map((msg, idx) => ({
          ...msg,
          id: `msg_${Date.now()}_${idx}`,
        }));
      }
      
      // Clear folder if not preserving folders
      if (!options.preserveFolders) {
        processed.folderId = undefined;
      }
      
      // Update timestamps
      processed.updatedAt = Date.now();
      
      return processed;
    });
  }

  /**
   * Read file content
   */
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
}

// Export singleton instance
export const importManager = new ImportManager();
