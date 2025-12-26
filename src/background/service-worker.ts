/**
 * Background Service Worker for BetterGPT Chrome Extension
 * 
 * This service worker handles:
 * - Extension lifecycle events
 * - Message passing between content scripts and extension
 * - Background tasks and API calls (including AI provider integration)
 * - State management across extension components
 * - Service worker lifecycle management for long-running operations
 */

import type { AIRequestPayload, AIResponseMessage, ConfigResponse, ExtensionConfig } from '../content/types';
import { providerManager } from '../providers/provider-manager';
import type { ProviderConfig } from '../providers/base-provider';

// Constants
const SERVICE_WORKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Logging levels
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Production-ready logging utility
 */
class Logger {
  private static isProduction = false; // Set by build process or runtime check

  static log(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [BetterGPT] [${level}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        if (!this.isProduction) {
          console.log(logMessage, ...args);
        }
        break;
      case LogLevel.INFO:
        console.info(logMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, ...args);
        // In production, could send to error tracking service
        break;
    }
  }

  static debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  static info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  static warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  static error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

// Service worker lifecycle management
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Keep service worker alive during long-running operations
 */
function keepServiceWorkerAlive(): void {
  if (keepAliveInterval) {
    return;
  }

  keepAliveInterval = setInterval(() => {
    Logger.debug('Keep-alive ping');
    // Keep worker alive by maintaining activity
  }, 20000); // Every 20 seconds

  // Clear after timeout
  setTimeout(() => {
    stopKeepAlive();
  }, SERVICE_WORKER_TIMEOUT);
}

/**
 * Stop keeping service worker alive
 */
function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    Logger.debug('Keep-alive stopped');
  }
}

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  Logger.info('Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // First-time installation setup
    handleFirstInstall().catch((error) => {
      Logger.error('Error in handleFirstInstall:', error);
    });
  } else if (details.reason === 'update') {
    // Extension update logic
    handleUpdate(details.previousVersion).catch((error) => {
      Logger.error('Error in handleUpdate:', error);
    });
  }
});

// Extension startup handler
chrome.runtime.onStartup.addListener(() => {
  Logger.info('Extension started');
  initializeExtension().catch((error) => {
    Logger.error('Error in initializeExtension:', error);
  });
});

// Initialize provider manager on startup
providerManager.initialize().catch((error) => {
  Logger.error('Error initializing provider manager:', error);
});

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug('Message received:', message);
  
  // Handle different message types
  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'ok', message: 'pong' });
      break;
      
    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true; // Indicates async response
      
    case 'UPDATE_CONFIG':
      handleUpdateConfig(message.config, sendResponse);
      return true; // Indicates async response
      
    case 'AI_REQUEST':
      keepServiceWorkerAlive();
      handleAIRequest(message.payload, sendResponse)
        .finally(() => stopKeepAlive());
      return true; // Indicates async response
      
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
      Logger.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return false;
});

// Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    Logger.debug('Tab loaded:', tab.url);
    // Notify content script if needed
  }
});

/**
 * Handle first-time installation
 */
async function handleFirstInstall(): Promise<void> {
  try {
    Logger.info('Setting up first-time installation');
    
    // Set default configuration using local storage instead of sync
    const defaultConfig: ExtensionConfig = {
      enabled: true,
      theme: 'system',
      shortcuts: {
        toggleUI: 'Ctrl+Shift+A'
      },
      // Legacy fields kept for backward compatibility
      // Provider system now handles API configuration
    };
    
    await chrome.storage.local.set({ config: defaultConfig });
    
    // Initialize provider manager
    await providerManager.initialize();
    
    Logger.info('Default configuration saved');
  } catch (error) {
    Logger.error('Error in handleFirstInstall:', error);
    throw error;
  }
}

/**
 * Handle extension updates
 */
async function handleUpdate(previousVersion?: string): Promise<void> {
  try {
    Logger.info(`Updated from version ${previousVersion}`);
    
    // Migrate from sync to local storage if needed
    const syncData = await chrome.storage.sync.get('config');
    if (syncData.config) {
      Logger.info('Migrating config from sync to local storage');
      await chrome.storage.local.set({ config: syncData.config });
      await chrome.storage.sync.remove('config');
      Logger.info('Migration complete');
    }
  } catch (error) {
    Logger.error('Error in handleUpdate:', error);
    // Don't throw - updates should be resilient
  }
}

/**
 * Initialize extension on startup
 */
