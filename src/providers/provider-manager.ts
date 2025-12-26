/**
 * Provider Manager
 * 
 * Manages multiple AI providers and handles provider selection,
 * configuration persistence, and provider lifecycle.
 */

import { BaseAIProvider, ProviderConfig, AIRequestOptions, AIResponse, AIStreamChunk } from './base-provider';
import { OpenAIProvider } from './openai-provider';

const STORAGE_KEY = 'ai_providers';
const ACTIVE_PROVIDER_KEY = 'active_provider_id';

export class ProviderManager {
  private providers: Map<string, BaseAIProvider> = new Map();
  private activeProviderId: string | null = null;

  /**
   * Initialize the provider manager
   */
  async initialize(): Promise<void> {
    console.log('[ProviderManager] Initializing...');
    
    // Load providers from storage
    await this.loadProviders();
    
    // Load active provider
    await this.loadActiveProvider();
    
    console.log('[ProviderManager] Initialized with', this.providers.size, 'providers');
  }

  /**
   * Register a new provider
   */
  async registerProvider(config: ProviderConfig): Promise<void> {
    const provider = this.createProvider(config);
    this.providers.set(config.id, provider);
    await this.saveProviders();
    console.log('[ProviderManager] Registered provider:', config.id);
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    this.providers.delete(providerId);
    
    if (this.activeProviderId === providerId) {
      this.activeProviderId = null;
      await this.saveActiveProvider();
    }
    
    await this.saveProviders();
    console.log('[ProviderManager] Unregistered provider:', providerId);
  }

  /**
   * Update provider configuration or add new provider
   */
  async updateProvider(providerId: string, config: Partial<ProviderConfig>): Promise<void> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      // If provider doesn't exist and we have a full config, create it
      if (config.id && config.name && config.type !== undefined && config.enabled !== undefined) {
        await this.registerProvider(config as ProviderConfig);
        console.log('[ProviderManager] Created new provider:', providerId);
        return;
      } else {
        throw new Error(`Provider not found and incomplete config provided: ${providerId}`);
      }
    }

    provider.updateConfig(config);
    await this.saveProviders();
    console.log('[ProviderManager] Updated provider:', providerId);
  }

  /**
   * Get a provider by ID
   */
  getProvider(providerId: string): BaseAIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all providers
   */
  getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).map(p => p.getConfig());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): ProviderConfig[] {
    return this.getAllProviders().filter(p => p.enabled);
  }

  /**
   * Set active provider
   */
  async setActiveProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const config = provider.getConfig();
    if (!config.enabled) {
      throw new Error(`Provider is disabled: ${providerId}`);
    }

    this.activeProviderId = providerId;
    await this.saveActiveProvider();
    console.log('[ProviderManager] Active provider set to:', providerId);
  }

  /**
   * Get active provider
   */
  getActiveProvider(): BaseAIProvider | null {
    if (!this.activeProviderId) {
      return null;
    }
    return this.providers.get(this.activeProviderId) || null;
  }

  /**
   * Get active provider ID
   */
  getActiveProviderId(): string | null {
    return this.activeProviderId;
  }

  /**
   * Send request using active provider
   */
  async sendRequest(options: AIRequestOptions): Promise<AIResponse> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active provider configured');
    }

    return provider.sendRequest(options);
  }

  /**
   * Send streaming request using active provider
   */
  async sendStreamingRequest(
    options: AIRequestOptions,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active provider configured');
    }

    return provider.sendStreamingRequest(options, onChunk);
  }

  /**
   * Test provider connection
   */
  async testProvider(providerId: string): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    return provider.testConnection();
  }

  /**
   * Validate provider configuration
   */
  validateProvider(providerId: string): { valid: boolean; errors: string[] } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { valid: false, errors: ['Provider not found'] };
    }

    return provider.validateConfig();
  }

  /**
   * Create a provider instance from configuration
   */
  private createProvider(config: ProviderConfig): BaseAIProvider {
    switch (config.type) {
      case 'openai':
      case 'openai-compatible':
      case 'local-proxy':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  /**
   * Load providers from storage
   */
  private async loadProviders(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const configs: ProviderConfig[] = result[STORAGE_KEY] || [];

      // If no providers exist, create a default OpenAI provider
      if (configs.length === 0) {
        const defaultConfig: ProviderConfig = {
          id: 'openai-default',
          name: 'OpenAI',
          type: 'openai',
          enabled: false, // Disabled by default until API key is set
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7,
        };
        configs.push(defaultConfig);
      }

      for (const config of configs) {
        const provider = this.createProvider(config);
        this.providers.set(config.id, provider);
      }

      console.log('[ProviderManager] Loaded', this.providers.size, 'providers');
    } catch (error) {
      console.error('[ProviderManager] Error loading providers:', error);
    }
  }

  /**
   * Save providers to storage
   */
  private async saveProviders(): Promise<void> {
    try {
      const configs = Array.from(this.providers.values()).map(p => p.getConfig());
      await chrome.storage.local.set({ [STORAGE_KEY]: configs });
      console.log('[ProviderManager] Saved', configs.length, 'providers');
    } catch (error) {
      console.error('[ProviderManager] Error saving providers:', error);
    }
  }

  /**
   * Load active provider from storage
   */
  private async loadActiveProvider(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(ACTIVE_PROVIDER_KEY);
      this.activeProviderId = result[ACTIVE_PROVIDER_KEY] || null;

      // If no active provider but we have enabled providers, set the first one
      if (!this.activeProviderId) {
        const enabledProviders = this.getEnabledProviders();
        if (enabledProviders.length > 0) {
          this.activeProviderId = enabledProviders[0].id;
          await this.saveActiveProvider();
        }
      }

      console.log('[ProviderManager] Active provider:', this.activeProviderId || 'none');
    } catch (error) {
      console.error('[ProviderManager] Error loading active provider:', error);
    }
  }

  /**
   * Save active provider to storage
   */
  private async saveActiveProvider(): Promise<void> {
    try {
      await chrome.storage.local.set({ [ACTIVE_PROVIDER_KEY]: this.activeProviderId });
      console.log('[ProviderManager] Saved active provider:', this.activeProviderId);
    } catch (error) {
      console.error('[ProviderManager] Error saving active provider:', error);
    }
  }
}

// Singleton instance
export const providerManager = new ProviderManager();
