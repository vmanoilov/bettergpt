/**
 * UIManager - Manages the UI components for the content script
 * 
 * This class handles:
 * - Creating and destroying UI elements
 * - Managing component lifecycle
 * - Coordinating between different UI components
 */

import { ChatPanel } from './ChatPanel';
import { ConversationBrowser } from './ConversationBrowser';
import type { ExtensionConfig } from '../types';

// UI configuration constants
const MAX_Z_INDEX = 2147483647; // Maximum z-index value to ensure extension UI is always on top

export class UIManager {
  private config: ExtensionConfig;
  private chatPanel: ChatPanel | null = null;
  private conversationBrowser: ConversationBrowser | null = null;
  private isVisible: boolean = false;
  private container: HTMLElement | null = null;

  constructor(config: ExtensionConfig) {
    this.config = config;
  }

  /**
   * Initialize the UI components
   */
  async initialize(): Promise<void> {
    console.log('[UIManager] Initializing UI components');

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'bettergpt-root';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 450px;
      height: 100vh;
      z-index: ${MAX_Z_INDEX};
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    `;
    
    document.body.appendChild(this.container);

    // Initialize conversation browser (new Phase 3 UI)
    this.conversationBrowser = new ConversationBrowser(this.container);
    await this.conversationBrowser.initialize();

    console.log('[UIManager] UI components initialized');
  }

  /**
   * Toggle UI visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show the UI
   */
  show(): void {
    if (!this.container) {
      console.warn('[UIManager] Container not initialized');
      return;
    }

    console.log('[UIManager] Showing UI');
    this.container.style.transform = 'translateX(0)';
    this.isVisible = true;

    if (this.chatPanel) {
      this.chatPanel.onShow();
    }
  }

  /**
   * Hide the UI
   */
  hide(): void {
    if (!this.container) {
      console.warn('[UIManager] Container not initialized');
      return;
    }

    console.log('[UIManager] Hiding UI');
    this.container.style.transform = 'translateX(100%)';
    this.isVisible = false;

    if (this.chatPanel) {
      this.chatPanel.onHide();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: ExtensionConfig): void {
    console.log('[UIManager] Updating configuration');
    this.config = config;

    if (this.chatPanel) {
      this.chatPanel.updateConfig(config);
    }
  }

  /**
   * Destroy UI components and cleanup
   */
  destroy(): void {
    console.log('[UIManager] Destroying UI components');

    if (this.chatPanel) {
      this.chatPanel.destroy();
      this.chatPanel = null;
    }

    if (this.conversationBrowser) {
      this.conversationBrowser.destroy();
      this.conversationBrowser = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.isVisible = false;
  }

  /**
   * Check if UI is currently visible
   */
  isUIVisible(): boolean {
    return this.isVisible;
  }
}