async function initializeExtension(): Promise<void> {
  try {
    Logger.info('Initializing extension');
    
    // Initialize provider manager
    await providerManager.initialize();
    
    // Load configuration
    const result = await chrome.storage.local.get('config');
    Logger.info('Configuration loaded:', result.config);
    
    // Validate configuration
    if (!result.config) {
      Logger.warn('No configuration found, initializing defaults');
      await handleFirstInstall();
    }
  } catch (error) {
    Logger.error('Error initializing extension:', error);
    // Don't throw - extension should still function
  }
}

/**
 * Handle configuration requests
 */
async function handleGetConfig(sendResponse: (response: ConfigResponse) => void): Promise<void> {
  try {
    const result = await chrome.storage.local.get('config');
    
    if (!result.config) {
      Logger.warn('No config found, returning default');
      await handleFirstInstall();
      const newResult = await chrome.storage.local.get('config');
      sendResponse({ success: true, config: newResult.config });
    } else {
      sendResponse({ success: true, config: result.config });
    }
  } catch (error) {
    Logger.error('Error getting config:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle configuration update requests
 */
async function handleUpdateConfig(
  config: ExtensionConfig,
  sendResponse: (response: ConfigResponse) => void
): Promise<void> {
  try {
    Logger.info('Updating configuration:', config);
    
    // Validate required fields
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration object');
    }
    
    await chrome.storage.local.set({ config });
    sendResponse({ success: true, config });
    Logger.info('Configuration updated successfully');
  } catch (error) {
    Logger.error('Error updating config:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

/**
 * Handle AI requests using the provider manager
 */
async function handleAIRequest(
  payload: AIRequestPayload,
  sendResponse: (response: AIResponseMessage) => void
): Promise<void> {
  try {
    Logger.info('Processing AI request:', payload);
    
    // Validate payload
    if (!payload || !payload.message) {
      throw new Error('Invalid AI request payload: message is required');
    }
    
    // Get active provider
    const activeProvider = providerManager.getActiveProvider();
    if (!activeProvider) {
      throw new Error('No AI provider configured. Please configure a provider in settings.');
    }
    
    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    
    // Add context if provided
    if (payload.context) {
      messages.push({
        role: 'system',
        content: payload.context
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: payload.message
    });
    
    Logger.debug('Sending request to AI provider');
    
    // Send request through provider
    const response = await providerManager.sendRequest({
      messages,
    });
    
    Logger.info('AI request completed successfully');
    
    sendResponse({
      success: true,
      result: response.content
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error('Error processing AI request:', errorMessage, error);
    
    sendResponse({ 
      success: false, 
      error: errorMessage
    });
  }
}

/**
 * Handle get providers request
 */
async function handleGetProviders(
  sendResponse: (response: { success: boolean; providers?: ProviderConfig[]; error?: string }) => void
): Promise<void> {
  try {
    const providers = providerManager.getAllProviders();
    const activeProviderId = providerManager.getActiveProviderId();
    
    sendResponse({
      success: true,
      providers: providers.map(p => ({ ...p, active: p.id === activeProviderId })) as ProviderConfig[],
    });
  } catch (error) {
    Logger.error('Error getting providers:', error);
    sendResponse({
      success: false,
      error: String(error),
    });
  }
}

/**
 * Handle update provider request
 */
async function handleUpdateProvider(
  providerId: string,
  providerConfig: Partial<ProviderConfig>,
  sendResponse: (response: { success: boolean; error?: string }) => void
): Promise<void> {
  try {
    await providerManager.updateProvider(providerId, providerConfig);
    sendResponse({ success: true });
  } catch (error) {
    Logger.error('Error updating provider:', error);
    sendResponse({
      success: false,
      error: String(error),
    });
  }
}

/**
 * Handle set active provider request
 */
async function handleSetActiveProvider(
  providerId: string,
  sendResponse: (response: { success: boolean; error?: string }) => void
): Promise<void> {
  try {
    await providerManager.setActiveProvider(providerId);
    sendResponse({ success: true });
  } catch (error) {
    Logger.error('Error setting active provider:', error);
    sendResponse({
      success: false,
      error: String(error),
    });
  }
}

/**
 * Handle test provider request
 */
async function handleTestProvider(
  providerId: string,
  sendResponse: (response: { success: boolean; error?: string }) => void
): Promise<void> {
  try {
    const result = await providerManager.testProvider(providerId);
    sendResponse(result);
  } catch (error) {
    Logger.error('Error testing provider:', error);
    sendResponse({
      success: false,
      error: String(error),
    });
  }
}

// Export for testing purposes (if needed)
export {};
