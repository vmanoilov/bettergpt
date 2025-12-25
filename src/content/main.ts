/**
 * Content Script Main Entry Point for BetterGPT Chrome Extension
 * 
 * This script:
 * - Initializes the UI components on web pages
 * - Manages communication with the background service worker
 * - Handles user interactions within the page context
 * - Initializes ChatGPT integration for conversation capture
 */

import { UIManager } from './ui/UIManager';
import { chatGPTIntegration } from '../integrations/chatgpt';
import { conversationManager } from '../managers/conversation-manager';
import { folderManager } from '../managers/folder-manager';
import { exportManager } from '../managers/export-manager';

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
      
      // Initialize managers
      conversationManager.initialize();
      folderManager.initialize();
      exportManager.initialize();
      
      // Initialize ChatGPT integration if on ChatGPT page
      if (isChatGPTPage()) {
        console.log('[BetterGPT Content] Initializing ChatGPT integration');
        await chatGPTIntegration.initialize();
      }
      
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
    // If background script is not available, we may be in an invalid state
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.warn('[BetterGPT Content] Extension context invalidated, may need reload');
    }
  }
}

/**
 * Check if current page is ChatGPT
 */
function isChatGPTPage(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'chat.openai.com' || 
         hostname === 'chatgpt.com' ||
         hostname.endsWith('.chat.openai.com') ||
         hostname.endsWith('.chatgpt.com');
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
  
  // Cleanup ChatGPT integration
  if (isChatGPTPage()) {
    chatGPTIntegration.destroy();
  }
  
  // Cleanup managers
  conversationManager.destroy();
  folderManager.destroy();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for testing
export { initialize, uiManager };
