/**
 * Background Service Worker for BetterGPT Chrome Extension
 *
 * Responsibilities:
 * - Extension lifecycle events
 * - Message passing between content scripts, popup, and providers
 * - AI provider orchestration
 * - Configuration persistence
 * - Service worker keep-alive handling
 */

import type {
  AIRequestPayload,
  AIResponseMessage,
  ConfigResponse,
  ExtensionConfig
} from '../content/types';

import { providerManager } from '../providers/provider-manager';
import type { ProviderConfig } from '../providers/base-provider';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const SERVICE_WORKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private static isProduction = false;

  static log(level: LogLevel, message: string, ...args: unknown[]): void {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [BetterGPT] [${level}]`;

    switch (level) {
      case LogLevel.DEBUG:
        if (!this.isProduction) console.log(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }

  static debug(msg: string, ...args: unknown[]) {
    this.log(LogLevel.DEBUG, msg, ...args);
  }
  static info(msg: string, ...args: unknown[]) {
    this.log(LogLevel.INFO, msg, ...args);
  }
  static warn(msg: string, ...args: unknown[]) {
    this.log(LogLevel.WARN, msg, ...args);
  }
  static error(msg: string, ...args: unknown[]) {
    this.log(LogLevel.ERROR, msg, ...args);
  }
}

// ─────────────────────────────────────────────────────────────
// Service Worker Keep-Alive
// ─────────────────────────────────────────────────────────────

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function keepServiceWorkerAlive(): void {
  if (keepAliveInterval) return;

  keepAliveInterval = setInterval(() => {
    Logger.debug('Service worker keep-alive ping');
  }, 20_000);

  setTimeout(stopKeepAlive, SERVICE_WORKER_TIMEOUT);
}

function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    Logger.debug('Service worker keep-alive stopped');
  }
}

// ─────────────────────────────────────────────────────────────
// Lifecycle Events
// ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  Logger.info('Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    handleFirstInstall().catch(err =>
      Logger.error('handleFirstInstall failed', err)
    );
  }

  if (details.reason === 'update') {
    handleUpdate(details.previousVersion).catch(err =>
      Logger.error('handleUpdate failed', err)
    );
  }
});

chrome.runtime.onStartup.addListener(() => {
  Logger.info('Extension startup');
  initializeExtension().catch(err =>
    Logger.error('initializeExtension failed', err)
  );
});

// ─────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────

async function handleFirstInstall(): Promise<void> {
  const defaultConfig: ExtensionConfig = {
    enabled: true,
    theme: 'system',
    shortcuts: {
      toggleUI: 'Ctrl+Shift+A'
    }
  };

  await chrome.storage.local.set({ config: defaultConfig });
  await providerManager.initialize();

  Logger.info('Default configuration initialized');
}

async function handleUpdate(previousVersion?: string): Promise<void> {
  Logger.info(`Updated from version ${previousVersion}`);

  const syncConfig = await chrome.storage.sync.get('config');
  if (syncConfig.config) {
    Logger.info('Migrating config from sync → local');
    await chrome.storage.local.set({ config: syncConfig.config });
    await chrome.storage.sync.remove('config');
  }
}

async function initializeExtension(): Promise<void> {
  await providerManager.initialize();

  const { config } = await chrome.storage.local.get('config');
  if (!config) {
    Logger.warn('No config found, reinitializing');
    await handleFirstInstall();
  }

  Logger.info('Extension initialized');
}

// ─────────────────────────────────────────────────────────────
// Message Handling
// ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  Logger.debug('Message received', message);

  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'ok', message: 'pong' });
      return false;

    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true;

    case 'UPDATE_CONFIG':
      handleUpdateConfig(message.config, sendResponse);
      return true;

    case 'AI_REQUEST':
      keepServiceWorkerAlive();
      handleAIRequest(message.payload, sendResponse)
        .finally(stopKeepAlive);
      return true;

    case 'GET_PROVIDERS':
      handleGetProviders(sendResponse);
      return true;

    case 'UPDATE_PROVIDER':
      handleUpdateProvider(message.providerId, message.providerConfig, sendResponse);
      return true;

    case 'SET_ACTIVE_PROVIDER':
      handleSetActiveProvider(message.providerId, sendResponse);
      return true;

    case 'TEST_PROVIDER':
      handleTestProvider(message.providerId, sendResponse);
      return true;

    default:
      Logger.warn('Unknown message type', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// ─────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────

async function handleGetConfig(
  sendResponse: (response: ConfigResponse) => void
): Promise<void> {
  try {
    const { config } = await chrome.storage.local.get('config');
    sendResponse({ success: true, config });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleUpdateConfig(
  config: ExtensionConfig,
  sendResponse: (response: ConfigResponse) => void
): Promise<void> {
  try {
    await chrome.storage.local.set({ config });
    sendResponse({ success: true, config });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleAIRequest(
  payload: AIRequestPayload,
  sendResponse: (response: AIResponseMessage) => void
): Promise<void> {
  try {
    if (!payload?.message) throw new Error('Invalid AI request payload');

    const provider = providerManager.getActiveProvider();
    if (!provider) throw new Error('No active AI provider configured');

    const response = await providerManager.sendRequest({
      messages: [{ role: 'user', content: payload.message }]
    });

    sendResponse({ success: true, result: response.content });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleGetProviders(
  sendResponse: (r: { success: boolean; providers?: ProviderConfig[]; error?: string }) => void
) {
  try {
    const providers = providerManager.getAllProviders();
    const activeId = providerManager.getActiveProviderId();

    sendResponse({
      success: true,
      providers: providers.map(p => ({ ...p, active: p.id === activeId }))
    });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleUpdateProvider(
  providerId: string,
  providerConfig: Partial<ProviderConfig>,
  sendResponse: (r: { success: boolean; error?: string }) => void
) {
  try {
    await providerManager.updateProvider(providerId, providerConfig);
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleSetActiveProvider(
  providerId: string,
  sendResponse: (r: { success: boolean; error?: string }) => void
) {
  try {
    await providerManager.setActiveProvider(providerId);
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

async function handleTestProvider(
  providerId: string,
  sendResponse: (r: { success: boolean; error?: string }) => void
) {
  try {
    const result = await providerManager.testProvider(providerId);
    sendResponse(result);
  } catch (err) {
    sendResponse({ success: false, error: String(err) });
  }
}

export {};
