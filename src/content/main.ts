/**
 * Content Script Main Entry Point for BetterGPT Chrome Extension
 * 
 * This script:
 * - Initializes the UI components on web pages
 * - Manages communication with the background service worker
 * - Handles user interactions within the page context
 */

import { UIManager } from './ui/UIManager';

// Global state
let uiManager: UIManager | null = null;
let isInitialized = false;

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
      type: 'GET_CONFIG'
    });

    if (response.success) {
      console.log('[BetterGPT Content] Configuration received:', response.config);
      
      // Initialize UI Manager
      uiManager = new UIManager(response.config);
      await uiManager.initialize();
      
      isInitialized = true;
      console.log('[BetterGPT Content] Initialization complete');
    } else {
      console.error('[BetterGPT Content] Failed to get configuration:', response.error);
    }
  } catch (error) {
    console.error('[BetterGPT Content] Initialization error:', error);
  }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BetterGPT Content] Message received:', message);

  switch (message.type) {
    case 'TOGGLE_UI':
      if (uiManager) {
        uiManager.toggle();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'UI not initialized' });
      }
      break;

    case 'UPDATE_CONFIG':
      if (uiManager) {
        uiManager.updateConfig(message.config);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'UI not initialized' });
      }
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
    if (uiManager) {
      uiManager.toggle();
    }
  }
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (uiManager) {
    uiManager.destroy();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for testing
export { initialize, uiManager };
