/**
 * Content Script Main Entry Point for BetterGPT
 *
 * Injects UI components into ChatGPT pages
 */

import App from '@components/App.svelte';
import '@/styles/global.css';

// Check if we're on a ChatGPT page
const isChatGPTPage = () => {
  const hostname = window.location.hostname;
  return hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com');
};

// Initialize the extension
function initialize(): void {
  if (!isChatGPTPage()) {
    console.log('[BetterGPT] Not on ChatGPT page, skipping initialization');
    return;
  }

  console.log('[BetterGPT] Initializing on ChatGPT page');

  try {
    // Create container for Svelte app
    const appContainer = document.createElement('div');
    appContainer.id = 'bettergpt-root';
    appContainer.style.cssText =
      'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 9998;';
    document.body.appendChild(appContainer);

    // Initialize Svelte app
    new App({
      target: appContainer,
    });

    console.log('[BetterGPT] Initialization complete');
  } catch (error) {
    console.error('[BetterGPT] Initialization error:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

export {};
