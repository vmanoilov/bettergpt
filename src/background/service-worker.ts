/**
 * Background Service Worker for BetterGPT Chrome Extension
 *
 * This service worker handles:
 * - Extension lifecycle events
 * - Message passing between content scripts and extension
 * - AI request processing with real providers
 * - State management across extension components
 */

import type {
  AIRequestPayload,
  AIResponseMessage,
  ConfigResponse,
  PageContext,
  BaseMessageResponse,
} from '../content/types';
import { db } from '@lib/db';
import { AIProviderManager, AIProviderError } from '@lib/ai';
import type { AIStreamChunk, AIProviderConfig } from '@lib/ai';

// Initialize provider manager
const providerManager = AIProviderManager.getInstance();

// Initialize database when service worker starts
db.open().catch((error) => {
  console.error('[BetterGPT] Failed to open database:', error);
});

// Load providers when service worker starts
providerManager.loadFromStorage().catch((error) => {
  console.error('[BetterGPT] Failed to load providers:', error);
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BetterGPT] Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    // First-time installation setup
    handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension update logic
    handleUpdate(details.previousVersion);
  }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('[BetterGPT] Extension started');
  initializeExtension();
});

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BetterGPT] Message received:', message);

  // Handle different message types
  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'ok', message: 'pong' });
      break;

    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true; // Indicates async response

    case 'AI_REQUEST':
      handleAIRequest(message.payload, sendResponse, sender);
      return true; // Indicates async response

    case 'GET_PAGE_CONTEXT':
      // This is handled by content script, just acknowledge
      sendResponse({ success: true });
      break;

    case 'GET_CONVERSATIONS':
      handleGetConversations(sendResponse);
      return true;

    case 'GET_CONVERSATION':
      handleGetConversation(message.conversationId, sendResponse);
      return true;

    case 'DELETE_CONVERSATION':
      handleDeleteConversation(message.conversationId, sendResponse);
      return true;

    case 'GET_PROVIDERS':
      handleGetProviders(sendResponse);
      return true;

    case 'SAVE_PROVIDER':
      handleSaveProvider(message.provider, sendResponse);
      return true;

    case 'DELETE_PROVIDER':
      handleDeleteProvider(message.providerId, sendResponse);
      return true;

    case 'SET_ACTIVE_PROVIDER':
      handleSetActiveProvider(message.providerId, sendResponse);
      return true;

    case 'TEST_PROVIDER':
      handleTestProvider(message.providerId, sendResponse);
      return true;

    default:
      console.warn('[BetterGPT] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('[BetterGPT] Tab loaded:', tab.url);
    // Notify content script if needed
  }
});

/**
 * Handle first-time installation
 */
async function handleFirstInstall(): Promise<void> {
  console.log('[BetterGPT] Setting up first-time installation');

  // Set default configuration
  await chrome.storage.sync.set({
    config: {
      enabled: true,
      theme: 'light',
      shortcuts: {
        toggleUI: 'Ctrl+Shift+A',
      },
    },
  });

  // Initialize database with defaults
  await db.initializeDefaults();

  console.log('[BetterGPT] Default configuration saved');
}

/**
 * Handle extension updates
 */
async function handleUpdate(previousVersion?: string): Promise<void> {
  console.log(`[BetterGPT] Updated from version ${previousVersion}`);
  // Perform any migration logic here if needed
}

/**
 * Initialize extension on startup
 */
async function initializeExtension(): Promise<void> {
  console.log('[BetterGPT] Initializing extension');

  // Load configuration
  const { config } = await chrome.storage.sync.get('config');
  console.log('[BetterGPT] Configuration loaded:', config);

  // Ensure database is initialized
  await db.initializeDefaults();
}

/**
 * Handle configuration requests
 */
