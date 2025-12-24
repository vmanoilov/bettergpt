/**
 * ChatGPT Integration Manager
 * 
 * Coordinates all ChatGPT integration components:
 * - API interceptor
 * - DOM observer
 * - Sidebar injector
 */

import { ChatGPTInterceptor } from './interceptor';
import { ChatGPTDOMObserver } from './dom-observer';
import { ChatGPTSidebarInjector } from './sidebar';

export class ChatGPTIntegrationManager {
  private interceptor: ChatGPTInterceptor;
  private domObserver: ChatGPTDOMObserver;
  private sidebarInjector: ChatGPTSidebarInjector;
  private isInitialized = false;

  constructor() {
    this.interceptor = new ChatGPTInterceptor();
    this.domObserver = new ChatGPTDOMObserver();
    this.sidebarInjector = new ChatGPTSidebarInjector();
  }

  /**
   * Initialize all ChatGPT integrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ChatGPTIntegrationManager] Already initialized');
      return;
    }

    console.log('[ChatGPTIntegrationManager] Initializing ChatGPT integrations');

    try {
      // Initialize API interceptor
      this.interceptor.initialize();

      // Initialize DOM observer
      this.domObserver.initialize();

      // Initialize sidebar injector
      await this.sidebarInjector.initialize();

      this.isInitialized = true;
      console.log('[ChatGPTIntegrationManager] All integrations initialized successfully');
    } catch (error) {
      console.error('[ChatGPTIntegrationManager] Error initializing integrations:', error);
      throw error;
    }
  }

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.sidebarInjector.toggle();
  }

  /**
   * Show sidebar
   */
  showSidebar(): void {
    this.sidebarInjector.show();
  }

  /**
   * Hide sidebar
   */
  hideSidebar(): void {
    this.sidebarInjector.hide();
  }

  /**
   * Get current conversation metadata
   */
  getCurrentConversationMetadata() {
    return this.domObserver.getCurrentConversationMetadata();
  }

  /**
   * Cleanup and destroy all integrations
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[ChatGPTIntegrationManager] Destroying all integrations');

    this.interceptor.destroy();
    this.domObserver.destroy();
    this.sidebarInjector.destroy();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const chatGPTIntegration = new ChatGPTIntegrationManager();
