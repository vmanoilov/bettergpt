/**
 * Background Service Worker for BetterGPT Chrome Extension
 * 
 * This service worker handles:
 * - Extension lifecycle events
 * - Message passing between content scripts and extension
 * - Background tasks and API calls
 * - State management across extension components
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BetterGPT] Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // First-time installation setup
    handleFirstInstall();
  } else if (details.reason === 'update') {
    // Extension update logic
    handleUpdate(details.previousVersion);
  }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
  console.log('[BetterGPT] Extension started');
  initializeExtension();
});

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BetterGPT] Message received:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'ok', message: 'pong' });
      break;
      
    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true; // Indicates async response
      
    case 'AI_REQUEST':
      handleAIRequest(message.payload, sendResponse);
      return true; // Indicates async response
      
    default:
      console.warn('[BetterGPT] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('[BetterGPT] Tab loaded:', tab.url);
    // Notify content script if needed
  }
});

/**
 * Handle first-time installation
 */
async function handleFirstInstall(): Promise<void> {
  console.log('[BetterGPT] Setting up first-time installation');
  
  // Set default configuration
  await chrome.storage.sync.set({
    config: {
      enabled: true,
      theme: 'light',
      shortcuts: {
        toggleUI: 'Ctrl+Shift+A'
      }
    }
  });
  
  console.log('[BetterGPT] Default configuration saved');
}

/**
 * Handle extension updates
 */
async function handleUpdate(previousVersion?: string): Promise<void> {
  console.log(`[BetterGPT] Updated from version ${previousVersion}`);
  // Perform any migration logic here if needed
}

/**
 * Initialize extension on startup
 */
async function initializeExtension(): Promise<void> {
  console.log('[BetterGPT] Initializing extension');
  
  // Load configuration
  const { config } = await chrome.storage.sync.get('config');
  console.log('[BetterGPT] Configuration loaded:', config);
}

/**
 * Handle configuration requests
 */
async function handleGetConfig(sendResponse: (response: any) => void): Promise<void> {
  try {
    const { config } = await chrome.storage.sync.get('config');
    sendResponse({ success: true, config });
  } catch (error) {
    console.error('[BetterGPT] Error getting config:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle AI requests
 */
async function handleAIRequest(
  payload: any,
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    console.log('[BetterGPT] Processing AI request:', payload);
    
    // TODO: Implement actual AI request logic
    // This is a placeholder for future implementation
    
    sendResponse({
      success: true,
      result: 'AI request processing not yet implemented'
    });
  } catch (error) {
    console.error('[BetterGPT] Error processing AI request:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Export for testing purposes (if needed)
export {};
