/**
 * ChatGPT API Interceptor
 * 
 * This module intercepts ChatGPT API calls to:
 * - Capture conversation data
 * - Extract metadata (model, tokens, etc.)
 * - Handle streaming responses
 * - Process attachments
 */

import type { 
  Conversation, 
  ConversationMessage, 
  ChatGPTRequest, 
  ChatGPTResponse,
  MessageAttachment 
} from '../../content/types';
import { db } from '../../data/database';
import { exportManager } from '../../managers/export-manager';

export class ChatGPTInterceptor {
  private isInitialized = false;
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  /**
   * Initialize the interceptor
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[ChatGPTInterceptor] Already initialized');
      return;
    }

    console.log('[ChatGPTInterceptor] Initializing API interceptor');
    this.interceptFetch();
    this.interceptXHR();
    this.isInitialized = true;
  }

  /**
   * Intercept fetch API calls
   */
  private interceptFetch(): void {
    const originalFetch = this.originalFetch;
    const isChatGPTApiUrl = this.isChatGPTApiUrl.bind(this);
    const parseRequest = this.parseRequest.bind(this);
    const handleStreamingResponse = this.handleStreamingResponse.bind(this);
    const handleRegularResponse = this.handleRegularResponse.bind(this);
    
    window.fetch = async function(...args) {
      const [url, options] = args;
      
      // Check if this is a ChatGPT API call
      if (isChatGPTApiUrl(url)) {
        console.log('[ChatGPTInterceptor] Intercepted fetch request:', url);
        
        try {
          // Capture request
          const requestData = await parseRequest(options);
          
          // Make the actual request
          const response = await originalFetch.apply(this, args);
          
          // Clone response for reading
          const clonedResponse = response.clone();
          
          // Handle streaming vs non-streaming responses
          if (requestData?.stream) {
            handleStreamingResponse(clonedResponse, requestData);
          } else {
            handleRegularResponse(clonedResponse, requestData);
          }
          
          return response;
        } catch (_error) {
          console.error('[ChatGPTInterceptor] Error intercepting fetch:', _error);
          return originalFetch.apply(this, args);
        }
      }
      
      return originalFetch.apply(this, args);
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    const isChatGPTApiUrl = this.isChatGPTApiUrl.bind(this);
    const handleXHRResponse = this.handleXHRResponse.bind(this);
    const originalXHROpen = this.originalXHROpen;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: Array<boolean | string | null | undefined>) {
      const urlString = url.toString();
      
      if (isChatGPTApiUrl(urlString)) {
        console.log('[ChatGPTInterceptor] Intercepted XHR request:', urlString);
        
        // Store original onload handler
        const originalOnLoad = this.onload;
        
        this.onload = function(event) {
          try {
            handleXHRResponse(this);
          } catch (_error) {
            console.error('[ChatGPTInterceptor] Error handling XHR response:', _error);
          }
          
          if (originalOnLoad) {
            originalOnLoad.call(this, event);
          }
        };
      }
      
      return originalXHROpen.call(this, method, url, ...rest);
    };
  }

  /**
   * Check if URL is a ChatGPT API endpoint
   */
  private isChatGPTApiUrl(url: string | Request | URL): boolean {
    const urlString = url.toString();
    try {
      const urlObject = new URL(urlString);
      const hostname = urlObject.hostname;
      
      // Check for exact match or subdomain
      return hostname === 'api.openai.com' ||
             hostname.endsWith('.api.openai.com') ||
             hostname === 'chat.openai.com' ||
             hostname.endsWith('.chat.openai.com') ||
             (urlObject.pathname && urlObject.pathname.includes('/backend-api'));
    } catch (_error) {
      // Invalid URL
      return false;
    }
  }

  /**
   * Parse request data
   */
  private async parseRequest(options?: RequestInit): Promise<ChatGPTRequest | null> {
    if (!options?.body) return null;
    
    try {
      const bodyText = typeof options.body === 'string' 
        ? options.body 
        : await new Response(options.body).text();
      
      return JSON.parse(bodyText);
    } catch (error) {
      console.error('[ChatGPTInterceptor] Error parsing request:', error);
      return null;
    }
  }

  /**
   * Handle regular (non-streaming) response
   */
  private async handleRegularResponse(
    response: Response, 
    requestData: ChatGPTRequest | null
  ): Promise<void> {
    try {
      const data: ChatGPTResponse = await response.json();
      console.log('[ChatGPTInterceptor] Captured response:', data);
      
      await this.saveConversation(requestData, data);
    } catch (error) {
      console.error('[ChatGPTInterceptor] Error handling response:', error);
    }
  }

