/**
 * Database module using DexieJS for IndexedDB
 * 
 * This module provides:
 * - Database schema definition
 * - Conversation storage and retrieval
 * - Folder management
 * - Efficient querying with indexes
 * - Caching for improved performance
 * - Batch operations
 */

import Dexie, { Table } from 'dexie';
import type { Conversation, Folder, ConversationLink } from '../content/types';

/**
 * BetterGPT Database class
 */
export class BetterGPTDatabase extends Dexie {
  // Tables
  conversations!: Table<Conversation, string>;
  folders!: Table<Folder, string>;
  
  // Cache
  private cache = new DatabaseCache();

  constructor() {
    super('BetterGPTDB');

    // Define database schema - version 1
    this.version(1).stores({
      conversations: 'id, title, model, createdAt, updatedAt, folderId, parentId, isArchived, isFavorite, *tags',
      folders: 'id, name, parentId, createdAt, updatedAt'
    });

    // Version 2: Add conversation links table
    this.version(2).stores({
      conversations: 'id, title, model, createdAt, updatedAt, folderId, parentId, isArchived, isFavorite, *tags',
      folders: 'id, name, parentId, createdAt, updatedAt',
      conversationLinks: 'id, sourceId, targetId, type, createdAt'
    });
  }

  /**
   * Save a conversation (with cache invalidation)
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.conversations.put(conversation);
    this.cache.invalidate(conversation.id, 'conversation');
    this.cache.invalidateAll('query');
  }

  /**
   * Save multiple conversations in batch
   */
  async saveConversationsBatch(conversations: Conversation[]): Promise<void> {
    await this.conversations.bulkPut(conversations);
    conversations.forEach(conv => this.cache.invalidate(conv.id, 'conversation'));
    this.cache.invalidateAll('query');
  }

  /**
   * Get a conversation by ID (with caching)
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    const cached = this.cache.get(id, 'conversation');
    if (cached) {
      return cached;
    }
    
    const conversation = await this.conversations.get(id);
    if (conversation) {
      this.cache.set(id, conversation, 'conversation');
    }
    
    return conversation;
  }

  /**
   * Get all conversations (with pagination support)
   */
  async getAllConversations(limit?: number, offset?: number): Promise<Conversation[]> {
    const query = this.conversations.orderBy('updatedAt').reverse();
    
    if (limit !== undefined) {
      if (offset) {
        return await query.offset(offset).limit(limit).toArray();
      }
      return await query.limit(limit).toArray();
    }
    
    return await query.toArray();
  }

  /**
   * Get conversations count
   */
  async getConversationsCount(): Promise<number> {
    return await this.conversations.count();
  }

  /**
   * Get conversations in a folder (with caching)
   */
  async getConversationsByFolder(folderId: string, limit?: number): Promise<Conversation[]> {
    const cacheKey = `folder:${folderId}:${limit || 'all'}`;
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    let query = this.conversations
      .where('folderId')
      .equals(folderId)
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query.toArray();
    this.cache.set(cacheKey, results, 'query');
    
    return results;
  }

  /**
   * Get favorite conversations (with caching)
   */
  async getFavoriteConversations(limit?: number): Promise<Conversation[]> {
    const cacheKey = `favorites:${limit || 'all'}`;
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    let query = this.conversations
      .where('isFavorite')
      .equals(true)
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query.toArray();
    this.cache.set(cacheKey, results, 'query');
    
    return results;
  }

  /**
   * Get archived conversations (with caching)
   */
  async getArchivedConversations(limit?: number): Promise<Conversation[]> {
    const cacheKey = `archived:${limit || 'all'}`;
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    let query = this.conversations
      .where('isArchived')
      .equals(true)
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query.toArray();
    this.cache.set(cacheKey, results, 'query');
    
    return results;
  }

  /**
   * Get non-archived conversations (with caching)
   */
  async getActiveConversations(limit?: number): Promise<Conversation[]> {
    const cacheKey = `active:${limit || 'all'}`;
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    let query = this.conversations
      .where('isArchived')
      .equals(false)
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query.toArray();
    this.cache.set(cacheKey, results, 'query');
    
    return results;
  }

