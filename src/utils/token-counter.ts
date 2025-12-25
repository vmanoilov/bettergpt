/**
 * Token Counter Utility
 * 
 * Provides approximate token counting for conversations.
 * Uses a simple heuristic based on OpenAI's tokenization rules.
 * 
 * For production, consider using an actual tokenizer library like:
 * - gpt-tokenizer
 * - tiktoken (if available for browser)
 */

import type { ConversationMessage } from '../content/types';

/**
 * Estimate token count for text
 * 
 * This is a rough approximation:
 * - 1 token ≈ 4 characters for English text
 * - 1 token ≈ 0.75 words on average
 * 
 * More accurate for GPT-3.5/GPT-4 tokenization:
 * - Consider punctuation and special characters
 * - Account for common words and patterns
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  // Method 1: Character-based estimation (more conservative)
  const charBasedEstimate = Math.ceil(text.length / 4);

  // Method 2: Word-based estimation
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordBasedEstimate = Math.ceil(words.length / 0.75);

  // Use the average of both methods for better accuracy
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}

/**
 * Estimate tokens for a message
 */
export function estimateMessageTokens(message: ConversationMessage): number {
  let total = 0;

  // Content tokens
  total += estimateTokenCount(message.content);

  // Role token (overhead for message structure)
  total += 4; // ~4 tokens for role and message structure

  // Attachment tokens (if any)
  if (message.attachments && message.attachments.length > 0) {
    for (const attachment of message.attachments) {
      if (attachment.content) {
        total += estimateTokenCount(attachment.content);
      }
      // Additional overhead for attachment structure
      total += 10;
    }
  }

  return total;
}

/**
 * Estimate total tokens for an array of messages
 */
export function estimateMessagesTokens(messages: ConversationMessage[]): number {
  let total = 0;

  for (const message of messages) {
    total += estimateMessageTokens(message);
  }

  // Add overhead for conversation structure
  total += 3; // ~3 tokens for conversation wrapper

  return total;
}

/**
 * Token limits for different models
 */
export const TOKEN_LIMITS = {
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-16k': 16384,
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-turbo': 128000,
  'gpt-4o': 128000,
  'default': 4096,
} as const;

/**
 * Get token limit for a model
 */
export function getTokenLimit(model: string): number {
  // Normalize model name
  const normalizedModel = model.toLowerCase();
  
  // Check for exact match
  if (normalizedModel in TOKEN_LIMITS) {
    return TOKEN_LIMITS[normalizedModel as keyof typeof TOKEN_LIMITS];
  }

  // Check for partial matches
  if (normalizedModel.includes('gpt-4o')) return TOKEN_LIMITS['gpt-4o'];
  if (normalizedModel.includes('gpt-4-turbo')) return TOKEN_LIMITS['gpt-4-turbo'];
  if (normalizedModel.includes('gpt-4-32k')) return TOKEN_LIMITS['gpt-4-32k'];
  if (normalizedModel.includes('gpt-4')) return TOKEN_LIMITS['gpt-4'];
  if (normalizedModel.includes('16k')) return TOKEN_LIMITS['gpt-3.5-turbo-16k'];
  if (normalizedModel.includes('gpt-3.5')) return TOKEN_LIMITS['gpt-3.5-turbo'];

  return TOKEN_LIMITS.default;
}

/**
 * Calculate percentage of token limit used
 */
export function calculateTokenUsage(tokens: number, model: string): number {
  const limit = getTokenLimit(model);
  return (tokens / limit) * 100;
}

/**
 * Check if token count exceeds limit
 */
export function exceedsTokenLimit(tokens: number, model: string): boolean {
  const limit = getTokenLimit(model);
  return tokens > limit;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Get token usage color (for UI indicators)
 */
export function getTokenUsageColor(percentage: number): string {
  if (percentage >= 90) return '#ef4444'; // Red
  if (percentage >= 75) return '#f59e0b'; // Orange
  if (percentage >= 50) return '#eab308'; // Yellow
  return '#10b981'; // Green
}
