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
  | 'AI_STREAM_CHUNK'
  | 'TOGGLE_UI'
  | 'GET_PAGE_CONTEXT'
  | 'SAVE_CONVERSATION'
  | 'GET_CONVERSATIONS'
  | 'GET_CONVERSATION'
  | 'DELETE_CONVERSATION';

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
  conversationId?: number;
  messageId?: number;
  streaming?: boolean;
}

export interface AIStreamChunkMessage extends BaseMessage {
  type: 'AI_STREAM_CHUNK';
  chunk: string;
  done: boolean;
  conversationId?: number;
  messageId?: number;
}

export type MessageResponse =
  | BaseMessageResponse
  | PingResponse
  | ConfigResponse
  | AIResponseMessage;

/**
 * Page context captured from the webpage
 */
export interface PageContext {
  url: string;
  title: string;
  selectedText?: string;
  domContext?: string;
  timestamp: number;
}

/**
 * AI request payload
 */
export interface AIRequestPayload {
  message: string;
  context?: PageContext;
  conversationId?: number;
  stream?: boolean;
}

/**
 * AI response structure
 */
export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
}
