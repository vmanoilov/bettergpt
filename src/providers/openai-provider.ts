/**
 * OpenAI Provider Implementation
 * 
 * Implements the BaseAIProvider interface for OpenAI and OpenAI-compatible APIs.
 * Supports both standard OpenAI API and custom endpoints (local proxies).
 */

import {
  BaseAIProvider,
  AIRequestOptions,
  AIResponse,
  AIStreamChunk,
  ProviderConfig,
} from './base-provider';

const DEFAULT_OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-3.5-turbo';
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TEMPERATURE = 0.7;
const REQUEST_TIMEOUT = 60000; // 60 seconds

interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface OpenAIResponse {
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

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIProvider extends BaseAIProvider {
  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // For OpenAI, API key is required unless it's a local proxy
    if (this.config.type === 'openai' && !this.config.apiKey) {
      errors.push('API key is required for OpenAI provider');
    }

    // For local proxy or openai-compatible, endpoint is required
    if (
      (this.config.type === 'local-proxy' || this.config.type === 'openai-compatible') &&
      !this.config.endpoint
    ) {
      errors.push('Endpoint is required for local proxy and OpenAI-compatible providers');
    }

    // Validate endpoint URL if provided
    if (this.config.endpoint) {
      try {
        new URL(this.config.endpoint);
      } catch {
        errors.push('Invalid endpoint URL');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test connection to the provider
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // Send a simple test request
      const response = await this.sendRequest({
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 5,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a request to OpenAI
   */
  async sendRequest(options: AIRequestOptions): Promise<AIResponse> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw this.createError(validation.errors.join(', '), 'INVALID_CONFIG');
    }

    const endpoint = this.getEndpoint();
    const requestBody = this.buildRequest(options, false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: OpenAIResponse = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('Request timeout', 'TIMEOUT');
        }
        throw this.createError(error.message, 'REQUEST_FAILED');
      }
      throw this.createError(String(error), 'UNKNOWN_ERROR');
    }
  }

  /**
   * Send a streaming request to OpenAI
   */
  async sendStreamingRequest(
    options: AIRequestOptions,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw this.createError(validation.errors.join(', '), 'INVALID_CONFIG');
    }

    const endpoint = this.getEndpoint();
    const requestBody = this.buildRequest(options, true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw this.createError('No response body', 'NO_RESPONSE_BODY');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') {
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data: OpenAIStreamChunk = JSON.parse(jsonStr);

              if (data.choices && data.choices.length > 0) {
                const choice = data.choices[0];
                const content = choice.delta?.content || '';
                const finishReason = choice.finish_reason;

                onChunk({
                  content,
                  done: finishReason !== null,
                  finishReason: finishReason || undefined,
                });

                if (finishReason) {
                  return;
                }
              }
            } catch (error) {
              console.error('[OpenAIProvider] Error parsing stream chunk:', error);
            }
          }
        }
      }

      // Final chunk to signal completion
      onChunk({ content: '', done: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('Request timeout', 'TIMEOUT');
        }
        throw this.createError(error.message, 'STREAM_FAILED');
      }
      throw this.createError(String(error), 'UNKNOWN_ERROR');
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    // For now, return common OpenAI models
    // In the future, we could fetch this from the API
    return [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }

  /**
   * Get the API endpoint
   */
  private getEndpoint(): string {
    return this.config.endpoint || DEFAULT_OPENAI_ENDPOINT;
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Build OpenAI request body
   */
  private buildRequest(options: AIRequestOptions, stream: boolean): OpenAIRequest {
    return {
      model: options.model || this.config.model || DEFAULT_MODEL,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: options.maxTokens || this.config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: options.temperature ?? this.config.temperature ?? DEFAULT_TEMPERATURE,
      stream,
    };
  }

  /**
   * Parse OpenAI response
   */
  private parseResponse(data: OpenAIResponse): AIResponse {
    if (!data.choices || data.choices.length === 0) {
      throw this.createError('No choices in response', 'NO_CHOICES');
    }

    const choice = data.choices[0];
    return {
      content: choice.message.content,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Handle error response from API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = 'HTTP_ERROR';

    try {
      const errorData: OpenAIErrorResponse = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error.message;
        errorCode = errorData.error.code || errorData.error.type;
      }
    } catch {
      // If we can't parse the error, use the default message
    }

    throw this.createError(errorMessage, errorCode, response.status);
  }
}
