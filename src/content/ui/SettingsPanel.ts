/**
 * Settings Panel Component
 * 
 * Provides UI for configuring AI providers and extension settings.
 */

import type { ExtensionConfig } from '../content/types';
import type { ProviderConfig } from '../providers/base-provider';

export class SettingsPanel {
  private container: HTMLElement;
  private config: ExtensionConfig;
  private panelElement: HTMLElement | null = null;
  private providers: ProviderConfig[] = [];

  constructor(container: HTMLElement, config: ExtensionConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Initialize the settings panel
   */
  async initialize(): Promise<void> {
    console.log('[SettingsPanel] Initializing');

    this.panelElement = document.createElement('div');
    this.panelElement.id = 'bettergpt-settings-panel';
    this.panelElement.style.cssText = `
      width: 100%;
      height: 100%;
      background: var(--color-background, white);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-y: auto;
    `;

    // Create header
    const header = this.createHeader();
    this.panelElement.appendChild(header);

    // Create content
    const content = await this.createContent();
    this.panelElement.appendChild(content);

    this.container.appendChild(this.panelElement);
    console.log('[SettingsPanel] Initialized');
  }

  /**
   * Create header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      background: var(--color-surface, #f5f5f5);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    header.appendChild(title);
    return header;
  }

  /**
   * Create content
   */
  private async createContent(): Promise<HTMLElement> {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      flex: 1;
    `;

    // Load providers
    await this.loadProviders();

    // AI Providers Section
    const providersSection = this.createProvidersSection();
    content.appendChild(providersSection);

    // General Settings Section
    const generalSection = this.createGeneralSettings();
    content.appendChild(generalSection);

    return content;
  }

  /**
   * Load providers from background
   */
  private async loadProviders(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PROVIDERS',
      });

      if (response.success) {
        this.providers = response.providers || [];
      }
    } catch (error) {
      console.error('[SettingsPanel] Error loading providers:', error);
    }
  }

  /**
   * Create providers section
   */
  private createProvidersSection(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 32px;
    `;

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'AI Providers';
    sectionTitle.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    section.appendChild(sectionTitle);

    // Provider list
    if (this.providers.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No providers configured. Add a provider to get started.';
      emptyMessage.style.cssText = `
        color: var(--color-textSecondary, #666);
        font-size: 14px;
      `;
      section.appendChild(emptyMessage);
    } else {
      for (const provider of this.providers) {
        const providerCard = this.createProviderCard(provider);
        section.appendChild(providerCard);
      }
    }

    // Add provider button
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Provider';
    addButton.style.cssText = `
      padding: 8px 16px;
      background: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 12px;
    `;
    addButton.onclick = () => this.showAddProviderDialog();
    section.appendChild(addButton);

    return section;
  }

  /**
   * Create provider card
   */
  private createProviderCard(provider: ProviderConfig): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 16px;
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: 8px;
      margin-bottom: 12px;
      background: var(--color-surface, #f9f9f9);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const name = document.createElement('h4');
    name.textContent = provider.name;
    name.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const enableToggle = document.createElement('button');
    enableToggle.textContent = provider.enabled ? 'Enabled' : 'Disabled';
    enableToggle.style.cssText = `
      padding: 4px 12px;
      background: ${provider.enabled ? 'var(--color-success, #28a745)' : 'var(--color-textSecondary, #666)'};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    enableToggle.onclick = () => this.toggleProvider(provider.id);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.style.cssText = `
      padding: 4px 12px;
      background: var(--color-primary, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    editButton.onclick = () => this.editProvider(provider);

    actions.appendChild(enableToggle);
    actions.appendChild(editButton);

    header.appendChild(name);
    header.appendChild(actions);

    const details = document.createElement('div');
    details.style.cssText = `
      font-size: 14px;
      color: var(--color-textSecondary, #666);
    `;

    const typeLabel = document.createElement('p');
    typeLabel.style.margin = '4px 0';
    typeLabel.innerHTML = `<strong>Type:</strong> ${provider.type}`;

    const modelLabel = document.createElement('p');
    modelLabel.style.margin = '4px 0';
    modelLabel.innerHTML = `<strong>Model:</strong> ${provider.model || 'default'}`;

    if (provider.endpoint) {
      const endpointLabel = document.createElement('p');
      endpointLabel.style.margin = '4px 0';
      endpointLabel.innerHTML = `<strong>Endpoint:</strong> ${provider.endpoint}`;
      details.appendChild(endpointLabel);
    }

    details.appendChild(typeLabel);
    details.appendChild(modelLabel);

    card.appendChild(header);
    card.appendChild(details);

    return card;
  }

  /**
   * Create general settings section
   */
  private createGeneralSettings(): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 32px;
    `;

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'General Settings';
    sectionTitle.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text, #333);
    `;

    section.appendChild(sectionTitle);

    // Theme setting
    const themeLabel = document.createElement('label');
    themeLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text, #333);
    `;
    themeLabel.textContent = 'Theme:';

    const themeSelect = document.createElement('select');
    themeSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 4px;
      font-size: 14px;
      background: var(--color-background, white);
      color: var(--color-text, #333);
    `;

    const themes = [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ];

    for (const theme of themes) {
      const option = document.createElement('option');
      option.value = theme.value;
      option.textContent = theme.label;
      option.selected = this.config.theme === theme.value;
      themeSelect.appendChild(option);
    }

    themeSelect.onchange = () => this.updateTheme(themeSelect.value as 'light' | 'dark' | 'system');

    section.appendChild(themeLabel);
    section.appendChild(themeSelect);

    return section;
  }

  /**
   * Show add provider dialog
   */
  private showAddProviderDialog(): void {
    alert('Add provider dialog - To be implemented with a proper modal');
    // TODO: Implement modal dialog for adding providers
  }

  /**
   * Edit provider
   */
  private editProvider(provider: ProviderConfig): void {
    alert(`Edit provider: ${provider.name} - To be implemented with a proper modal`);
    // TODO: Implement modal dialog for editing providers
  }

  /**
   * Toggle provider enabled/disabled
   */
  private async toggleProvider(providerId: string): Promise<void> {
    try {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) return;

      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_PROVIDER',
        providerId: providerId,
        providerConfig: {
          enabled: !provider.enabled,
        },
      });

      if (response.success) {
        // Reload providers
        await this.loadProviders();
        // Refresh UI
        const content = await this.createContent();
        if (this.panelElement) {
          const oldContent = this.panelElement.querySelector('div:last-child');
          if (oldContent) {
            this.panelElement.replaceChild(content, oldContent);
          }
        }
      }
    } catch (error) {
      console.error('[SettingsPanel] Error toggling provider:', error);
    }
  }

  /**
   * Update theme
   */
  private async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      this.config.theme = theme;
      await chrome.runtime.sendMessage({
        type: 'UPDATE_CONFIG',
        config: this.config,
      });
    } catch (error) {
      console.error('[SettingsPanel] Error updating theme:', error);
    }
  }

  /**
   * Show/hide panel
   */
  show(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'flex';
    }
  }

  hide(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Destroy the panel
   */
  destroy(): void {
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }
  }
}