  /**
   * Update conversation metadata (with cache invalidation)
   */
  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    await this.conversations.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
    this.cache.invalidate(id, 'conversation');
    this.cache.invalidateAll('query');
  }

  /**
   * Update multiple conversations in batch
   */
  async updateConversationsBatch(updates: Array<{ id: string; changes: Partial<Conversation> }>): Promise<void> {
    await this.transaction('rw', this.conversations, async () => {
      for (const { id, changes } of updates) {
        await this.conversations.update(id, {
          ...changes,
          updatedAt: Date.now()
        });
      }
    });
    
    updates.forEach(({ id }) => this.cache.invalidate(id, 'conversation'));
    this.cache.invalidateAll('query');
  }

  /**
   * Delete a conversation (with cache invalidation)
   */
  async deleteConversation(id: string): Promise<void> {
    await this.conversations.delete(id);
    this.cache.invalidate(id, 'conversation');
    this.cache.invalidateAll('query');
  }

  /**
   * Delete multiple conversations (optimized)
   */
  async deleteConversations(ids: string[]): Promise<void> {
    await this.conversations.bulkDelete(ids);
    ids.forEach(id => this.cache.invalidate(id, 'conversation'));
    this.cache.invalidateAll('query');
  }

  /**
   * Archive/unarchive a conversation (with cache invalidation)
   */
  async setConversationArchived(id: string, isArchived: boolean): Promise<void> {
    await this.updateConversation(id, { isArchived });
  }

  /**
   * Favorite/unfavorite a conversation (with cache invalidation)
   */
  async setConversationFavorite(id: string, isFavorite: boolean): Promise<void> {
    await this.updateConversation(id, { isFavorite });
  }

  /**
   * Move conversation to a folder (with cache invalidation)
   */
  async moveConversationToFolder(conversationId: string, folderId?: string): Promise<void> {
    await this.updateConversation(conversationId, { folderId });
  }

  /**
   * Search conversations by title or content (optimized with pagination)
   */
  async searchConversations(query: string, limit: number = 50, offset: number = 0): Promise<Conversation[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const cacheKey = `search:${query}:${limit}:${offset}`;
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    const lowerQuery = query.toLowerCase();
    const results: Conversation[] = [];
    let skipped = 0;
    
    // Use efficient database cursor instead of loading all at once
    await this.conversations.each(conv => {
      // Stop if we've reached the limit
      if (results.length >= limit) {
        return false; // Break the iteration
      }
      
      // Check if matches
      const titleMatch = conv.title.toLowerCase().includes(lowerQuery);
      const messageMatch = conv.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
      
      if (titleMatch || messageMatch) {
        // Skip results for pagination
        if (skipped < offset) {
          skipped++;
          return;
        }
        
        results.push(conv);
      }
    });
    
    this.cache.set(cacheKey, results, 'query');
    return results;
  }

  /**
   * Save a folder (with cache invalidation)
   */
  async saveFolder(folder: Folder): Promise<void> {
    await this.folders.put(folder);
    this.cache.invalidate(folder.id, 'folder');
    this.cache.invalidateAll('query');
  }

  /**
   * Get a folder by ID (with caching)
   */
  async getFolder(id: string): Promise<Folder | undefined> {
    const cached = this.cache.get(id, 'folder');
    if (cached) {
      return cached;
    }
    
    const folder = await this.folders.get(id);
    if (folder) {
      this.cache.set(id, folder, 'folder');
    }
    
    return folder;
  }

  /**
   * Get all folders (with caching)
   */
  async getAllFolders(): Promise<Folder[]> {
    const cacheKey = 'all-folders';
    const cached = this.cache.get(cacheKey, 'query');
    if (cached) {
      return cached;
    }
    
    const results = await this.folders.toArray();
    this.cache.set(cacheKey, results, 'query');
    
    return results;
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
   * Update folder (with cache invalidation)
   */
  async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
    await this.folders.update(id, {
      ...updates,
      updatedAt: Date.now()
    });
    this.cache.invalidate(id, 'folder');
    this.cache.invalidateAll('query');
  }

  /**
   * Delete a folder (with cache invalidation)
   */
  async deleteFolder(id: string): Promise<void> {
    // Move conversations in this folder to no folder
    const conversations = await this.getConversationsByFolder(id);
    for (const conv of conversations) {
      await this.moveConversationToFolder(conv.id, undefined);
    }
    
    // Delete the folder
    await this.folders.delete(id);
    this.cache.invalidate(id, 'folder');
    this.cache.invalidateAll('query');
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.invalidateAll();
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

  /**
   * Save a conversation link
   */
  async saveConversationLink(link: ConversationLink): Promise<void> {
    await this.conversationLinks.put(link);
  }

  /**
   * Get links for a conversation (both source and target)
   */
  async getConversationLinks(conversationId: string): Promise<ConversationLink[]> {
    const sourceLinks = await this.conversationLinks
      .where('sourceId')
      .equals(conversationId)
      .toArray();
    
    const targetLinks = await this.conversationLinks
      .where('targetId')
      .equals(conversationId)
      .toArray();
    
    return [...sourceLinks, ...targetLinks];
  }

  /**
   * Get outgoing links from a conversation
   */
  async getOutgoingLinks(conversationId: string): Promise<ConversationLink[]> {
    return await this.conversationLinks
      .where('sourceId')
      .equals(conversationId)
      .toArray();
  }

  /**
   * Get incoming links to a conversation
   */
  async getIncomingLinks(conversationId: string): Promise<ConversationLink[]> {
    return await this.conversationLinks
      .where('targetId')
      .equals(conversationId)
      .toArray();
  }

  /**
   * Delete a conversation link
   */
  async deleteConversationLink(linkId: string): Promise<void> {
    await this.conversationLinks.delete(linkId);
  }

  /**
   * Delete all links for a conversation
   */
  async deleteConversationLinks(conversationId: string): Promise<void> {
    const links = await this.getConversationLinks(conversationId);
    const linkIds = links.map(link => link.id);
    await this.conversationLinks.bulkDelete(linkIds);
  }
}

// Create and export a singleton instance
export const db = new BetterGPTDatabase();
