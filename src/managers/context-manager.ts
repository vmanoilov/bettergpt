/**
 * Context Manager
 * 
 * Manages conversation context:
 * - Auto-load context from linked conversations
 * - Manual context selection
 * - Context truncation with smart algorithms
 * - Token counting and estimation
 */

import type { Conversation, ConversationMessage, ConversationContext, ConversationLink } from '../content/types';
import { db } from '../data/database';
import { estimateMessagesTokens, estimateMessageTokens, getTokenLimit } from '../utils/token-counter';

export interface ContextLoadResult {
  messages: ConversationMessage[];
  totalTokens: number;
  sources: {
    conversationId: string;
    title: string;
    messageCount: number;
    tokens: number;
  }[];
  truncated: boolean;
  truncationReason?: string;
}

export type TruncationStrategy = 'recent' | 'relevant' | 'balanced';

export class ContextManager {
  /**
   * Load context for a conversation
   */
  async loadContext(
    conversationId: string,
    options?: {
      maxTokens?: number;
      strategy?: TruncationStrategy;
      includeLinks?: string[]; // Specific link IDs to include
    }
  ): Promise<ContextLoadResult> {
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const context = conversation.context;
    const maxTokens = options?.maxTokens || context?.maxTokens || getTokenLimit(conversation.model) * 0.7; // Use 70% of limit by default
    const strategy = options?.strategy || context?.truncationStrategy || 'balanced';

    const result: ContextLoadResult = {
      messages: [],
      totalTokens: 0,
      sources: [],
      truncated: false,
    };

    // Collect messages from various sources
    const messageSources: Array<{ conversation: Conversation; messages: ConversationMessage[] }> = [];

    // 1. Load parent conversation if auto-load enabled
    if (context?.autoLoadParent && conversation.parentId) {
      const parent = await db.getConversation(conversation.parentId);
      if (parent) {
        messageSources.push({ conversation: parent, messages: parent.messages });
      }
    }

    // 2. Load linked conversations
    const linksToInclude = options?.includeLinks || context?.includedLinks || [];
    if (context?.autoLoadLinks || linksToInclude.length > 0) {
      const links = await db.getConversationLinks(conversationId);
      
      for (const link of links) {
        const linkedId = link.sourceId === conversationId ? link.targetId : link.sourceId;
        
        // Check if this link should be included
        if (context?.autoLoadLinks || linksToInclude.includes(link.id)) {
          const linked = await db.getConversation(linkedId);
          if (linked) {
            messageSources.push({ conversation: linked, messages: linked.messages });
          }
        }
      }
    }

    // 3. Combine and process messages
    const allMessages: Array<{ message: ConversationMessage; source: Conversation }> = [];
    
    for (const source of messageSources) {
      for (const message of source.messages) {
        allMessages.push({ message, source: source.conversation });
      }
    }

    // 4. Apply truncation strategy
    const truncatedResult = this.applyTruncation(allMessages, maxTokens, strategy);
    
    result.messages = truncatedResult.messages.map(m => m.message);
    result.totalTokens = truncatedResult.totalTokens;
    result.truncated = truncatedResult.truncated;
    result.truncationReason = truncatedResult.reason;

    // 5. Build source summary
    const sourceMap = new Map<string, typeof result.sources[0]>();
    
    for (const { message, source } of truncatedResult.messages) {
      if (!sourceMap.has(source.id)) {
        sourceMap.set(source.id, {
          conversationId: source.id,
          title: source.title,
          messageCount: 0,
          tokens: 0,
        });
      }
      
      const sourceStat = sourceMap.get(source.id)!;
      sourceStat.messageCount++;
      sourceStat.tokens += estimateMessageTokens(message);
    }

    result.sources = Array.from(sourceMap.values());

    return result;
  }

  /**
   * Apply truncation strategy to messages
   */
  private applyTruncation(
    messages: Array<{ message: ConversationMessage; source: Conversation }>,
    maxTokens: number,
    strategy: TruncationStrategy
  ): {
    messages: Array<{ message: ConversationMessage; source: Conversation }>;
    totalTokens: number;
    truncated: boolean;
    reason?: string;
  } {
    // Calculate initial token count
    let totalTokens = 0;
    for (const { message } of messages) {
      totalTokens += estimateMessageTokens(message);
    }

    // If within limit, no truncation needed
    if (totalTokens <= maxTokens) {
      return { messages, totalTokens, truncated: false };
    }

    // Apply strategy
    let truncatedMessages: typeof messages = [];
    
    switch (strategy) {
      case 'recent':
        truncatedMessages = this.truncateRecent(messages, maxTokens);
        break;
      case 'relevant':
        truncatedMessages = this.truncateRelevant(messages, maxTokens);
        break;
      case 'balanced':
        truncatedMessages = this.truncateBalanced(messages, maxTokens);
        break;
    }

    const newTotalTokens = truncatedMessages.reduce(
      (sum, { message }) => sum + estimateMessageTokens(message),
      0
    );

    return {
      messages: truncatedMessages,
      totalTokens: newTotalTokens,
      truncated: true,
      reason: `Truncated using ${strategy} strategy from ${messages.length} to ${truncatedMessages.length} messages`,
    };
  }

