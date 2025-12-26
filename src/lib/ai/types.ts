/**
 * AI Provider Interface
 *
 * Defines the contract for AI providers that can be plugged into the extension
 */

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  apiUrl: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streamingEnabled?: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
}

/**
 * Base AI Provider Interface
 */
export interface AIProvider {
  readonly config: AIProviderConfig;

  /**
   * Test the provider connection
   */
  testConnection(): Promise<boolean>;

  /**
   * Send a request to the AI provider
   */
  sendRequest(options: AIRequestOptions): Promise<AIResponse>;

  /**
   * Send a streaming request to the AI provider
   */
  sendStreamRequest(
    options: AIRequestOptions,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;
}

/**
 * AI Provider Error
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
