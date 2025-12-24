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
export type MessageType = 'PING' | 'GET_CONFIG' | 'UPDATE_CONFIG' | 'AI_REQUEST' | 'TOGGLE_UI';

/**
 * Base message structure with typed payloads
 */
export interface BaseMessage {
  type: MessageType;
}

export interface PingMessage extends BaseMessage {
  type: 'PING';
}

export interface GetConfigMessage extends BaseMessage {
  type: 'GET_CONFIG';
}

export interface UpdateConfigMessage extends BaseMessage {
  type: 'UPDATE_CONFIG';
  config: ExtensionConfig;
}

export interface ToggleUIMessage extends BaseMessage {
  type: 'TOGGLE_UI';
}

export interface AIRequestMessage extends BaseMessage {
  type: 'AI_REQUEST';
  payload: AIRequestPayload;
}

export type Message =
  | PingMessage
  | GetConfigMessage
  | UpdateConfigMessage
  | ToggleUIMessage
  | AIRequestMessage;

/**
 * Response structure for messages
 */
export interface BaseMessageResponse {
  success: boolean;
  error?: string;
}

export interface PingResponse extends BaseMessageResponse {
  status: string;
  message: string;
}

export interface ConfigResponse extends BaseMessageResponse {
  config?: ExtensionConfig;
}

export interface AIResponseMessage extends BaseMessageResponse {
  result?: string;
}

export type MessageResponse =
  | BaseMessageResponse
  | PingResponse
  | ConfigResponse
  | AIResponseMessage;

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
