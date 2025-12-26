/**
 * ChatPanel Component - Main chat interface
 * 
 * This component provides:
 * - Chat interface for AI interactions
 * - Message history display
 * - Input handling
 */

import type { ExtensionConfig } from '../types';
import { ThemeToggle } from '../../components/ThemeToggle';

export class ChatPanel {
  private container: HTMLElement;
  private config: ExtensionConfig;
  private panelElement: HTMLElement | null = null;
  private themeToggle: ThemeToggle | null = null;
  private messagesContainer: HTMLElement | null = null;

  constructor(container: HTMLElement, config: ExtensionConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Initialize the chat panel
   */
  async initialize(): Promise<void> {
    console.log('[ChatPanel] Initializing');

    this.panelElement = document.createElement('div');
    this.panelElement.id = 'bettergpt-chat-panel';
    this.panelElement.style.cssText = `
      width: 100%;
      height: 100%;
      background: var(--color-background, white);
      box-shadow: -2px 0 8px var(--color-shadow, rgba(0, 0, 0, 0.1));
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create header
    const header = this.createHeader();
    this.panelElement.appendChild(header);

    // Create messages container
    const messagesContainer = this.createMessagesContainer();
    this.panelElement.appendChild(messagesContainer);

    // Create input area
    const inputArea = this.createInputArea();
    this.panelElement.appendChild(inputArea);

    this.container.appendChild(this.panelElement);
    console.log('[ChatPanel] Initialized');
  }

  /**
   * Create header element
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-surface, #f5f5f5);
    `;

    const title = document.createElement('h2');
    title.textContent = 'BetterGPT';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    // Add theme toggle
    const themeToggleContainer = document.createElement('div');
    this.themeToggle = new ThemeToggle(themeToggleContainer);
    actions.appendChild(themeToggleContainer);

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--color-textSecondary, #666);
      padding: 4px 8px;
    `;
    closeButton.onclick = () => {
      chrome.runtime.sendMessage({ type: 'TOGGLE_UI' }).catch((error) => {
        console.error('[ChatPanel] Failed to toggle UI:', error);
      });
    };

    actions.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(actions);

    return header;
  }

  /**
   * Create messages container
   */
  private createMessagesContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'bettergpt-messages';
    container.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--color-background, white);
    `;

    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.style.cssText = `
      color: var(--color-textSecondary, #666);
      text-align: center;
      padding: 40px 20px;
    `;
    welcomeMessage.innerHTML = `
      <h3 style="margin: 0 0 8px 0; color: var(--color-text, #333);">Welcome to BetterGPT</h3>
      <p style="margin: 0; font-size: 14px;">Your personal AI assistant is ready to help!</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Press Cmd/Ctrl+K to open the command palette</p>
    `;

    container.appendChild(welcomeMessage);
    this.messagesContainer = container;

    return container;
  }

  /**
   * Create input area
   */
  private createInputArea(): HTMLElement {
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid var(--color-border, #e0e0e0);
      background: var(--color-surface, #f9f9f9);
    `;

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const input = document.createElement('textarea');
    input.placeholder = 'Type your message...';
    input.rows = 2;
    input.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      background: var(--color-background, white);
      color: var(--color-text, #333);
    `;

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.cssText = `
      padding: 8px 24px;
      background: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    sendButton.onmouseenter = () => {
      sendButton.style.background = 'var(--color-primaryHover, #0056b3)';
    };
    sendButton.onmouseleave = () => {
      sendButton.style.background = 'var(--color-primary, #007bff)';
    };
    sendButton.onclick = async () => {
      const message = input.value;
      if (message.trim()) {
        try {
          await this.handleSendMessage(message);
          input.value = '';
        } catch (error) {
          console.error('[ChatPanel] Failed to send message:', error);
          // Keep the input value so user can retry
        }
      }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);
    inputArea.appendChild(inputContainer);

    return inputArea;
  }

  /**
   * Handle sending a message
   */
  private async handleSendMessage(message: string): Promise<void> {
    if (!message.trim()) return;

    console.log('[ChatPanel] Sending message:', message);

    // Add user message to UI
    this.addMessageToUI('user', message);

    // Create loading indicator
    const loadingId = this.addLoadingIndicator();

    try {
      // Get page context
      const context = this.getPageContext();

      // Send message to background service worker
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        payload: {
          message: message,
          context: context,
        },
      });

      // Remove loading indicator
      this.removeLoadingIndicator(loadingId);

      if (response.success) {
        // Add AI response to UI
        this.addMessageToUI('assistant', response.result);
      } else {
        // Show error message
        this.addErrorMessage(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      // Remove loading indicator
      this.removeLoadingIndicator(loadingId);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[ChatPanel] Error sending message:', errorMessage);
      this.addErrorMessage(errorMessage);
    }
  }

  /**
   * Add a message to the UI
   */
  private addMessageToUI(role: 'user' | 'assistant', content: string): void {
    if (!this.messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
      ${role === 'user' 
        ? 'background: var(--color-primary, #007bff); color: white; margin-left: 20%;'
        : 'background: var(--color-surface, #f5f5f5); color: var(--color-text, #333); margin-right: 20%;'
      }
    `;

    const roleLabel = document.createElement('div');
    roleLabel.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      opacity: 0.8;
    `;
    roleLabel.textContent = role === 'user' ? 'You' : 'AI Assistant';

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    `;
    contentDiv.textContent = content;

    messageDiv.appendChild(roleLabel);
    messageDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Add loading indicator
   */
  private addLoadingIndicator(): string {
    if (!this.messagesContainer) return '';

    const loadingId = `loading-${Date.now()}`;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
      background: var(--color-surface, #f5f5f5);
      color: var(--color-text, #333);
      margin-right: 20%;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid var(--color-border, #ddd);
      border-top-color: var(--color-primary, #007bff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    const text = document.createElement('span');
    text.textContent = 'Thinking...';
    text.style.fontSize = '14px';

    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(text);
    this.messagesContainer.appendChild(loadingDiv);

    // Add keyframe animation
    if (!document.getElementById('bettergpt-spin-animation')) {
      const style = document.createElement('style');
      style.id = 'bettergpt-spin-animation';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    return loadingId;
  }

  /**
   * Remove loading indicator
   */
  private removeLoadingIndicator(loadingId: string): void {
    if (!this.messagesContainer) return;
    
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  /**
   * Add error message to UI
   */
  private addErrorMessage(error: string): void {
    if (!this.messagesContainer) return;

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
      background: var(--color-error, #dc3545);
      color: white;
      margin-right: 20%;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    `;
    title.textContent = 'Error';

    const message = document.createElement('div');
    message.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
    `;
    message.textContent = error;

    errorDiv.appendChild(title);
    errorDiv.appendChild(message);
    this.messagesContainer.appendChild(errorDiv);

    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Get page context (selected text, URL, etc.)
   */
  private getPageContext(): string {
    const url = window.location.href;
    const title = document.title;
    const selectedText = window.getSelection()?.toString() || '';

    let context = `Current Page: ${title}\nURL: ${url}`;
    
    if (selectedText) {
      context += `\n\nSelected Text:\n${selectedText}`;
    }

    return context;
  }

  /**
   * Called when panel is shown
   */
  onShow(): void {
    console.log('[ChatPanel] Panel shown');
  }

  /**
   * Called when panel is hidden
   */
  onHide(): void {
    console.log('[ChatPanel] Panel hidden');
  }

  /**
   * Show panel
   */
  show(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'flex';
    }
    this.onShow();
  }

  /**
   * Hide panel
   */
  hide(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
    this.onHide();
  }

  /**
   * Update configuration
   */
  updateConfig(config: ExtensionConfig): void {
    console.log('[ChatPanel] Configuration updated');
    this.config = config;
    // Apply any config-based styling or behavior changes
  }

  /**
   * Destroy the chat panel
   */
  destroy(): void {
    console.log('[ChatPanel] Destroying');
    
    if (this.themeToggle) {
      this.themeToggle.destroy();
      this.themeToggle = null;
    }
    
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }
  }
}
