/**
 * Context Panel
 * 
 * UI component for managing conversation context:
 * - Display loaded context
 * - Manual context selection
 * - Token count visualization
 * - Truncation settings
 */

import type { Conversation, ConversationContext } from '../types';
import { contextManager, type ContextLoadResult } from '../../managers/context-manager';
import { conversationLinkManager } from '../../managers/conversation-link-manager';
import { formatTokenCount, getTokenUsageColor, getTokenLimit } from '../../utils/token-counter';

export class ContextPanel {
  private container: HTMLElement;
  private currentConversationId: string | null = null;
  private contextResult: ContextLoadResult | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initialize the context panel
   */
  async initialize(): Promise<void> {
    this.render();
  }

  /**
   * Load and display context for a conversation
   */
  async loadContext(conversationId: string): Promise<void> {
    this.currentConversationId = conversationId;
    
    try {
      // Load context
      this.contextResult = await contextManager.loadContext(conversationId);
      this.render();
    } catch (error) {
      console.error('[ContextPanel] Error loading context:', error);
      this.showError('Failed to load context');
    }
  }

  /**
   * Render the context panel
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header
    const header = this.createHeader();
    this.container.appendChild(header);

    if (!this.currentConversationId) {
      this.showEmptyState();
      return;
    }

    if (!this.contextResult) {
      this.showLoading();
      return;
    }

    // Token count indicator
    const tokenIndicator = this.createTokenIndicator();
    this.container.appendChild(tokenIndicator);

    // Context sources
    const sources = this.createSourcesSection();
    this.container.appendChild(sources);

    // Context settings
    const settings = this.createSettingsSection();
    this.container.appendChild(settings);

    // Message preview
    const preview = this.createPreviewSection();
    this.container.appendChild(preview);
  }

  /**
   * Create header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    `;

    header.innerHTML = `
      <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">
        Context Manager
      </h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
        Manage conversation context and linked conversations
      </p>
    `;

    return header;
  }

  /**
   * Create token count indicator
   */
  private createTokenIndicator(): HTMLElement {
    if (!this.contextResult) {
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.style.cssText = `
      padding: 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    `;

    // Get model and calculate percentage
    const model = 'gpt-4'; // TODO: Get from current conversation
    const limit = getTokenLimit(model);
    const percentage = (this.contextResult.totalTokens / limit) * 100;
    const color = getTokenUsageColor(percentage);

    container.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; font-weight: 600; color: #374151;">Token Usage</span>
          <span style="font-size: 12px; color: #6b7280;">
            ${formatTokenCount(this.contextResult.totalTokens)} / ${formatTokenCount(limit)}
          </span>
        </div>
        <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
          <div style="width: ${Math.min(percentage, 100)}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
        </div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
          ${percentage.toFixed(1)}% of model limit
        </div>
      </div>
      ${this.contextResult.truncated ? `
        <div style="padding: 8px; background: #fef3c7; border-radius: 4px; font-size: 11px; color: #92400e;">
          ⚠️ Context was truncated: ${this.contextResult.truncationReason}
        </div>
      ` : ''}
    `;

    return container;
  }

  /**
   * Create sources section
   */
  private createSourcesSection(): HTMLElement {
    if (!this.contextResult) {
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    `;

    const title = document.createElement('h4');
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = `Context Sources (${this.contextResult.sources.length})`;
    container.appendChild(title);

    if (this.contextResult.sources.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        padding: 12px;
        text-align: center;
        color: #9ca3af;
        font-size: 12px;
      `;
      empty.textContent = 'No linked contexts loaded';
      container.appendChild(empty);
      return container;
    }

    // List sources
    this.contextResult.sources.forEach(source => {
      const sourceItem = document.createElement('div');
      sourceItem.style.cssText = `
        padding: 8px;
        margin-bottom: 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 12px;
      `;

      sourceItem.innerHTML = `
        <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${source.title}</div>
        <div style="color: #6b7280;">
          ${source.messageCount} messages • ${formatTokenCount(source.tokens)} tokens
        </div>
      `;

      container.appendChild(sourceItem);
    });

    return container;
  }

  /**
   * Create settings section
   */
  private createSettingsSection(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
    `;

    const title = document.createElement('h4');
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = 'Context Settings';
    container.appendChild(title);

    // Auto-load settings
    const autoLoadParent = this.createCheckbox(
      'Auto-load parent conversation',
      true,
      (checked) => this.updateContextSetting('autoLoadParent', checked)
    );
    container.appendChild(autoLoadParent);

    const autoLoadLinks = this.createCheckbox(
      'Auto-load linked conversations',
      false,
      (checked) => this.updateContextSetting('autoLoadLinks', checked)
    );
    container.appendChild(autoLoadLinks);

    // Truncation strategy
    const strategyLabel = document.createElement('label');
    strategyLabel.style.cssText = `
      display: block;
      margin-top: 12px;
      font-size: 12px;
      color: #374151;
      margin-bottom: 4px;
    `;
    strategyLabel.textContent = 'Truncation Strategy';
    container.appendChild(strategyLabel);

    const strategySelect = document.createElement('select');
    strategySelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      background: white;
    `;
    strategySelect.innerHTML = `
      <option value="balanced">Balanced (recommended)</option>
      <option value="recent">Keep Most Recent</option>
      <option value="relevant">Keep Most Relevant</option>
    `;
    strategySelect.addEventListener('change', (e) => {
      this.updateContextSetting('truncationStrategy', (e.target as HTMLSelectElement).value);
    });
    container.appendChild(strategySelect);

    return container;
  }

  /**
   * Create preview section
   */
  private createPreviewSection(): HTMLElement {
    if (!this.contextResult) {
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.style.cssText = `
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    `;

    const title = document.createElement('h4');
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = `Message Preview (${this.contextResult.messages.length})`;
    container.appendChild(title);

    // Show first few messages
    const previewCount = Math.min(5, this.contextResult.messages.length);
    this.contextResult.messages.slice(0, previewCount).forEach(message => {
      const messageItem = document.createElement('div');
      messageItem.style.cssText = `
        padding: 8px;
        margin-bottom: 8px;
        background: ${message.role === 'user' ? '#eff6ff' : '#f9fafb'};
        border-radius: 6px;
        font-size: 12px;
      `;

      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      const preview = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');

      messageItem.innerHTML = `
        <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${roleLabel}</div>
        <div style="color: #4b5563;">${preview}</div>
      `;

      container.appendChild(messageItem);
    });

    if (this.contextResult.messages.length > previewCount) {
      const more = document.createElement('div');
      more.style.cssText = `
        padding: 8px;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
      `;
      more.textContent = `+ ${this.contextResult.messages.length - previewCount} more messages`;
      container.appendChild(more);
    }

    return container;
  }

  /**
   * Create checkbox with label
   */
  private createCheckbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
    const container = document.createElement('label');
    container.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #374151;
      cursor: pointer;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.style.cssText = `
      margin-right: 8px;
      cursor: pointer;
    `;
    checkbox.addEventListener('change', (e) => {
      onChange((e.target as HTMLInputElement).checked);
    });

    container.appendChild(checkbox);
    container.appendChild(document.createTextNode(label));

    return container;
  }

  /**
   * Update context setting
   */
  private async updateContextSetting(key: string, value: any): Promise<void> {
    if (!this.currentConversationId) return;

    try {
      let config = await contextManager.getContextConfig(this.currentConversationId);
      
      if (!config) {
        config = contextManager.createDefaultContext(this.currentConversationId);
      }

      (config as any)[key] = value;
      await contextManager.saveContextConfig(this.currentConversationId, config);

      // Reload context
      await this.loadContext(this.currentConversationId);
    } catch (error) {
      console.error('[ContextPanel] Error updating context setting:', error);
    }
  }

  /**
   * Show empty state
   */
  private showEmptyState(): void {
    const empty = document.createElement('div');
    empty.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-size: 14px;
    `;
    empty.textContent = 'Select a conversation to view context';
    this.container.appendChild(empty);
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    const loading = document.createElement('div');
    loading.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 14px;
    `;
    loading.textContent = 'Loading context...';
    this.container.appendChild(loading);
  }

  /**
   * Show error
   */
  private showError(message: string): void {
    const error = document.createElement('div');
    error.style.cssText = `
      padding: 16px;
      background: #fee2e2;
      color: #991b1b;
      font-size: 12px;
      border-radius: 6px;
      margin: 16px;
    `;
    error.textContent = message;
    this.container.appendChild(error);
  }

  /**
   * Destroy the panel
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}
