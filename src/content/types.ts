/**
 * Type definitions for BetterGPT Chrome Extension
 */

/**
 * Extension configuration interface
 */
export interface ExtensionConfig {
  enabled: boolean;
  theme: 'light' | 'dark';
  shortcuts: {
    toggleUI: string;
  };
}

/**
 * Message types for communication between components
 */
export type MessageType =
  | 'PING'
  | 'GET_CONFIG'
  | 'UPDATE_CONFIG'
  | 'AI_REQUEST'
  | 'TOGGLE_UI';

/**
 * Base message structure
 */
export interface Message {
  type: MessageType;
  payload?: any;
}

/**
 * Response structure for messages
 */
export interface MessageResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * AI request payload
 */
export interface AIRequestPayload {
  message: string;
  context?: string;
  conversationId?: string;
}

/**
 * AI response structure
 */
export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
}
