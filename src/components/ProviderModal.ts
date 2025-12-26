/**
 * Provider Configuration Modal
 * 
 * Modal dialog for adding and editing AI provider configurations
 */

import type { ProviderConfig } from '../../providers/base-provider';

export class ProviderModal {
  private modal: HTMLElement | null = null;
  private onSave: ((config: ProviderConfig) => void) | null = null;
  private onCancel: (() => void) | null = null;
  private editingProvider: ProviderConfig | null = null;

  /**
   * Show modal for adding a new provider
   */
  showAddProvider(onSave: (config: ProviderConfig) => void, onCancel: () => void): void {
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.editingProvider = null;
    this.createModal(null);
  }

  /**
   * Show modal for editing an existing provider
   */
  showEditProvider(
    provider: ProviderConfig,
    onSave: (config: ProviderConfig) => void,
    onCancel: () => void
  ): void {
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.editingProvider = provider;
    this.createModal(provider);
  }

  /**
   * Create and show modal
   */
  private createModal(provider: ProviderConfig | null): void {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      background: var(--color-background, white);
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Header
    const header = document.createElement('h2');
    header.textContent = provider ? 'Edit Provider' : 'Add Provider';
    header.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    this.modal.appendChild(header);

    // Form
    const form = this.createForm(provider);
    this.modal.appendChild(form);

    backdrop.appendChild(this.modal);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    });
  }

  /**
   * Create form
   */
  private createForm(provider: ProviderConfig | null): HTMLFormElement {
    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // Provider Name
    const nameGroup = this.createFormGroup('Name', 'text', provider?.name || '');
    const nameInput = nameGroup.querySelector('input') as HTMLInputElement;
    nameInput.required = true;
    form.appendChild(nameGroup);

    // Provider Type
    const typeGroup = this.createSelectGroup(
      'Type',
      [
        { value: 'openai', label: 'OpenAI' },
        { value: 'openai-compatible', label: 'OpenAI Compatible' },
        { value: 'local-proxy', label: 'Local Proxy' },
      ],
      provider?.type || 'openai'
    );
    const typeSelect = typeGroup.querySelector('select') as HTMLSelectElement;
    form.appendChild(typeGroup);

    // API Key (conditional)
    const apiKeyGroup = this.createFormGroup('API Key', 'password', provider?.apiKey || '');
    const apiKeyInput = apiKeyGroup.querySelector('input') as HTMLInputElement;
    apiKeyInput.placeholder = 'sk-...';
    form.appendChild(apiKeyGroup);

    // Endpoint URL (conditional)
    const endpointGroup = this.createFormGroup('Endpoint URL', 'url', provider?.endpoint || '');
    const endpointInput = endpointGroup.querySelector('input') as HTMLInputElement;
    endpointInput.placeholder = 'https://api.example.com/v1/chat/completions';
    form.appendChild(endpointGroup);

    // Model
    const modelGroup = this.createFormGroup('Model', 'text', provider?.model || 'gpt-3.5-turbo');
    const modelInput = modelGroup.querySelector('input') as HTMLInputElement;
    modelInput.placeholder = 'gpt-3.5-turbo';
    form.appendChild(modelGroup);

    // Max Tokens
    const maxTokensGroup = this.createFormGroup(
      'Max Tokens',
      'number',
      String(provider?.maxTokens || 1000)
    );
    const maxTokensInput = maxTokensGroup.querySelector('input') as HTMLInputElement;
    maxTokensInput.min = '1';
    maxTokensInput.max = '32000';
    form.appendChild(maxTokensGroup);

    // Temperature
    const temperatureGroup = this.createFormGroup(
      'Temperature',
      'number',
      String(provider?.temperature ?? 0.7)
    );
    const temperatureInput = temperatureGroup.querySelector('input') as HTMLInputElement;
    temperatureInput.min = '0';
    temperatureInput.max = '2';
    temperatureInput.step = '0.1';
    form.appendChild(temperatureGroup);

    // Show/hide fields based on type
    const updateFieldVisibility = () => {
      const type = typeSelect.value;
      if (type === 'openai') {
        apiKeyGroup.style.display = 'flex';
        endpointGroup.style.display = 'none';
        endpointInput.required = false;
      } else if (type === 'local-proxy') {
        apiKeyGroup.style.display = 'none';
        apiKeyInput.required = false;
        endpointGroup.style.display = 'flex';
        endpointInput.required = true;
      } else {
        // openai-compatible
        apiKeyGroup.style.display = 'flex';
        endpointGroup.style.display = 'flex';
        endpointInput.required = true;
      }
    };

    typeSelect.addEventListener('change', updateFieldVisibility);
    updateFieldVisibility();

    // Buttons
    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background: var(--color-surface, #f5f5f5);
      color: var(--color-text, #333);
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    cancelButton.onclick = () => this.close();

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;

    buttons.appendChild(cancelButton);
    buttons.appendChild(saveButton);
    form.appendChild(buttons);

    // Handle form submission
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSubmit(form);
    };

    return form;
  }

  /**
   * Create form group
   */
  private createFormGroup(label: string, type: string, value: string): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text, #333);
    `;

    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.name = label.toLowerCase().replace(/\s+/g, '_');
    input.style.cssText = `
      padding: 8px 12px;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      font-size: 14px;
      background: var(--color-background, white);
      color: var(--color-text, #333);
    `;

    group.appendChild(labelEl);
    group.appendChild(input);

    return group;
  }

  /**
   * Create select group
   */
  private createSelectGroup(
    label: string,
    options: Array<{ value: string; label: string }>,
    value: string
  ): HTMLElement {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text, #333);
    `;

    const select = document.createElement('select');
    select.name = label.toLowerCase().replace(/\s+/g, '_');
    select.style.cssText = `
      padding: 8px 12px;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      font-size: 14px;
      background: var(--color-background, white);
      color: var(--color-text, #333);
    `;

    for (const option of options) {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      optionEl.selected = option.value === value;
      select.appendChild(optionEl);
    }

    group.appendChild(labelEl);
    group.appendChild(select);

    return group;
  }

  /**
   * Handle form submission
   */
  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);

    const config: ProviderConfig = {
      id: this.editingProvider?.id || `provider_${Date.now()}`,
      name: formData.get('name') as string,
      type: formData.get('type') as 'openai' | 'openai-compatible' | 'local-proxy',
      enabled: this.editingProvider?.enabled ?? true,
      apiKey: formData.get('api_key') as string || undefined,
      endpoint: formData.get('endpoint_url') as string || undefined,
      model: formData.get('model') as string || undefined,
      maxTokens: parseInt(formData.get('max_tokens') as string) || undefined,
      temperature: parseFloat(formData.get('temperature') as string) || undefined,
    };

    if (this.onSave) {
      this.onSave(config);
    }

    this.close();
  }

  /**
   * Close modal
   */
  private close(): void {
    if (this.modal && this.modal.parentElement) {
      this.modal.parentElement.remove();
    }
    this.modal = null;

    if (this.onCancel) {
      this.onCancel();
    }
  }
}
