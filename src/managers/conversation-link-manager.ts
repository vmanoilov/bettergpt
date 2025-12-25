/**
 * Conversation Link Manager
 * 
 * Manages conversation links:
 * - Create forks from messages
 * - Create continuations
 * - Create references
 * - Get conversation graphs
 */

import type { Conversation, ConversationLink, ConversationLinkType, ConversationMessage } from '../content/types';
import { db } from '../data/database';

export interface ConversationGraphNode {
  conversation: Conversation;
  links: {
    outgoing: ConversationLink[];
    incoming: ConversationLink[];
  };
}

export interface ConversationGraph {
  nodes: Map<string, ConversationGraphNode>;
  roots: string[]; // Conversation IDs with no incoming links
}

export class ConversationLinkManager {
  /**
   * Create a fork from a specific message in a conversation
   */
  async forkAtMessage(
    sourceConversationId: string,
    messageId: string,
    newConversation: Partial<Conversation>
  ): Promise<{ conversation: Conversation; link: ConversationLink }> {
    const sourceConversation = await db.getConversation(sourceConversationId);
    if (!sourceConversation) {
      throw new Error(`Source conversation ${sourceConversationId} not found`);
    }

    // Find the fork point message
    const forkPointIndex = sourceConversation.messages.findIndex(m => m.id === messageId);
    if (forkPointIndex === -1) {
      throw new Error(`Message ${messageId} not found in conversation`);
    }

    const forkPointMessage = sourceConversation.messages[forkPointIndex];

    // Create new conversation with messages up to fork point
    const forkedMessages = sourceConversation.messages.slice(0, forkPointIndex + 1);
    
    const forkedConversation: Conversation = {
      id: `conv_fork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newConversation.title || `Fork: ${sourceConversation.title}`,
      model: newConversation.model || sourceConversation.model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: forkedMessages,
      folderId: newConversation.folderId || sourceConversation.folderId,
      isArchived: false,
      isFavorite: false,
      tags: newConversation.tags || [],
      totalTokens: newConversation.totalTokens,
    };

    // Save the forked conversation
    await db.saveConversation(forkedConversation);

    // Create link
    const link: ConversationLink = {
      id: `link_fork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: sourceConversationId,
      targetId: forkedConversation.id,
      type: 'fork',
      messageId: messageId,
      createdAt: Date.now(),
      metadata: {
        forkMessage: forkPointMessage.content.substring(0, 100), // Store preview
      },
    };

    await db.saveConversationLink(link);

    console.log('[ConversationLinkManager] Created fork:', {
      source: sourceConversationId,
      target: forkedConversation.id,
      messageId,
    });

    return { conversation: forkedConversation, link };
  }

  /**
   * Create a continuation from another conversation
   */
  async continueFromConversation(
    sourceConversationId: string,
    newConversation: Partial<Conversation>,
    options?: {
      includeAllMessages?: boolean; // Copy all messages from source
      reason?: string;
    }
  ): Promise<{ conversation: Conversation; link: ConversationLink }> {
    const sourceConversation = await db.getConversation(sourceConversationId);
    if (!sourceConversation) {
      throw new Error(`Source conversation ${sourceConversationId} not found`);
    }

    // Create new conversation
    const continuedConversation: Conversation = {
      id: `conv_cont_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newConversation.title || `Continued: ${sourceConversation.title}`,
      model: newConversation.model || sourceConversation.model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: options?.includeAllMessages ? [...sourceConversation.messages] : [],
      folderId: newConversation.folderId || sourceConversation.folderId,
      isArchived: false,
      isFavorite: false,
      tags: newConversation.tags || [],
      totalTokens: newConversation.totalTokens,
    };

    // Save the continued conversation
    await db.saveConversation(continuedConversation);

    // Create link
    const link: ConversationLink = {
      id: `link_cont_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: sourceConversationId,
      targetId: continuedConversation.id,
      type: 'continuation',
      createdAt: Date.now(),
      metadata: {
        reason: options?.reason,
      },
    };

    await db.saveConversationLink(link);

    console.log('[ConversationLinkManager] Created continuation:', {
      source: sourceConversationId,
      target: continuedConversation.id,
    });

    return { conversation: continuedConversation, link };
  }

