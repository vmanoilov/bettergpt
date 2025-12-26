/**
 * AI Provider Factory and Manager
 *
 * Creates and manages AI provider instances
 */

import type { AIProvider, AIProviderConfig } from './types';
import { OpenAICompatibleProvider } from './openai-provider';

/**
 * Default provider configurations
 */
export const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai-gpt-3.5',
    name: 'OpenAI GPT-3.5 Turbo',
    type: 'openai',
    apiUrl: 'https://api.openai.com',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    streamingEnabled: true,
  },
  {
    id: 'openai-gpt-4',
    name: 'OpenAI GPT-4',
    type: 'openai',
    apiUrl: 'https://api.openai.com',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    streamingEnabled: true,
  },
  {
    id: 'local-ollama',
    name: 'Local Ollama',
    type: 'local',
    apiUrl: 'http://localhost:11434',
    model: 'llama2',
    temperature: 0.7,
    maxTokens: 2000,
    streamingEnabled: true,
  },
];

/**
 * Create an AI provider instance based on config
 */
export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'openai':
    case 'anthropic':
    case 'local':
    case 'custom':
      // All use OpenAI-compatible format
      return new OpenAICompatibleProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

/**
 * AI Provider Manager
 *
 * Manages provider configurations and creates provider instances
 */
export class AIProviderManager {
  private static instance: AIProviderManager;
  private providers: Map<string, AIProviderConfig> = new Map();
  private activeProviderId: string | null = null;

  private constructor() {
    // Initialize with default providers
    for (const provider of DEFAULT_PROVIDERS) {
      this.providers.set(provider.id, provider);
    }
  }

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  /**
   * Load providers from storage
   */
  async loadFromStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['aiProviders', 'activeProviderId']);

      if (result.aiProviders) {
        this.providers.clear();
        for (const provider of result.aiProviders) {
          this.providers.set(provider.id, provider);
        }
      }

      if (result.activeProviderId) {
        this.activeProviderId = result.activeProviderId;
      }
    } catch (error) {
      console.error('[AIProviderManager] Failed to load from storage:', error);
    }
  }

  /**
   * Save providers to storage
   */
  async saveToStorage(): Promise<void> {
    try {
      await chrome.storage.local.set({
        aiProviders: Array.from(this.providers.values()),
        activeProviderId: this.activeProviderId,
      });
    } catch (error) {
      console.error('[AIProviderManager] Failed to save to storage:', error);
    }
  }

  /**
   * Get all providers
   */
  getProviders(): AIProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider config
   */
  getProvider(id: string): AIProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Get the active provider config
   */
  getActiveProvider(): AIProviderConfig | null {
    if (!this.activeProviderId) {
      return null;
    }
    return this.providers.get(this.activeProviderId) || null;
  }

  /**
   * Set the active provider
   */
  async setActiveProvider(id: string): Promise<void> {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not found`);
    }
    this.activeProviderId = id;
    await this.saveToStorage();
  }

  /**
   * Add or update a provider
   */
  async addOrUpdateProvider(config: AIProviderConfig): Promise<void> {
    this.providers.set(config.id, config);
    await this.saveToStorage();
  }

  /**
   * Remove a provider
   */
  async removeProvider(id: string): Promise<void> {
    this.providers.delete(id);
    if (this.activeProviderId === id) {
      this.activeProviderId = null;
    }
    await this.saveToStorage();
  }

  /**
   * Create a provider instance
   */
  createProviderInstance(id?: string): AIProvider | null {
    const config = id ? this.getProvider(id) : this.getActiveProvider();
    if (!config) {
      return null;
    }
    return createProvider(config);
  }
}
