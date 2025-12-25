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
import { keyboardManager } from '../utils/keyboard';
import { CommandPalette } from '../components/CommandPalette';
import { themeManager } from '../utils/theme';

// Global state
let uiManager: UIManager | null = null;
let commandPalette: CommandPalette | null = null;
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
      await exportManager.initialize();
      
      // Initialize ChatGPT integration if on ChatGPT page
      if (isChatGPTPage()) {
        console.log('[BetterGPT Content] Initializing ChatGPT integration');
        await chatGPTIntegration.initialize();
      }
      
      // Initialize theme manager
      await themeManager.setTheme(response.config.theme || 'system');
      
      // Initialize UI Manager
      uiManager = new UIManager(response.config);
      await uiManager.initialize();
      
      // Initialize command palette
      commandPalette = new CommandPalette({
        onClose: () => {
          keyboardManager.setEnabled(true);
        }
      });
      await commandPalette.initialize();
      
      // Register keyboard shortcuts
      registerKeyboardShortcuts();
      
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
 * Register keyboard shortcuts
 */
function registerKeyboardShortcuts(): void {
  // Register Cmd/Ctrl+K for command palette
  keyboardManager.register('command-palette', {
    key: 'k',
    ctrl: true,
    meta: true,
    description: 'Open command palette',
    category: 'Global',
    priority: 100,
    handler: (event) => {
      if (commandPalette) {
        commandPalette.toggle();
      }
    }
  });

  // Register Ctrl+Shift+A for UI toggle
  keyboardManager.register('toggle-ui', {
    key: 'A',
    ctrl: true,
    shift: true,
    description: 'Toggle main UI',
    category: 'Global',
    handler: (event) => {
      if (uiManager) {
        uiManager.toggle();
      }
    }
  });

  // Register Ctrl+Shift+S for sidebar toggle
  keyboardManager.register('toggle-sidebar', {
    key: 'S',
    ctrl: true,
    shift: true,
    description: 'Toggle sidebar',
    category: 'Global',
    handler: (event) => {
      chrome.runtime.sendMessage({ type: 'TOGGLE_SIDEBAR' }).catch(console.error);
    }
  });

  console.log('[BetterGPT Content] Keyboard shortcuts registered');
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (event) => {
  keyboardManager.handleKeyEvent(event);
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (uiManager) {
    uiManager.destroy();
  }
  
  if (commandPalette) {
    commandPalette.destroy();
  }
  
  // Cleanup ChatGPT integration
  if (isChatGPTPage()) {
    chatGPTIntegration.destroy();
  }
  
  // Cleanup managers
  conversationManager.destroy();
  folderManager.destroy();
  
  // Clear keyboard shortcuts
  keyboardManager.clear();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for testing
export { initialize, uiManager };
