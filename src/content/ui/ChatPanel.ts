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

    // TODO: Implement actual message sending logic
    // This will be connected to the AI service in future iterations
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
