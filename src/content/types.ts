/**
 * Type definitions for BetterGPT Chrome Extension
 */

/**
 * Extension configuration interface
 */
export interface ExtensionConfig {
  enabled: boolean;
  theme: 'light' | 'dark' | 'system';
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

/**
 * Conversation-related types for Phase 2
 */

/**
 * Message in a conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
  streaming?: boolean;
  tokens?: number;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'code';
  name: string;
  url?: string;
  content?: string;
  mimeType?: string;
}

/**
 * Conversation link type
 */
export type ConversationLinkType = 'fork' | 'continuation' | 'reference';

/**
 * Conversation link
 */
export interface ConversationLink {
  id: string;
  sourceId: string; // Source conversation
  targetId: string; // Target conversation
  type: ConversationLinkType;
  messageId?: string; // Fork point (message where fork occurred)
  createdAt: number;
  metadata?: {
    forkMessage?: string; // Message content at fork point
    reason?: string; // Optional reason for the link
  };
}

/**
 * Context configuration
 */
export interface ConversationContext {
  conversationId: string;
  includedLinks: string[]; // IDs of linked conversations to include
  autoLoadParent: boolean; // Auto-load parent conversation context
  autoLoadLinks: boolean; // Auto-load linked conversations context
  maxTokens?: number; // Maximum context tokens to load
  truncationStrategy?: 'recent' | 'relevant' | 'balanced';
}

/**
 * Conversation metadata
 */
export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  folderId?: string;
  parentId?: string; // For thread relationships (deprecated, use links instead)
  links?: ConversationLink[]; // Conversation links
  context?: ConversationContext; // Context configuration
  isArchived: boolean;
  isFavorite: boolean;
  totalTokens?: number;
  tags?: string[];
}

/**
 * Folder for organizing conversations
 */
export interface Folder {
  id: string;
  name: string;
  parentId?: string; // For nested folders
  createdAt: number;
  updatedAt: number;
  color?: string;
  icon?: string;
}

/**
 * ChatGPT API request/response types
 */
export interface ChatGPTRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatGPTResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
