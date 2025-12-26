/**
 * Background Service Worker for BetterGPT Chrome Extension
 * 
 * This service worker handles:
 * - Extension lifecycle events
 * - Message passing between content scripts and extension
 * - Background tasks and API calls (including OpenAI integration)
 * - State management across extension components
 * - Service worker lifecycle management for long-running operations
 */

import type { AIRequestPayload, AIResponseMessage, ConfigResponse, ExtensionConfig } from '../content/types';

// Constants
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_MAX_TOKENS = 1000;
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
      model: DEFAULT_MODEL,
      maxTokens: DEFAULT_MAX_TOKENS,
      // apiKey is not set by default - user must configure
    };
    
    await chrome.storage.local.set({ config: defaultConfig });
    
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
 * Handle AI requests with OpenAI API integration
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
    
    // Get configuration with API key
    const result = await chrome.storage.local.get('config');
    const config = result.config as ExtensionConfig | undefined;
    
    if (!config) {
      throw new Error('Configuration not found. Please initialize the extension.');
    }
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in settings.');
    }
    
    // Prepare messages array for OpenAI API
    const messages: Array<{ role: string; content: string }> = [];
    
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
    
    // Prepare API request
    const requestBody = {
      model: config.model || DEFAULT_MODEL,
      messages: messages,
      max_tokens: config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: 0.7,
    };
    
    Logger.debug('Sending request to OpenAI API');
    
    // Make API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      const errorMessage = errorData.error?.message || `HTTP error ${response.status}`;
      Logger.error('OpenAI API error:', errorMessage);
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }
    
    const data = await response.json();
    
    // Extract the AI response
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model');
    }
    
    const aiResponse = data.choices[0].message.content;
    Logger.info('AI request completed successfully');
    
    sendResponse({
      success: true,
      result: aiResponse
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

// Export for testing purposes (if needed)
export {};