async function handleGetConfig(sendResponse: (response: ConfigResponse) => void): Promise<void> {
  try {
    const { config } = await chrome.storage.sync.get('config');
    sendResponse({ success: true, config });
  } catch (error) {
    console.error('[BetterGPT] Error getting config:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle AI requests
 */
async function handleAIRequest(
  payload: AIRequestPayload,
  sendResponse: (response: AIResponseMessage) => void,
  sender?: chrome.runtime.MessageSender
): Promise<void> {
  try {
    console.log('[BetterGPT] Processing AI request:', payload);

    // Get active AI provider
    const provider = providerManager.createProviderInstance();
    if (!provider) {
      sendResponse({
        success: false,
        error: 'No AI provider configured. Please configure a provider in settings.',
      });
      return;
    }

    // Create or get conversation
    let conversationId = payload.conversationId;
    if (!conversationId) {
      conversationId = await db.conversations.add({
        title: payload.message.substring(0, 50) + (payload.message.length > 50 ? '...' : ''),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      });
    } else {
      // Update conversation
      await db.conversations.update(conversationId, {
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      });
    }

    // Save user message
    await db.messages.add({
      conversationId,
      role: 'user',
      content: payload.message,
      timestamp: new Date(),
      metadata: payload.context ? { context: payload.context } : undefined,
    });

    // Build messages array for AI
    const messages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');

    const aiMessages = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add system message if there's page context
    if (payload.context) {
      const contextMessage = buildContextMessage(payload.context);
      aiMessages.unshift({
        role: 'system',
        content: contextMessage,
      });
    }

    // Handle streaming vs non-streaming
    if (payload.stream && sender?.tab?.id) {
      // Streaming response
      const tabId = sender.tab.id;
      let assistantContent = '';
      const assistantMessageId = await db.messages.add({
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      });

      try {
        await provider.sendStreamRequest(
          { messages: aiMessages, stream: true },
          async (chunk: AIStreamChunk) => {
            if (!chunk.done && chunk.content) {
              assistantContent += chunk.content;

              // Send chunk to content script
              chrome.tabs.sendMessage(tabId, {
                type: 'AI_STREAM_CHUNK',
                chunk: chunk.content,
                done: false,
                conversationId,
                messageId: assistantMessageId,
              });

              // Update message in database periodically
              await db.messages.update(assistantMessageId, {
                content: assistantContent,
              });
            } else if (chunk.done) {
              // Final update
              await db.messages.update(assistantMessageId, {
                content: assistantContent,
              });

              // Send done signal
              chrome.tabs.sendMessage(tabId, {
                type: 'AI_STREAM_CHUNK',
                chunk: '',
                done: true,
                conversationId,
                messageId: assistantMessageId,
              });
            }
          }
        );

        sendResponse({
          success: true,
          conversationId,
          messageId: assistantMessageId,
          streaming: true,
        });
      } catch (error) {
        // Clean up failed message
        await db.messages.delete(assistantMessageId);
        throw error;
      }
    } else {
      // Non-streaming response
      const response = await provider.sendRequest({
        messages: aiMessages,
        stream: false,
      });

      // Save assistant message
      const assistantMessageId = await db.messages.add({
        conversationId,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.usage ? { usage: response.usage } : undefined,
      });

      sendResponse({
        success: true,
        result: response.content,
        conversationId,
        messageId: assistantMessageId,
      });
    }
  } catch (error) {
    console.error('[BetterGPT] Error processing AI request:', error);

    if (error instanceof AIProviderError) {
      sendResponse({
        success: false,
        error: `AI Provider Error: ${error.message}`,
      });
    } else {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process AI request',
      });
    }
  }
}

/**
 * Build context message from page context
 */
function buildContextMessage(context: PageContext): string {
  let message = 'You are an AI assistant helping the user with their web browsing.\n\n';
  message += `Current page: ${context.title}\n`;
  message += `URL: ${context.url}\n`;

  if (context.selectedText) {
    message += `\nUser has selected the following text:\n---\n${context.selectedText}\n---\n`;
  }

  if (context.domContext) {
    message += `\nAdditional context from the page:\n${context.domContext}\n`;
  }

  return message;
}

/**
 * Handle get conversations request
 */
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

/**
 * Handle get conversation request
 */
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

/**
 * Handle delete conversation request
 */
async function handleDeleteConversation(
  conversationId: number,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    // Delete all messages in the conversation
    await db.messages.where('conversationId').equals(conversationId).delete();

    // Delete the conversation
    await db.conversations.delete(conversationId);

    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error deleting conversation:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle get providers request
 */
async function handleGetProviders(
  sendResponse: (
    response: BaseMessageResponse & { providers?: unknown[]; activeProviderId?: string | null }
  ) => void
): Promise<void> {
  try {
    await providerManager.loadFromStorage();
    const providers = providerManager.getProviders();
    const activeProvider = providerManager.getActiveProvider();

    sendResponse({
      success: true,
      providers,
      activeProviderId: activeProvider?.id || null,
    });
  } catch (error) {
    console.error('[BetterGPT] Error getting providers:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle save provider request
 */
async function handleSaveProvider(
  provider: AIProviderConfig,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    await providerManager.addOrUpdateProvider(provider);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error saving provider:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle delete provider request
 */
async function handleDeleteProvider(
  providerId: string,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    await providerManager.removeProvider(providerId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error deleting provider:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle set active provider request
 */
async function handleSetActiveProvider(
  providerId: string,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    await providerManager.setActiveProvider(providerId);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[BetterGPT] Error setting active provider:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle test provider request
 */
async function handleTestProvider(
  providerId: string,
  sendResponse: (response: BaseMessageResponse) => void
): Promise<void> {
  try {
    const provider = providerManager.createProviderInstance(providerId);
    if (!provider) {
      sendResponse({ success: false, error: 'Provider not found' });
      return;
    }

    const result = await provider.testConnection();
    sendResponse({
      success: result,
      error: result ? undefined : 'Connection test failed',
    });
  } catch (error) {
    console.error('[BetterGPT] Error testing provider:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Export for testing purposes (if needed)
export {};
