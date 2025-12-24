/**
 * Database module using DexieJS for IndexedDB
 * 
 * This module provides:
 * - Database schema definition
 * - Conversation storage and retrieval
 * - Folder management
 * - Efficient querying with indexes
 */

import Dexie, { Table } from 'dexie';
import type { Conversation, Folder } from '../content/types';

/**
 * BetterGPT Database class
 */
export class BetterGPTDatabase extends Dexie {
  // Tables
  conversations!: Table<Conversation, string>;
  folders!: Table<Folder, string>;

  constructor() {
    super('BetterGPTDB');

    // Define database schema
    this.version(1).stores({
      conversations: 'id, title, model, createdAt, updatedAt, folderId, parentId, isArchived, isFavorite, *tags',
      folders: 'id, name, parentId, createdAt, updatedAt'
    });
  }

  /**
   * Save a conversation
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.conversations.put(conversation);
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    return await this.conversations.get(id);
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Conversation[]> {
    return await this.conversations.toArray();
  }

  /**
   * Get conversations in a folder
   */
  async getConversationsByFolder(folderId: string): Promise<Conversation[]> {
    return await this.conversations
      .where('folderId')
      .equals(folderId)
      .toArray();
  }

  /**
   * Get favorite conversations
   */
  async getFavoriteConversations(): Promise<Conversation[]> {
    return await this.conversations
      .where('isFavorite')
      .equals(true)
      .toArray();
  }

  /**
   * Get archived conversations
   */
  async getArchivedConversations(): Promise<Conversation[]> {
    return await this.conversations
      .where('isArchived')
      .equals(true)
      .toArray();
  }

  /**
   * Get non-archived conversations
   */
  async getActiveConversations(): Promise<Conversation[]> {
    return await this.conversations
      .where('isArchived')
      .equals(false)
      .toArray();
  }

  /**
   * Update conversation metadata
   */
  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await this.conversations.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await this.conversations.delete(id);
  }

  /**
   * Delete multiple conversations
   */
  async deleteConversations(ids: string[]): Promise<void> {
    await this.conversations.bulkDelete(ids);
  }

  /**
   * Archive/unarchive a conversation
   */
  async setConversationArchived(id: string, isArchived: boolean): Promise<void> {
    await this.updateConversation(id, { isArchived });
  }

  /**
   * Favorite/unfavorite a conversation
   */
  async setConversationFavorite(id: string, isFavorite: boolean): Promise<void> {
    await this.updateConversation(id, { isFavorite });
  }

  /**
   * Move conversation to a folder
   */
  async moveConversationToFolder(conversationId: string, folderId?: string): Promise<void> {
    await this.updateConversation(conversationId, { folderId });
  }

  /**
   * Search conversations by title or content
   * Note: For better performance with large datasets, consider implementing
   * a more sophisticated search solution with pagination or indexing
   */
  async searchConversations(query: string, limit: number = 100): Promise<Conversation[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    const results: Conversation[] = [];
    
    // Use efficient database cursor instead of loading all at once
    await this.conversations.each(conv => {
      // Stop if we've reached the limit
      if (results.length >= limit) {
        return false; // Break the iteration
      }
      
      // Search in title
      if (conv.title.toLowerCase().includes(lowerQuery)) {
        results.push(conv);
        return;
      }
      
      // Search in message content
      const hasMatchingMessage = conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
      
      if (hasMatchingMessage) {
        results.push(conv);
      }
    });
    
    return results;
  }

  /**
   * Save a folder
   */
  async saveFolder(folder: Folder): Promise<void> {
    await this.folders.put(folder);
  }

  /**
   * Get a folder by ID
   */
  async getFolder(id: string): Promise<Folder | undefined> {
    return await this.folders.get(id);
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<Folder[]> {
    return await this.folders.toArray();
  }

  /**
   * Get root folders (no parent)
   */
  async getRootFolders(): Promise<Folder[]> {
    const allFolders = await this.folders.toArray();
    return allFolders.filter(folder => !folder.parentId || folder.parentId === '');
  }

  /**
   * Get child folders
   */
  async getChildFolders(parentId: string): Promise<Folder[]> {
    return await this.folders
      .where('parentId')
      .equals(parentId)
      .toArray();
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
    await this.folders.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  /**
   * Delete a folder
   */
  async deleteFolder(id: string): Promise<void> {
    // Move conversations in this folder to no folder
    const conversations = await this.getConversationsByFolder(id);
    for (const conv of conversations) {
      await this.moveConversationToFolder(conv.id, undefined);
    }
    
    // Delete the folder
    await this.folders.delete(id);
  }

  /**
   * Get conversation threads (parent-child relationships)
   */
  async getConversationThreads(parentId: string): Promise<Conversation[]> {
    return await this.conversations
      .where('parentId')
      .equals(parentId)
      .toArray();
  }
}

// Create and export a singleton instance
export const db = new BetterGPTDatabase();
