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
import { SettingsPanel } from './SettingsPanel';
import type { ExtensionConfig } from '../types';

// UI configuration constants
const MAX_Z_INDEX = 2147483647; // Maximum z-index value to ensure extension UI is always on top

type ViewMode = 'chat' | 'conversations' | 'settings';

export class UIManager {
  private config: ExtensionConfig;
  private chatPanel: ChatPanel | null = null;
  private conversationBrowser: ConversationBrowser | null = null;
  private settingsPanel: SettingsPanel | null = null;
  private isVisible: boolean = false;
  private container: HTMLElement | null = null;
  private currentView: ViewMode = 'chat';

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
      display: flex;
      flex-direction: column;
    `;

    document.body.appendChild(this.container);

    // Create navigation tabs
    const nav = this.createNavigation();
    this.container.appendChild(nav);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.id = 'bettergpt-content';
    contentContainer.style.cssText = `
      flex: 1;
      overflow: hidden;
    `;
    this.container.appendChild(contentContainer);

    // Initialize chat panel
    this.chatPanel = new ChatPanel(contentContainer, this.config);
    await this.chatPanel.initialize();

    // Initialize conversation browser
    this.conversationBrowser = new ConversationBrowser(contentContainer);
    await this.conversationBrowser.initialize();

    // Initialize settings panel
    this.settingsPanel = new SettingsPanel(contentContainer, this.config);
    await this.settingsPanel.initialize();

    // Set initial view
    this.switchView('chat');

    console.log('[UIManager] UI components initialized');
  }

  /**
   * Create navigation tabs
   */
  private createNavigation(): HTMLElement {
    const nav = document.createElement('div');
    nav.style.cssText = `
      display: flex;
      background: var(--color-surface, #f5f5f5);
      border-bottom: 1px solid var(--color-border, #e0e0e0);
    `;

    const tabs: Array<{ id: ViewMode; label: string; icon: string }> = [
      { id: 'chat', label: 'Chat', icon: '💬' },
      { id: 'conversations', label: 'History', icon: '📚' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    for (const tab of tabs) {
      const button = document.createElement('button');
      button.textContent = `${tab.icon} ${tab.label}`;
      button.style.cssText = `
        flex: 1;
        padding: 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--color-textSecondary, #666);
        transition: all 0.2s;
      `;
      
      button.onclick = () => this.switchView(tab.id);
      
      // Hover effect
      button.onmouseenter = () => {
        if (this.currentView !== tab.id) {
          button.style.background = 'var(--color-hoverBackground, rgba(0, 0, 0, 0.05))';
        }
      };
      button.onmouseleave = () => {
        if (this.currentView !== tab.id) {
          button.style.background = 'none';
        }
      };

      nav.appendChild(button);
    }

    return nav;
  }

  /**
   * Switch between views
   */
  private switchView(view: ViewMode): void {
    console.log('[UIManager] Switching to view:', view);
    this.currentView = view;

    // Update navigation buttons
    if (this.container) {
      const nav = this.container.querySelector('div');
      if (nav) {
        const buttons = nav.querySelectorAll('button');
        buttons.forEach((button, index) => {
          if (
            (index === 0 && view === 'chat') ||
            (index === 1 && view === 'conversations') ||
            (index === 2 && view === 'settings')
          ) {
            button.style.background = 'var(--color-background, white)';
            button.style.color = 'var(--color-primary, #007bff)';
            button.style.borderBottom = '2px solid var(--color-primary, #007bff)';
          } else {
            button.style.background = 'none';
            button.style.color = 'var(--color-textSecondary, #666)';
            button.style.borderBottom = 'none';
          }
        });
      }
    }

    // Show/hide panels
    if (this.chatPanel) {
      view === 'chat' ? this.chatPanel.show() : this.chatPanel.hide();
    }
    if (this.conversationBrowser) {
      view === 'conversations' ? this.conversationBrowser.show() : this.conversationBrowser.hide();
    }
    if (this.settingsPanel) {
      view === 'settings' ? this.settingsPanel.show() : this.settingsPanel.hide();
    }
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
