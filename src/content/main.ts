/**
 * Content Script Main Entry Point for BetterGPT Chrome Extension
 *
 * - Injects the Svelte UI into ChatGPT pages
 * - Pulls config from the background service worker
 * - Listens for runtime messages (TOGGLE_UI / UPDATE_CONFIG)
 * - Broadcasts events the UI can optionally handle
 */

import App from '@components/App.svelte';
import '@/styles/global.css';

type ExtensionConfig = {
  enabled?: boolean;
  theme?: string;
  shortcuts?: {
    toggleUI?: string;
  };
  [k: string]: unknown;
};

type ConfigResponse =
  | { success: true; config?: ExtensionConfig }
  | { success: false; error?: string };

let app: App | null = null;
let isInitialized = false;

/**
 * Check if current page is ChatGPT
 */
function isChatGPTPage(): boolean {
  const hostname = window.location.hostname;

  return (
    hostname === 'chat.openai.com' ||
    hostname === 'chatgpt.com' ||
    hostname.endsWith('.chat.openai.com') ||
    hostname.endsWith('.chatgpt.com')
  );
}

/**
 * Promise wrapper for chrome.runtime.sendMessage (MV3-safe).
 */
function sendMessage<TResponse = unknown>(
  payload: unknown
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(payload, (resp: TResponse) => {
        const err = chrome.runtime.lastError;
        if (err) reject(err);
        else resolve(resp);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Broadcast events for the UI to optionally listen to.
 * This avoids hard-coupling to unknown App.svelte internals.
 */
function emitUIEvent(name: string, detail?: unknown): void {
  document.dispatchEvent(
    new CustomEvent(`bettergpt:${name}`, { detail })
  );
}

/**
 * Try to apply config to the Svelte app if it supports it.
 * This is "best effort" — it won't crash if props differ.
 */
function applyConfigToApp(config?: ExtensionConfig): void {
  if (!app || !config) return;

  try {
    // If App.svelte accepts a "config" prop, this will work.
    // If not, Svelte will ignore unknown props.
    // @ts-expect-error - runtime best-effort $set
    app.$set?.({ config });

    emitUIEvent('config', config);
  } catch (e) {
    console.warn('[BetterGPT] Failed to apply config to app:', e);
  }
}

/**
 * Toggle UI best-effort: emit event + try a prop update.
 */
function toggleUI(): void {
  emitUIEvent('toggle');

  if (!app) return;

  try {
    // If App supports a "visible" prop or similar, adjust here later.
    // For now, we only emit an event.
    // @ts-expect-error - best effort
    app.$set?.({ __toggle: Date.now() });
  } catch {
    // ignore
  }
}

/**
 * Initialize the extension UI on ChatGPT pages.
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;

  if (!isChatGPTPage()) {
    console.log('[BetterGPT] Not on ChatGPT page, skipping init');
    return;
  }

  console.log('[BetterGPT] Initializing on ChatGPT page');

  try {
    // Create container for Svelte app
    const appContainer = document.createElement('div');
    appContainer.id = 'bettergpt-root';
    appContainer.style.cssText =
      'position: fixed; top: 0; left: 0; width: 0; height: 0;' +
      ' z-index: 9998;';
    document.body.appendChild(appContainer);

    // Start Svelte app (props are optional)
    app = new App({ target: appContainer });

    // Pull config from background (optional)
    try {
      const response = await sendMessage<ConfigResponse>({
        type: 'GET_CONFIG',
      });

      if (response && (response as any).success) {
        const cfg = (response as any).config as ExtensionConfig | undefined;
        console.log('[BetterGPT] Config loaded:', cfg);
        applyConfigToApp(cfg);
      } else {
        console.warn(
          '[BetterGPT] GET_CONFIG failed:',
          (response as any)?.error
        );
      }
    } catch (e) {
      console.warn('[BetterGPT] GET_CONFIG error:', e);
    }

    isInitialized = true;
    console.log('[BetterGPT] Initialization complete');
  } catch (error) {
    console.error('[BetterGPT] Initialization error:', error);
  }
}

/**
 * Handle messages from background/popup.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[BetterGPT] Message received:', message);

  switch (message?.type) {
    case 'TOGGLE_UI':
      toggleUI();
      sendResponse({ success: true });
      return true;

    case 'UPDATE_CONFIG':
      applyConfigToApp(message?.config as ExtensionConfig);
      sendResponse({ success: true });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// Cleanup on unload (best-effort)
window.addEventListener('beforeunload', () => {
  emitUIEvent('destroy');

  try {
    // @ts-expect-error - best effort
    app?.$destroy?.();
  } catch {
    // ignore
  }

  app = null;
  isInitialized = false;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initialize();
  });
} else {
  void initialize();
}

export {};
