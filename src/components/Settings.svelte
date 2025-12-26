<script lang="ts">
  import { onMount } from 'svelte';
  import type { AIProviderConfig } from '../lib/ai';

  export let onClose: () => void = () => {};

  let providers: AIProviderConfig[] = [];
  let activeProviderId: string | null = null;
  let editingProvider: AIProviderConfig | null = null;
  let showAddForm = false;
  let testingProviderId: string | null = null;
  let testResult: { success: boolean; message: string } | null = null;

  // Form fields
  let formId = '';
  let formName = '';
  let formType: 'openai' | 'anthropic' | 'local' | 'custom' = 'openai';
  let formApiUrl = 'https://api.openai.com';
  let formApiKey = '';
  let formModel = 'gpt-3.5-turbo';
  let formTemperature = 0.7;
  let formMaxTokens = 2000;

  onMount(async () => {
    await loadProviders();
  });

  async function loadProviders() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PROVIDERS',
      });

      if (response.success) {
        providers = response.providers || [];
        activeProviderId = response.activeProviderId;
      }
    } catch (error) {
      console.error('[Settings] Failed to load providers:', error);
    }
  }

  function startAdd() {
    showAddForm = true;
    editingProvider = null;
    resetForm();
  }

  function startEdit(provider: AIProviderConfig) {
    editingProvider = provider;
    showAddForm = true;
    formId = provider.id;
    formName = provider.name;
    formType = provider.type;
    formApiUrl = provider.apiUrl;
    formApiKey = provider.apiKey || '';
    formModel = provider.model || 'gpt-3.5-turbo';
    formTemperature = provider.temperature ?? 0.7;
    formMaxTokens = provider.maxTokens ?? 2000;
  }

  function resetForm() {
    formId = `provider-${Date.now()}`;
    formName = '';
    formType = 'openai';
    formApiUrl = 'https://api.openai.com';
    formApiKey = '';
    formModel = 'gpt-3.5-turbo';
    formTemperature = 0.7;
    formMaxTokens = 2000;
  }

  function cancelEdit() {
    showAddForm = false;
    editingProvider = null;
    resetForm();
  }

  async function saveProvider() {
    const provider: AIProviderConfig = {
      id: formId,
      name: formName,
      type: formType,
      apiUrl: formApiUrl,
      apiKey: formApiKey || undefined,
      model: formModel,
      temperature: formTemperature,
      maxTokens: formMaxTokens,
      streamingEnabled: true,
    };

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_PROVIDER',
        provider,
      });

      if (response.success) {
        await loadProviders();
        cancelEdit();
      } else {
        alert(`Failed to save provider: ${response.error}`);
      }
    } catch (error) {
      console.error('[Settings] Failed to save provider:', error);
      alert('Failed to save provider');
    }
  }

  async function deleteProvider(id: string) {
    if (!confirm('Are you sure you want to delete this provider?')) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DELETE_PROVIDER',
        providerId: id,
      });

      if (response.success) {
        await loadProviders();
      } else {
        alert(`Failed to delete provider: ${response.error}`);
      }
    } catch (error) {
      console.error('[Settings] Failed to delete provider:', error);
    }
  }

  async function setActiveProvider(id: string) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_ACTIVE_PROVIDER',
        providerId: id,
      });

      if (response.success) {
        activeProviderId = id;
      } else {
        alert(`Failed to set active provider: ${response.error}`);
      }
    } catch (error) {
      console.error('[Settings] Failed to set active provider:', error);
    }
  }

  async function testProvider(id: string) {
    testingProviderId = id;
    testResult = null;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_PROVIDER',
        providerId: id,
      });

      testResult = response.success
        ? { success: true, message: 'Connection successful!' }
        : { success: false, message: response.error || 'Connection failed' };
    } catch (error) {
      testResult = { success: false, message: 'Test failed' };
    } finally {
      testingProviderId = null;
    }
  }

  function handleTypeChange() {
    // Update default URL based on type
    if (formType === 'openai') {
      formApiUrl = 'https://api.openai.com';
      formModel = 'gpt-3.5-turbo';
    } else if (formType === 'local') {
      formApiUrl = 'http://localhost:11434';
      formModel = 'llama2';
    }
  }
</script>