  /**
   * Create a reference link between conversations
   */
  async createReference(
    sourceConversationId: string,
    targetConversationId: string,
    reason?: string
  ): Promise<ConversationLink> {
    // Verify both conversations exist
    const source = await db.getConversation(sourceConversationId);
    const target = await db.getConversation(targetConversationId);

    if (!source) {
      throw new Error(`Source conversation ${sourceConversationId} not found`);
    }
    if (!target) {
      throw new Error(`Target conversation ${targetConversationId} not found`);
    }

    // Create link
    const link: ConversationLink = {
      id: `link_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: sourceConversationId,
      targetId: targetConversationId,
      type: 'reference',
      createdAt: Date.now(),
      metadata: {
        reason,
      },
    };

    await db.saveConversationLink(link);

    console.log('[ConversationLinkManager] Created reference:', {
      source: sourceConversationId,
      target: targetConversationId,
    });

    return link;
  }

  /**
   * Delete a conversation link
   */
  async deleteLink(linkId: string): Promise<void> {
    await db.deleteConversationLink(linkId);
    console.log('[ConversationLinkManager] Deleted link:', linkId);
  }

  /**
   * Get all links for a conversation
   */
  async getLinks(conversationId: string): Promise<{
    outgoing: ConversationLink[];
    incoming: ConversationLink[];
  }> {
    const outgoing = await db.getOutgoingLinks(conversationId);
    const incoming = await db.getIncomingLinks(conversationId);

    return { outgoing, incoming };
  }

  /**
   * Get linked conversations (both sources and targets)
   */
  async getLinkedConversations(conversationId: string): Promise<{
    parents: Conversation[];
    children: Conversation[];
    related: Conversation[];
  }> {
    const { outgoing, incoming } = await this.getLinks(conversationId);

    const parents: Conversation[] = [];
    const children: Conversation[] = [];
    const related: Conversation[] = [];

    // Process incoming links (conversations that link TO this one)
    for (const link of incoming) {
      const conv = await db.getConversation(link.sourceId);
      if (conv) {
        if (link.type === 'fork' || link.type === 'continuation') {
          parents.push(conv);
        } else {
          related.push(conv);
        }
      }
    }

    // Process outgoing links (conversations that this one links TO)
    for (const link of outgoing) {
      const conv = await db.getConversation(link.targetId);
      if (conv) {
        if (link.type === 'fork' || link.type === 'continuation') {
          children.push(conv);
        } else {
          related.push(conv);
        }
      }
    }

    return { parents, children, related };
  }

  /**
   * Build conversation graph
   */
  async buildGraph(rootConversationId?: string): Promise<ConversationGraph> {
    const graph: ConversationGraph = {
      nodes: new Map(),
      roots: [],
    };

    // Get all conversations to include in the graph
    let conversationsToProcess: Conversation[];
    
    if (rootConversationId) {
      // Start from specific conversation and traverse
      conversationsToProcess = await this.getConnectedConversations(rootConversationId);
    } else {
      // Include all conversations
      conversationsToProcess = await db.getAllConversations();
    }

    // Build nodes
    for (const conversation of conversationsToProcess) {
      const outgoing = await db.getOutgoingLinks(conversation.id);
      const incoming = await db.getIncomingLinks(conversation.id);

      graph.nodes.set(conversation.id, {
        conversation,
        links: { outgoing, incoming },
      });

      // Track roots (conversations with no incoming links)
      if (incoming.length === 0) {
        graph.roots.push(conversation.id);
      }
    }

    return graph;
  }

  /**
   * Get all conversations connected to a specific conversation
   */
  private async getConnectedConversations(
    conversationId: string,
    visited: Set<string> = new Set()
  ): Promise<Conversation[]> {
    if (visited.has(conversationId)) {
      return [];
    }

    visited.add(conversationId);

    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return [];
    }

    const result: Conversation[] = [conversation];

    // Get all linked conversations
    const links = await db.getConversationLinks(conversationId);
    
    for (const link of links) {
      const linkedId = link.sourceId === conversationId ? link.targetId : link.sourceId;
      const connected = await this.getConnectedConversations(linkedId, visited);
      result.push(...connected);
    }

    return result;
  }

  /**
   * Get conversation path (chain of linked conversations)
   */
  async getConversationPath(conversationId: string): Promise<Conversation[]> {
    const path: Conversation[] = [];
    let currentId: string | undefined = conversationId;

    while (currentId) {
      const conversation = await db.getConversation(currentId);
      if (!conversation) break;

      path.unshift(conversation);

      // Find parent (incoming fork or continuation link)
      const incoming = await db.getIncomingLinks(currentId);
      const parentLink = incoming.find(link => 
        link.type === 'fork' || link.type === 'continuation'
      );

      currentId = parentLink?.sourceId;
    }

    return path;
  }

  /**
   * Check if a link would create a cycle
   */
  async wouldCreateCycle(sourceId: string, targetId: string): Promise<boolean> {
    // Use BFS to check if targetId can reach sourceId
    const queue: string[] = [targetId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId === sourceId) {
        return true; // Cycle detected
      }

      const outgoing = await db.getOutgoingLinks(currentId);
      for (const link of outgoing) {
        queue.push(link.targetId);
      }
    }

    return false;
  }
}

// Export singleton instance
export const conversationLinkManager = new ConversationLinkManager();
