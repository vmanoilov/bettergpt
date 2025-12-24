import Fuse from 'fuse.js';
import type { Conversation, Message, Prompt } from '@lib/db';

/**
 * Search configuration for different entity types
 */
const conversationSearchOptions: Fuse.IFuseOptions<Conversation> = {
  keys: ['title', 'metadata'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const messageSearchOptions: Fuse.IFuseOptions<Message> = {
  keys: ['content'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
};

const promptSearchOptions: Fuse.IFuseOptions<Prompt> = {
  keys: ['title', 'content', 'category', 'tags'],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Search conversations
 */
export function searchConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) {
    return conversations;
  }

  const fuse = new Fuse(conversations, conversationSearchOptions);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}

/**
 * Search messages
 */
export function searchMessages(messages: Message[], query: string): Message[] {
  if (!query.trim()) {
    return messages;
  }

  const fuse = new Fuse(messages, messageSearchOptions);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}

/**
 * Search prompts
 */
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  if (!query.trim()) {
    return prompts;
  }

  const fuse = new Fuse(prompts, promptSearchOptions);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}

/**
 * Generic search function
 */
export function search<T>(items: T[], query: string, options: Fuse.IFuseOptions<T>): T[] {
  if (!query.trim()) {
    return items;
  }

  const fuse = new Fuse(items, options);
  const results = fuse.search(query);

  return results.map((result) => result.item);
}