<div class="settings-panel flex flex-col h-full bg-white">
  <!-- Header -->
  <div
    class="header flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50"
  >
    <h2 class="text-lg font-semibold text-neutral-900">AI Provider Settings</h2>
    <button
      on:click={onClose}
      class="text-neutral-600 hover:text-neutral-900 transition-colors"
      aria-label="Close"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-4">
    {#if !showAddForm}
      <!-- Provider List -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-neutral-700">Configured Providers</h3>
          <button on:click={startAdd} class="btn-primary text-sm py-1 px-3"> Add Provider </button>
        </div>

        {#if providers.length === 0}
          <div class="text-center py-8 text-neutral-500">
            <p class="text-sm">No providers configured</p>
            <p class="text-xs mt-1">Add a provider to start using AI features</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each providers as provider}
              <div
                class="border border-neutral-200 rounded-lg p-3 {provider.id === activeProviderId
                  ? 'border-primary-500 bg-primary-50'
                  : ''}"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-neutral-900">{provider.name}</h4>
                      {#if provider.id === activeProviderId}
                        <span class="text-xs bg-primary-600 text-white px-2 py-0.5 rounded"
                          >Active</span
                        >
                      {/if}
                    </div>
                    <p class="text-xs text-neutral-600 mt-1">
                      {provider.type} • {provider.model || 'default model'}
                    </p>
                    <p class="text-xs text-neutral-500 mt-0.5">{provider.apiUrl}</p>
                  </div>
                  <div class="flex gap-1">
                    {#if provider.id !== activeProviderId}
                      <button
                        on:click={() => setActiveProvider(provider.id)}
                        class="text-xs text-primary-600 hover:text-primary-700 px-2 py-1"
                      >
                        Activate
                      </button>
                    {/if}
                    <button
                      on:click={() => testProvider(provider.id)}
                      disabled={testingProviderId === provider.id}
                      class="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1"
                    >
                      {testingProviderId === provider.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      on:click={() => startEdit(provider)}
                      class="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => deleteProvider(provider.id)}
                      class="text-xs text-error hover:text-error-dark px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {#if testResult && testingProviderId === null}
                  <div class="mt-2 text-xs {testResult.success ? 'text-success' : 'text-error'}">
                    {testResult.message}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Help Section -->
      <div class="mt-6 p-4 bg-neutral-50 rounded-lg">
        <h4 class="text-sm font-medium text-neutral-900 mb-2">Quick Start</h4>
        <div class="text-xs text-neutral-600 space-y-1">
          <p>• For OpenAI: Get your API key from https://platform.openai.com/api-keys</p>
          <p>• For local Ollama: Install from https://ollama.ai and run `ollama serve`</p>
          <p>• For custom endpoints: Use any OpenAI-compatible API</p>
        </div>
      </div>
    {:else}
      <!-- Add/Edit Form -->
      <div>
        <h3 class="text-sm font-medium text-neutral-700 mb-4">
          {editingProvider ? 'Edit Provider' : 'Add New Provider'}
        </h3>

        <form on:submit|preventDefault={saveProvider} class="space-y-4">
          <div>
            <label for="provider-name" class="block text-sm font-medium text-neutral-700 mb-1"
              >Provider Name</label
            >
            <input
              id="provider-name"
              type="text"
              bind:value={formName}
              required
              placeholder="My OpenAI Provider"
              class="input-field w-full"
            />
          </div>

          <div>
            <label for="provider-type" class="block text-sm font-medium text-neutral-700 mb-1"
              >Provider Type</label
            >
            <select
              id="provider-type"
              bind:value={formType}
              on:change={handleTypeChange}
              class="input-field w-full"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (OpenAI-compatible)</option>
              <option value="local">Local (Ollama, LM Studio)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label for="provider-api-url" class="block text-sm font-medium text-neutral-700 mb-1"
              >API URL</label
            >
            <input
              id="provider-api-url"
              type="url"
              bind:value={formApiUrl}
              required
              placeholder="https://api.openai.com"
              class="input-field w-full"
            />
          </div>

          <div>
            <label for="provider-api-key" class="block text-sm font-medium text-neutral-700 mb-1">
              API Key {formType === 'local' ? '(optional)' : ''}
            </label>
            <input
              id="provider-api-key"
              type="password"
              bind:value={formApiKey}
              required={formType !== 'local'}
              placeholder={formType === 'local' ? 'Leave empty for local' : 'sk-...'}
              class="input-field w-full"
            />
          </div>

          <div>
            <label for="provider-model" class="block text-sm font-medium text-neutral-700 mb-1"
              >Model</label
            >
            <input
              id="provider-model"
              type="text"
              bind:value={formModel}
              required
              placeholder="gpt-3.5-turbo"
              class="input-field w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="provider-temperature"
                class="block text-sm font-medium text-neutral-700 mb-1">Temperature</label
              >
              <input
                id="provider-temperature"
                type="number"
                bind:value={formTemperature}
                min="0"
                max="2"
                step="0.1"
                class="input-field w-full"
              />
            </div>
            <div>
              <label
                for="provider-max-tokens"
                class="block text-sm font-medium text-neutral-700 mb-1">Max Tokens</label
              >
              <input
                id="provider-max-tokens"
                type="number"
                bind:value={formMaxTokens}
                min="100"
                max="8000"
                step="100"
                class="input-field w-full"
              />
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button type="submit" class="btn-primary flex-1">
              {editingProvider ? 'Update Provider' : 'Add Provider'}
            </button>
            <button type="button" on:click={cancelEdit} class="btn-outline flex-1"> Cancel </button>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-panel {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
