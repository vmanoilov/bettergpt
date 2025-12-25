/**
 * Conversation Manager
 * 
 * Manages conversation operations:
 * - Archive/unarchive
 * - Favorite/unfavorite
 * - Bulk operations
 * - Thread relationships
 * - Auto-save
 */

import type { Conversation, Folder } from '../content/types';
import { db } from '../data/database';

export class ConversationManager {
  private autoSaveEnabled = true;
  private autoSaveInterval = 5000; // 5 seconds
  private autoSaveTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize conversation manager
   */
  initialize(): void {
    console.log('[ConversationManager] Initializing');
    
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, this.autoSaveInterval);

    console.log('[ConversationManager] Auto-save started');
  }

  /**
   * Perform auto-save
   */
  private async performAutoSave(): Promise<void> {
    // This would be triggered by conversation changes
    // For now, it's a placeholder for future implementation
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    console.log('[ConversationManager] Archiving conversation:', conversationId);
    await db.setConversationArchived(conversationId, true);
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string): Promise<void> {
    console.log('[ConversationManager] Unarchiving conversation:', conversationId);
    await db.setConversationArchived(conversationId, false);
  }

  /**
   * Favorite a conversation
   */
  async favoriteConversation(conversationId: string): Promise<void> {
    console.log('[ConversationManager] Favoriting conversation:', conversationId);
    await db.setConversationFavorite(conversationId, true);
  }

  /**
   * Unfavorite a conversation
   */
  async unfavoriteConversation(conversationId: string): Promise<void> {
    console.log('[ConversationManager] Unfavoriting conversation:', conversationId);
    await db.setConversationFavorite(conversationId, false);
  }

  /**
   * Move conversation to folder
   */
  async moveToFolder(conversationId: string, folderId: string): Promise<void> {
    console.log('[ConversationManager] Moving conversation to folder:', conversationId, folderId);
    await db.moveConversationToFolder(conversationId, folderId);
  }

  /**
   * Remove conversation from folder
   */
  async removeFromFolder(conversationId: string): Promise<void> {
    console.log('[ConversationManager] Removing conversation from folder:', conversationId);
    await db.moveConversationToFolder(conversationId, undefined);
  }

  /**
   * Bulk archive conversations
   */
  async bulkArchive(conversationIds: string[]): Promise<void> {
    console.log('[ConversationManager] Bulk archiving conversations:', conversationIds.length);
    
    for (const id of conversationIds) {
      await db.setConversationArchived(id, true);
    }
  }

  /**
   * Bulk unarchive conversations
   */
  async bulkUnarchive(conversationIds: string[]): Promise<void> {
    console.log('[ConversationManager] Bulk unarchiving conversations:', conversationIds.length);
    
    for (const id of conversationIds) {
      await db.setConversationArchived(id, false);
    }
  }

  /**
   * Bulk delete conversations
   */
  async bulkDelete(conversationIds: string[]): Promise<void> {
    console.log('[ConversationManager] Bulk deleting conversations:', conversationIds.length);
    await db.deleteConversations(conversationIds);
  }

  /**
   * Bulk move to folder
   */
  async bulkMoveToFolder(conversationIds: string[], folderId: string): Promise<void> {
    console.log('[ConversationManager] Bulk moving conversations to folder:', conversationIds.length);
    
    for (const id of conversationIds) {
      await db.moveConversationToFolder(id, folderId);
    }
  }

  /**
   * Create a thread (child conversation)
   */
  async createThread(parentId: string, conversation: Conversation): Promise<void> {
    console.log('[ConversationManager] Creating thread for parent:', parentId);
    
    const threadConversation: Conversation = {
      ...conversation,
      parentId,
    };

    await db.saveConversation(threadConversation);
  }

  /**
   * Get conversation threads
   */
  async getThreads(parentId: string): Promise<Conversation[]> {
    return await db.getConversationThreads(parentId);
  }

  /**
   * Get all conversations with filters
   */
  async getConversations(filters?: {
    archived?: boolean;
    favorite?: boolean;
    folderId?: string;
  }): Promise<Conversation[]> {
    if (filters?.archived) {
      return await db.getArchivedConversations();
    }
    
    if (filters?.favorite) {
      return await db.getFavoriteConversations();
    }
    
    if (filters?.folderId) {
      return await db.getConversationsByFolder(filters.folderId);
    }

    return await db.getActiveConversations();
  }

  /**
   * Search conversations
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    return await db.searchConversations(query);
  }

  /**
   * Export conversation (legacy method - use ExportManager for advanced features)
   */
  async exportConversation(conversationId: string): Promise<string> {
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Import conversation (legacy method - use ImportManager for advanced features)
   */
  async importConversation(data: string): Promise<void> {
    const conversation: Conversation = JSON.parse(data);
    
    // Generate new ID to avoid conflicts
    conversation.id = `conv_imported_${Date.now()}`;
    conversation.createdAt = Date.now();
    conversation.updatedAt = Date.now();

    await db.saveConversation(conversation);
    console.log('[ConversationManager] Conversation imported:', conversation.id);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    console.log('[ConversationManager] Destroying');
    
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
