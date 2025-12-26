/**
 * Base Provider Interface for AI Providers
 * 
 * This interface defines the contract that all AI providers must implement.
 * Providers can be OpenAI-compatible APIs, local proxies, or other AI services.
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
}

export interface AIResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'openai-compatible' | 'local-proxy';
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProviderError extends Error {
  code?: string;
  statusCode?: number;
  provider?: string;
}

/**
 * Base class for all AI providers
 */
export abstract class BaseAIProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Validate provider configuration
   */
  abstract validateConfig(): { valid: boolean; errors: string[] };

  /**
   * Test provider connection
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Send a request to the AI provider
   */
  abstract sendRequest(options: AIRequestOptions): Promise<AIResponse>;

  /**
   * Send a streaming request to the AI provider
   */
  abstract sendStreamingRequest(
    options: AIRequestOptions,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;

  /**
   * Get available models for this provider
   */
  abstract getAvailableModels(): Promise<string[]>;

  /**
   * Create a provider-specific error
   */
  protected createError(message: string, code?: string, statusCode?: number): AIProviderError {
    const error = new Error(message) as AIProviderError;
    error.code = code;
    error.statusCode = statusCode;
    error.provider = this.config.id;
    return error;
  }
}
