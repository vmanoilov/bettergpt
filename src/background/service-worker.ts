/**
 * Background Service Worker for BetterGPT Chrome Extension
 * 
 * Handles message storage and conversation management for ChatGPT
 */

import { db } from '@lib/db';
import type { BaseMessageResponse } from '../content/types';

// Initialize database when service worker starts
db.open().catch((error) => {
  console.error('[BetterGPT] Failed to open database:', error);
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BetterGPT] Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    handleFirstInstall();
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BetterGPT] Message received:', message);

  switch (message.type) {
    case 'SAVE_MESSAGE':
      handleSaveMessage(message.conversationId, message.message, sendResponse);
      return true;

    case 'UPDATE_CONVERSATION':
      handleUpdateConversation(message.conversationId, message.title, message.url, sendResponse);
      return true;

    case 'GET_CONVERSATIONS':
      handleGetConversations(sendResponse);
      return true;

    case 'GET_CONVERSATION':
      handleGetConversation(message.conversationId, sendResponse);
      return true;

    case 'DELETE_CONVERSATION':
      handleDeleteConversation(message.conversationId, sendResponse);
      return true;

    case 'EXPORT_CONVERSATION':
      handleExportConversation(message.conversationId, message.format, sendResponse);
      return true;

    default:
      console.warn('[BetterGPT] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

async function handleFirstInstall(): Promise<void> {
  console.log('[BetterGPT] Setting up first-time installation');
  await db.initializeDefaults();
}

async function handleSaveMessage(
  conversationId: string,
  message: { role: string; content: string; timestamp: Date },
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    // Find or create conversation
    let conversation = await db.conversations
      .where('id')
      .equals(parseInt(conversationId))
      .first();

    if (!conversation) {
      const convId = await db.conversations.add({
        title: 'ChatGPT Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      });
      conversation = await db.conversations.get(convId);
    }

    if (conversation) {
      // Save message
      await db.messages.add({
        conversationId: conversation.id,
        role: message.role as 'user' | 'assistant' | 'system',
        content: message.content,
        timestamp: new Date(message.timestamp),
      });

      // Update conversation
      await db.conversations.update(conversation.id, {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error saving message:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleUpdateConversation(
  conversationId: string,
  title: string,
  url: string,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    // Find or create conversation
    let conversation = await db.conversations
      .where('id')
      .equals(parseInt(conversationId))
      .first();

    if (!conversation) {
      await db.conversations.add({
        title: title || 'ChatGPT Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      });
    } else {
      await db.conversations.update(conversation.id, {
        title: title || conversation.title,
        updatedAt: new Date(),
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error updating conversation:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleGetConversations(
  sendResponse: (response: BaseMessageResponse & { conversations?: unknown[] }) => void
): Promise<void> {
  try {
    const conversations = await db.conversations.orderBy('lastMessageAt').reverse().toArray();
    sendResponse({ success: true, conversations });
  } catch (error) {
    console.error('[BetterGPT] Error getting conversations:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleGetConversation(
  conversationId: number,
  sendResponse: (
    response: BaseMessageResponse & { conversation?: unknown; messages?: unknown[] }
  ) => void
): Promise<void> {
  try {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) {
      sendResponse({ success: false, error: 'Conversation not found' });
      return;
    }

    const messages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');

    sendResponse({ success: true, conversation, messages });
  } catch (error) {
    console.error('[BetterGPT] Error getting conversation:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleDeleteConversation(
  conversationId: number,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    await db.messages.where('conversationId').equals(conversationId).delete();
    await db.conversations.delete(conversationId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error deleting conversation:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleExportConversation(
  conversationId: number,
  format: 'markdown' | 'json',
  sendResponse: (response: BaseMessageResponse & { content?: string }) => void
): Promise<void> {
  try {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) {
      sendResponse({ success: false, error: 'Conversation not found' });
      return;
    }

    const messages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');

    if (format === 'markdown') {
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `Exported: ${new Date().toLocaleString()}\n\n`;
      markdown += `---\n\n`;

      for (const message of messages) {
        const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
        markdown += `## ${role}\n\n`;
        markdown += `${message.content}\n\n`;
        markdown += `---\n\n`;
      }

      sendResponse({ success: true, content: markdown });
    } else {
      const exportData = {
        conversation,
        messages,
        exportedAt: new Date().toISOString(),
      };
      sendResponse({ success: true, content: JSON.stringify(exportData, null, 2) });
    }
  } catch (error) {
    console.error('[BetterGPT] Error exporting conversation:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

export {};