  /**
   * Truncate keeping most recent messages
   */
  private truncateRecent(
    messages: Array<{ message: ConversationMessage; source: Conversation }>,
    maxTokens: number
  ): typeof messages {
    // Sort by timestamp (most recent first)
    const sorted = [...messages].sort((a, b) => b.message.timestamp - a.message.timestamp);
    
    const result: typeof messages = [];
    let currentTokens = 0;

    for (const item of sorted) {
      const messageTokens = estimateMessageTokens(item.message);
      if (currentTokens + messageTokens <= maxTokens) {
        result.push(item);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    // Sort back to chronological order
    return result.sort((a, b) => a.message.timestamp - b.message.timestamp);
  }

  /**
   * Truncate keeping most relevant messages
   * Relevance is based on:
   * - Message length (longer = more context)
   * - Role (system messages are important)
   * - Position (first and last messages are important)
   */
  private truncateRelevant(
    messages: Array<{ message: ConversationMessage; source: Conversation }>,
    maxTokens: number
  ): typeof messages {
    // Calculate relevance scores
    const scored = messages.map((item, index) => {
      let score = 0;

      // System messages are highly relevant
      if (item.message.role === 'system') {
        score += 100;
      }

      // First and last messages are important
      if (index === 0 || index === messages.length - 1) {
        score += 50;
      }

      // Longer messages have more context
      score += Math.min(item.message.content.length / 100, 30);

      // Recent messages are more relevant
      const age = Date.now() - item.message.timestamp;
      const ageScore = Math.max(0, 20 - age / (1000 * 60 * 60 * 24)); // Decay over days
      score += ageScore;

      return { ...item, score };
    });

    // Sort by relevance score (highest first)
    const sorted = scored.sort((a, b) => b.score - a.score);

    const result: typeof messages = [];
    let currentTokens = 0;

    for (const item of sorted) {
      const messageTokens = estimateMessageTokens(item.message);
      if (currentTokens + messageTokens <= maxTokens) {
        result.push(item);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    // Sort back to chronological order
    return result.sort((a, b) => a.message.timestamp - b.message.timestamp);
  }

  /**
   * Truncate with balanced approach
   * Keep first N messages, last N messages, and sample from middle
   */
  private truncateBalanced(
    messages: Array<{ message: ConversationMessage; source: Conversation }>,
    maxTokens: number
  ): typeof messages {
    if (messages.length <= 4) {
      return this.truncateRecent(messages, maxTokens);
    }

    const result: typeof messages = [];
    let currentTokens = 0;

    // Reserve 40% for first messages, 40% for last messages, 20% for middle
    const firstBudget = maxTokens * 0.4;
    const lastBudget = maxTokens * 0.4;
    const middleBudget = maxTokens * 0.2;

    // Add first messages
    let i = 0;
    let firstTokens = 0;
    while (i < messages.length && firstTokens < firstBudget) {
      const messageTokens = estimateMessageTokens(messages[i].message);
      if (firstTokens + messageTokens <= firstBudget) {
        result.push(messages[i]);
        firstTokens += messageTokens;
        currentTokens += messageTokens;
        i++;
      } else {
        break;
      }
    }

    // Add last messages (in reverse, then we'll sort)
    const lastMessages: typeof messages = [];
    let j = messages.length - 1;
    let lastTokens = 0;
    while (j >= i && lastTokens < lastBudget) {
      const messageTokens = estimateMessageTokens(messages[j].message);
      if (lastTokens + messageTokens <= lastBudget) {
        lastMessages.unshift(messages[j]);
        lastTokens += messageTokens;
        currentTokens += messageTokens;
        j--;
      } else {
        break;
      }
    }

    // Add some middle messages if there's budget and space
    if (i < j && currentTokens < maxTokens) {
      const middleMessages = messages.slice(i, j + 1);
      const step = Math.max(1, Math.floor(middleMessages.length / 3)); // Sample every Nth message
      
      for (let k = 0; k < middleMessages.length && currentTokens < maxTokens; k += step) {
        const messageTokens = estimateMessageTokens(middleMessages[k].message);
        if (currentTokens + messageTokens <= maxTokens) {
          result.push(middleMessages[k]);
          currentTokens += messageTokens;
        }
      }
    }

    // Add last messages
    result.push(...lastMessages);

    // Sort to maintain chronological order
    return result.sort((a, b) => a.message.timestamp - b.message.timestamp);
  }

  /**
   * Save context configuration for a conversation
   */
  async saveContextConfig(conversationId: string, context: ConversationContext): Promise<void> {
    await db.updateConversation(conversationId, { context });
  }

  /**
   * Get context configuration for a conversation
   */
  async getContextConfig(conversationId: string): Promise<ConversationContext | undefined> {
    const conversation = await db.getConversation(conversationId);
    return conversation?.context;
  }

  /**
   * Create default context configuration
   */
  createDefaultContext(conversationId: string): ConversationContext {
    return {
      conversationId,
      includedLinks: [],
      autoLoadParent: true,
      autoLoadLinks: false,
      truncationStrategy: 'balanced',
    };
  }
}

// Export singleton instance
export const contextManager = new ContextManager();
