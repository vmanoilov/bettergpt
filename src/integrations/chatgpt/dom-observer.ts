/**
 * ChatGPT DOM Observer
 * 
 * This module observes the ChatGPT web interface to:
 * - Monitor conversation changes
 * - Extract conversation structure
 * - Track navigation events
 * - Detect conversation title updates
 */

import type { Conversation } from '../../content/types';
import { db } from '../../data/database';

export class ChatGPTDOMObserver {
  private observer: MutationObserver | null = null;
  private isInitialized = false;
  private currentConversationId: string | null = null;

  /**
   * Initialize the DOM observer
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[ChatGPTDOMObserver] Already initialized');
      return;
    }

    console.log('[ChatGPTDOMObserver] Initializing DOM observer');
    
    // Check if we're on ChatGPT
    if (!this.isChatGPTPage()) {
      console.log('[ChatGPTDOMObserver] Not on ChatGPT page, skipping initialization');
      return;
    }

    this.setupObserver();
    this.observeConversationTitle();
    this.observeNavigationChanges();
    this.isInitialized = true;
  }

  /**
   * Check if current page is ChatGPT
   */
  private isChatGPTPage(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'chat.openai.com' || 
           hostname === 'chatgpt.com' ||
           hostname.endsWith('.chat.openai.com') ||
           hostname.endsWith('.chatgpt.com');
  }

  /**
   * Setup mutation observer
   */
  private setupObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        this.handleMutation(mutation);
      }
    });

    // Observe the entire document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-conversation-id'],
    });
  }

  /**
   * Handle DOM mutations
   */
  private handleMutation(mutation: MutationRecord): void {
    // Check for new messages
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.checkForNewMessage(node as Element);
        }
      });
    }

    // Check for attribute changes
    if (mutation.type === 'attributes') {
      const target = mutation.target as Element;
      if (mutation.attributeName === 'data-conversation-id') {
        this.handleConversationChange(target);
      }
    }
  }

  /**
   * Check if a node contains a new message
   */
  private checkForNewMessage(element: Element): void {
    // Look for message containers
    // This selector may need adjustment based on ChatGPT's actual DOM structure
    const messageSelectors = [
      '[data-message-author-role]',
      '.message',
      '[class*="message"]',
    ];

    for (const selector of messageSelectors) {
      if (element.matches(selector) || element.querySelector(selector)) {
        console.log('[ChatGPTDOMObserver] New message detected');
        this.extractMessageFromElement(element);
        break;
      }
    }
  }

  /**
   * Extract message information from DOM element
   */
  private extractMessageFromElement(element: Element): void {
    try {
      // Extract message content and metadata
      const role = element.getAttribute('data-message-author-role') || 
                   this.inferRoleFromElement(element);
      const content = this.extractTextContent(element);
      
      if (content) {
        console.log('[ChatGPTDOMObserver] Extracted message:', { role, content: content.substring(0, 50) });
        // Additional processing can be added here
      }
    } catch (error) {
      console.error('[ChatGPTDOMObserver] Error extracting message:', error);
    }
  }

  /**
   * Infer message role from element
   */
  private inferRoleFromElement(element: Element): 'user' | 'assistant' | 'system' {
    const classes = element.className;
    
    if (classes.includes('user') || classes.includes('request')) {
      return 'user';
    } else if (classes.includes('assistant') || classes.includes('response')) {
      return 'assistant';
    }
    
    return 'assistant'; // Default
  }

  /**
   * Extract text content from element
   */
  private extractTextContent(element: Element): string {
    // Try to find the main content area
    const contentSelectors = [
      '.markdown',
      '[class*="content"]',
      'p',
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        return contentElement.textContent?.trim() || '';
      }
    }

    return element.textContent?.trim() || '';
  }

  /**
   * Observe conversation title changes
   */
  private observeConversationTitle(): void {
    // Look for title element
    const titleSelectors = [
      'h1',
      '[data-conversation-title]',
      '[class*="conversation-title"]',
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement) {
        this.watchTitleElement(titleElement);
        break;
      }
    }
  }

  /**
   * Watch title element for changes
   */
  private watchTitleElement(element: Element): void {
    const titleObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const newTitle = element.textContent?.trim();
          if (newTitle && this.currentConversationId) {
            this.updateConversationTitle(this.currentConversationId, newTitle);
          }
        }
      }
    });

    titleObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Update conversation title in database
   */
  private async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      await db.updateConversation(conversationId, { title });
      console.log('[ChatGPTDOMObserver] Updated conversation title:', title);
    } catch (error) {
      console.error('[ChatGPTDOMObserver] Error updating title:', error);
    }
  }

  /**
   * Observe navigation changes
   */
  private observeNavigationChanges(): void {
    // Monitor URL changes
    let lastUrl = window.location.href;
    
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('[ChatGPTDOMObserver] Navigation detected:', currentUrl);
        lastUrl = currentUrl;
        this.handleNavigationChange(currentUrl);
      }
    };

    // Check periodically for URL changes
    setInterval(checkUrlChange, 1000);

    // Also listen to popstate events
    window.addEventListener('popstate', () => {
      checkUrlChange();
    });
  }

  /**
   * Handle navigation change
   */
  private handleNavigationChange(url: string): void {
    // Extract conversation ID from URL if present
    const conversationId = this.extractConversationIdFromUrl(url);
    
    if (conversationId !== this.currentConversationId) {
      this.currentConversationId = conversationId;
      console.log('[ChatGPTDOMObserver] Conversation changed:', conversationId);
      
      // Emit event or callback for conversation change
      this.onConversationChange(conversationId);
    }
  }

  /**
   * Extract conversation ID from URL
   */
  private extractConversationIdFromUrl(url: string): string | null {
    const match = url.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Handle conversation change event
   */
  private onConversationChange(conversationId: string | null): void {
    // This can be extended to emit custom events or call callbacks
    const event = new CustomEvent('chatgpt-conversation-change', {
      detail: { conversationId }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current conversation metadata
   */
  getCurrentConversationMetadata(): {
    id: string | null;
    title: string | null;
    model: string | null;
  } {
    return {
      id: this.currentConversationId,
      title: this.getCurrentConversationTitle(),
      model: this.getCurrentModel(),
    };
  }

  /**
   * Get current conversation title from DOM
   */
  private getCurrentConversationTitle(): string | null {
    const titleSelectors = [
      'h1',
      '[data-conversation-title]',
      '[class*="conversation-title"]',
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || null;
      }
    }

    return null;
  }

  /**
   * Get current model from DOM
   */
  private getCurrentModel(): string | null {
    // Look for model indicator in the UI
    const modelSelectors = [
      '[data-model]',
      '[class*="model-"]',
    ];

    for (const selector of modelSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const model = element.getAttribute('data-model') || 
                     element.textContent?.trim();
        if (model) return model;
      }
    }

    return null;
  }

  /**
   * Cleanup and disconnect observer
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[ChatGPTDOMObserver] Destroying observer');
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.isInitialized = false;
    this.currentConversationId = null;
  }
}
