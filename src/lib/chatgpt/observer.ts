/**
 * ChatGPT Conversation Observer
 *
 * Monitors the ChatGPT DOM for conversation changes and captures messages
 */

export interface ChatGPTMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId?: string;
}

export interface ChatGPTConversation {
  id: string;
  title: string;
  messages: ChatGPTMessage[];
  lastUpdated: Date;
  url: string;
}

/**
 * Observer class for ChatGPT conversations
 */
export class ChatGPTObserver {
  private observer: MutationObserver | null = null;
  private conversationId: string | null = null;
  private onMessageCallback: ((message: ChatGPTMessage) => void) | null = null;
  private onConversationChangeCallback: ((conversationId: string) => void) | null = null;
  private processedMessages: Set<string> = new Set();

  /**
   * Start observing ChatGPT conversations
   */
  start(
    onMessage: (message: ChatGPTMessage) => void,
    onConversationChange: (conversationId: string) => void
  ): void {
    this.onMessageCallback = onMessage;
    this.onConversationChangeCallback = onConversationChange;

    // Extract conversation ID from URL
    this.updateConversationId();

    // Watch for URL changes
    this.watchUrlChanges();

    // Set up DOM observer
    this.setupDOMObserver();

    // Initial scan of existing messages
    this.scanExistingMessages();
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Get current conversation ID from URL
   */
  private updateConversationId(): void {
    const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
    const newId = match ? match[1] : 'default';

    if (newId !== this.conversationId) {
      this.conversationId = newId;
      this.processedMessages.clear();

      if (this.onConversationChangeCallback) {
        this.onConversationChangeCallback(newId);
      }
    }
  }

  /**
   * Watch for URL changes (navigation within ChatGPT)
   */
  private watchUrlChanges(): void {
    let lastUrl = window.location.href;

    const checkUrl = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.updateConversationId();
        this.scanExistingMessages();
      }
    };

    // Check periodically
    setInterval(checkUrl, 500);

    // Also listen to popstate
    window.addEventListener('popstate', () => {
      this.updateConversationId();
      this.scanExistingMessages();
    });
  }

  /**
   * Set up MutationObserver to watch for new messages
   */
  private setupDOMObserver(): void {
    const mainContent = document.querySelector('main') || document.body;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Check if new message elements were added
          this.scanForNewMessages();
        }
      }
    });

    this.observer.observe(mainContent, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Scan existing messages on page
   */
  private scanExistingMessages(): void {
    // ChatGPT uses data-testid or specific class structures
    // We'll look for message containers
    const messageElements = this.findMessageElements();

    for (const element of messageElements) {
      this.processMessageElement(element);
    }
  }

  /**
   * Scan for new messages
   */
  private scanForNewMessages(): void {
    const messageElements = this.findMessageElements();

    for (const element of messageElements) {
      this.processMessageElement(element);
    }
  }

  /**
   * Find message elements in the DOM
   * ChatGPT's structure changes, so we use multiple strategies
   */
  private findMessageElements(): Element[] {
    const elements: Element[] = [];

    // Strategy 1: Look for data-message-author-role attribute
    const messagesWithRole = document.querySelectorAll('[data-message-author-role]');
    elements.push(...Array.from(messagesWithRole));

    // Strategy 2: Look for specific class patterns (fallback)
    if (elements.length === 0) {
      const alternativeMessages = document.querySelectorAll(
        '[class*="message"], [class*="Message"]'
      );
      elements.push(...Array.from(alternativeMessages));
    }

    return elements;
  }

  /**
   * Process a message element and extract content
   */
  private processMessageElement(element: Element): void {
    // Generate a unique ID for this message based on its position and content
    const messageId = this.generateMessageId(element);

    if (this.processedMessages.has(messageId)) {
      return; // Already processed
    }

    // Determine role
    const role = this.extractRole(element);
    if (!role) return;

    // Extract content
    const content = this.extractContent(element);
    if (!content || content.trim().length === 0) return;

    // Mark as processed
    this.processedMessages.add(messageId);

    // Create message object
    const message: ChatGPTMessage = {
      role,
      content,
      timestamp: new Date(),
      messageId,
    };

    // Callback
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(element: Element): string {
    const content = this.extractContent(element);
    const role = this.extractRole(element);
    return `${role}-${content.substring(0, 50)}-${element.getBoundingClientRect().top}`;
  }

  /**
   * Extract role from message element
   */
  private extractRole(element: Element): 'user' | 'assistant' | null {
    // Check data attribute
    const roleAttr = element.getAttribute('data-message-author-role');
    if (roleAttr === 'user') return 'user';
    if (roleAttr === 'assistant') return 'assistant';

    // Check for class patterns
    const classList = element.className;
    if (classList.includes('user') || classList.includes('User')) return 'user';
    if (classList.includes('assistant') || classList.includes('Assistant')) return 'assistant';

    // Check parent elements
    let parent = element.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      const parentRole = parent.getAttribute('data-message-author-role');
      if (parentRole === 'user' || parentRole === 'assistant') {
        return parentRole as 'user' | 'assistant';
      }
      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * Extract content from message element
   */
  private extractContent(element: Element): string {
    // Look for markdown content divs
    const markdownDiv = element.querySelector('[class*="markdown"], [class*="prose"]');
    if (markdownDiv) {
      return this.extractTextContent(markdownDiv);
    }

    // Fallback to element's text content
    return this.extractTextContent(element);
  }

  /**
   * Extract text content while preserving structure
   */
  private extractTextContent(element: Element): string {
    // Clone to avoid modifying DOM
    const clone = element.cloneNode(true) as Element;

    // Remove buttons, icons, and other UI elements
    const toRemove = clone.querySelectorAll('button, svg, [role="button"]');
    toRemove.forEach((el) => el.remove());

    // Get text content
    return (clone.textContent || '').trim();
  }

  /**
   * Get conversation title from page
   */
  getConversationTitle(): string {
    // Look for title in various locations
    const titleElement = document.querySelector('h1, [class*="title"], title');
    if (titleElement) {
      const text = titleElement.textContent?.trim();
      if (text && text !== 'ChatGPT') {
        return text;
      }
    }

    // Fallback to first user message
    return 'New Conversation';
  }

  /**
   * Get current conversation ID
   */
  getCurrentConversationId(): string {
    return this.conversationId || 'default';
  }
}
