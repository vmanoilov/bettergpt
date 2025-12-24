/**
 * Content Script Main Entry Point for BetterGPT Chrome Extension
 *
 * This script:
 * - Initializes the Svelte UI components on web pages
 * - Manages communication with the background service worker
 * - Handles user interactions within the page context
 */

import App from '@components/App.svelte';
import { isUIVisible, config } from '@stores';
import '@/styles/global.css';

// Global state
let app: App | null = null;
let isInitialized = false;
let appContainer: HTMLElement | null = null;

/**
 * Initialize the content script
 */
async function initialize(): Promise<void> {
  if (isInitialized) {
    console.log('[BetterGPT Content] Already initialized');
    return;
  }

  console.log('[BetterGPT Content] Initializing...');

  try {
    // Get configuration from background
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CONFIG',
    });

    if (response.success) {
      console.log('[BetterGPT Content] Configuration received:', response.config);

      // Update config store
      config.set(response.config);

      // Create container for Svelte app
      appContainer = document.createElement('div');
      appContainer.id = 'bettergpt-root';
      document.body.appendChild(appContainer);

      // Initialize Svelte app
      app = new App({
        target: appContainer,
      });

      isInitialized = true;
      console.log('[BetterGPT Content] Initialization complete');
    } else {
      console.error('[BetterGPT Content] Failed to get configuration:', response.error);
    }
  } catch (error) {
    console.error('[BetterGPT Content] Initialization error:', error);
    // If background script is not available, we may be in an invalid state
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('[BetterGPT Content] Extension context invalidated, may need reload');
    }
  }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BetterGPT Content] Message received:', message);

  switch (message.type) {
    case 'TOGGLE_UI':
      isUIVisible.update((value) => !value);
      sendResponse({ success: true });
      break;

    case 'UPDATE_CONFIG':
      config.set(message.config);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+Shift+A (default toggle shortcut)
  if (event.ctrlKey && event.shiftKey && event.key === 'A') {
    event.preventDefault();
    isUIVisible.update((value) => !value);
  }
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (app) {
    app.$destroy();
  }
  if (appContainer) {
    appContainer.remove();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for testing
export { initialize, app };
