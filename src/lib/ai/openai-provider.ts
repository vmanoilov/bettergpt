/**
 * OpenAI-Compatible AI Provider
 *
 * Supports OpenAI API and any compatible endpoints (OpenRouter, LocalAI, Ollama, etc.)
 */

import type {
  AIProvider,
  AIProviderConfig,
  AIRequestOptions,
  AIResponse,
  AIStreamChunk,
} from './types';
import { AIProviderError } from './types';

export class OpenAICompatibleProvider implements AIProvider {
  constructor(public readonly config: AIProviderConfig) {}

  /**
   * Test the provider connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch models endpoint
      const response = await fetch(`${this.config.apiUrl}/v1/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('[OpenAIProvider] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Send a non-streaming request
   */
  async sendRequest(options: AIRequestOptions): Promise<AIResponse> {
    const requestBody = {
      model: options.model || this.config.model || 'gpt-3.5-turbo',
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 2000,
      stream: false,
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIProviderError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.code,
          response.status
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new AIProviderError('No response from AI provider');
      }

      return {
        content: choice.message?.content || '',
        finishReason: choice.finish_reason,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(error instanceof Error ? error.message : 'Failed to send request');
    }
  }

  /**
   * Send a streaming request
   */
  async sendStreamRequest(
    options: AIRequestOptions,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const requestBody = {
      model: options.model || this.config.model || 'gpt-3.5-turbo',
      messages: options.messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? this.config.maxTokens ?? 2000,
      stream: true,
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIProviderError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.code,
          response.status
        );
      }

      if (!response.body) {
        throw new AIProviderError('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isReading = true;

      while (isReading) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk({ content: '', done: true });
          isReading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.substring(6);
              const data = JSON.parse(jsonStr);
              const delta = data.choices?.[0]?.delta;

              if (delta?.content) {
                onChunk({
                  content: delta.content,
                  done: false,
                });
              }

              if (data.choices?.[0]?.finish_reason) {
                onChunk({
                  content: '',
                  done: true,
                  finishReason: data.choices[0].finish_reason,
                });
              }
            } catch (parseError) {
              console.warn('[OpenAIProvider] Failed to parse chunk:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Failed to stream request'
      );
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