  /**
   * Handle streaming response
   */
  private async handleStreamingResponse(
    response: Response, 
    requestData: ChatGPTRequest | null
  ): Promise<void> {
    try {
      const reader = response.body?.getReader();
      if (!reader) return;
      
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('[ChatGPTInterceptor] Stream complete');
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
              }
            } catch (_e) {
              // Ignore parsing errors for individual chunks
            }
          }
        }
      }
      
      // Save the complete conversation
      if (fullContent) {
        await this.saveStreamedConversation(requestData, fullContent);
      }
    } catch (error) {
      console.error('[ChatGPTInterceptor] Error handling streaming response:', error);
    }
  }

  /**
   * Handle XHR response
   */
  private handleXHRResponse(xhr: XMLHttpRequest): void {
    try {
      if (xhr.responseType === 'json' || xhr.responseType === '') {
        const data = JSON.parse(xhr.responseText);
        console.log('[ChatGPTInterceptor] Captured XHR response:', data);
        // Process the response data
      }
    } catch (error) {
      console.error('[ChatGPTInterceptor] Error handling XHR response:', error);
    }
  }

  /**
   * Save conversation from regular response
   */
  private async saveConversation(
    request: ChatGPTRequest | null, 
    response: ChatGPTResponse
  ): Promise<void> {
    if (!request || !response.choices || response.choices.length === 0) {
      return;
    }

    const conversationId = this.generateConversationId(response.id);
    const existingConversation = await db.getConversation(conversationId);
    
    const messages: ConversationMessage[] = existingConversation?.messages || [];
    
    // Add user message from request
    if (request.messages && request.messages.length > 0) {
      const lastUserMessage = request.messages[request.messages.length - 1];
      messages.push({
        id: this.generateMessageId(),
        role: lastUserMessage.role as 'user' | 'assistant' | 'system',
        content: lastUserMessage.content,
        timestamp: Date.now(),
      });
    }
    
    // Add assistant message from response
    messages.push({
      id: response.id,
      role: 'assistant',
      content: response.choices[0].message.content,
      timestamp: response.created * 1000,
      tokens: response.usage?.completion_tokens,
    });

    const conversation: Conversation = {
      id: conversationId,
      title: this.generateTitle(messages),
      model: response.model,
      createdAt: existingConversation?.createdAt || Date.now(),
      updatedAt: Date.now(),
      messages,
      isArchived: existingConversation?.isArchived || false,
      isFavorite: existingConversation?.isFavorite || false,
      totalTokens: response.usage?.total_tokens,
      folderId: existingConversation?.folderId,
      parentId: existingConversation?.parentId,
    };

    await db.saveConversation(conversation);
    console.log('[ChatGPTInterceptor] Conversation saved:', conversationId);
    
    // Trigger export manager on completion
    await exportManager.onConversationCompleted(conversationId);
  }

  /**
   * Save streamed conversation
   */
  private async saveStreamedConversation(
    request: ChatGPTRequest | null,
    content: string
  ): Promise<void> {
    if (!request) return;

    const conversationId = this.generateConversationId();
    const existingConversation = await db.getConversation(conversationId);
    
    const messages: ConversationMessage[] = existingConversation?.messages || [];
    
    // Add user message from request
    if (request.messages && request.messages.length > 0) {
      const lastUserMessage = request.messages[request.messages.length - 1];
      messages.push({
        id: this.generateMessageId(),
        role: lastUserMessage.role as 'user' | 'assistant' | 'system',
        content: lastUserMessage.content,
        timestamp: Date.now(),
      });
    }
    
    // Add assistant message
    messages.push({
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      streaming: true,
    });

    const conversation: Conversation = {
      id: conversationId,
      title: this.generateTitle(messages),
      model: request.model,
      createdAt: existingConversation?.createdAt || Date.now(),
      updatedAt: Date.now(),
      messages,
      isArchived: existingConversation?.isArchived || false,
      isFavorite: existingConversation?.isFavorite || false,
      folderId: existingConversation?.folderId,
      parentId: existingConversation?.parentId,
    };

    await db.saveConversation(conversation);
    console.log('[ChatGPTInterceptor] Streamed conversation saved');
    
    // Trigger export manager on completion
    await exportManager.onConversationCompleted(conversationId);
  }

  /**
   * Generate conversation ID
   */
  private generateConversationId(baseId?: string): string {
    return baseId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate conversation title from messages
   */
  private generateTitle(messages: ConversationMessage[]): string {
    if (messages.length === 0) {
      return 'New Conversation';
    }
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      // Use first 50 characters of the first user message
      return firstUserMessage.content.substring(0, 50).trim() + 
             (firstUserMessage.content.length > 50 ? '...' : '');
    }
    
    return 'New Conversation';
  }

  /**
   * Cleanup and restore original methods
   */
  destroy(): void {
    if (!this.isInitialized) return;
    
    console.log('[ChatGPTInterceptor] Destroying interceptor');
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    this.isInitialized = false;
  }
}
