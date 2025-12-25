/**
 * Conversation Browser
 * 
 * Enhanced conversation list with threading and linking features:
 * - Display conversations with their relationships
 * - Fork and continue actions
 * - Link management
 * - Graph view toggle
 */

import type { Conversation, ConversationLink } from '../types';
import { db } from '../../data/database';
import { conversationLinkManager } from '../../managers/conversation-link-manager';
import { ConversationGraphVisualizer } from './ConversationGraph';
import { ContextPanel } from './ContextPanel';

type ViewMode = 'list' | 'graph' | 'context';

export class ConversationBrowser {
  private container: HTMLElement;
  private viewMode: ViewMode = 'list';
  private selectedConversationId: string | null = null;
  private graphVisualizer: ConversationGraphVisualizer | null = null;
  private contextPanel: ContextPanel | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    await this.render();
  }

  /**
   * Render the browser
   */
  async render(): Promise<void> {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header with view mode toggle
    const header = this.createHeader();
    this.container.appendChild(header);

    // Content area based on view mode
    const content = await this.createContent();
    this.container.appendChild(content);
  }

  /**
   * Create header with view mode toggle
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    `;

    const titleRow = document.createElement('div');
    titleRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    `;
    title.textContent = 'Conversations';

    titleRow.appendChild(title);
    header.appendChild(titleRow);

    // View mode toggle
    const viewToggle = document.createElement('div');
    viewToggle.style.cssText = `
      display: flex;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 2px;
    `;

    const modes: Array<{ mode: ViewMode; label: string; icon: string }> = [
      { mode: 'list', label: 'List', icon: '📋' },
      { mode: 'graph', label: 'Graph', icon: '🔗' },
      { mode: 'context', label: 'Context', icon: '⚙️' },
    ];

    modes.forEach(({ mode, label, icon }) => {
      const button = document.createElement('button');
      button.style.cssText = `
        padding: 6px 12px;
        border: none;
        background: ${this.viewMode === mode ? '#3b82f6' : 'transparent'};
        color: ${this.viewMode === mode ? '#ffffff' : '#6b7280'};
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      `;
      button.textContent = `${icon} ${label}`;
      button.onclick = async () => {
        this.viewMode = mode;
        await this.render();
      };
      viewToggle.appendChild(button);
    });

    header.appendChild(viewToggle);

    return header;
  }

  /**
   * Create content based on view mode
   */
  private async createContent(): Promise<HTMLElement> {
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;

    switch (this.viewMode) {
      case 'list':
        await this.renderListView(content);
        break;
      case 'graph':
        await this.renderGraphView(content);
        break;
      case 'context':
        await this.renderContextView(content);
        break;
    }

    return content;
  }

  /**
   * Render list view
   */
  private async renderListView(container: HTMLElement): Promise<void> {
    const conversations = await db.getActiveConversations();

    if (conversations.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;
      `;
      empty.textContent = 'No conversations yet';
      container.appendChild(empty);
      return;
    }

    for (const conversation of conversations) {
      const item = await this.createConversationItem(conversation);
      container.appendChild(item);
    }
  }

  /**
   * Create conversation item with actions
   */
  private async createConversationItem(conversation: Conversation): Promise<HTMLElement> {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px;
      margin-bottom: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
      cursor: pointer;
    `;
    item.onmouseenter = () => {
      item.style.background = '#f3f4f6';
      item.style.borderColor = '#d1d5db';
    };
    item.onmouseleave = () => {
      item.style.background = '#f9fafb';
      item.style.borderColor = '#e5e7eb';
    };

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
      font-size: 14px;
    `;
    title.textContent = conversation.title;
    item.appendChild(title);

    // Metadata
    const meta = document.createElement('div');
    meta.style.cssText = `
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 8px;
    `;
    meta.textContent = `${conversation.messages.length} messages • ${conversation.model}`;
    item.appendChild(meta);

    // Get links
    const { outgoing, incoming } = await conversationLinkManager.getLinks(conversation.id);
    const totalLinks = outgoing.length + incoming.length;

    if (totalLinks > 0) {
      const linksBadge = document.createElement('div');
      linksBadge.style.cssText = `
        display: inline-block;
        padding: 2px 8px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 8px;
      `;
      linksBadge.textContent = `🔗 ${totalLinks} link${totalLinks > 1 ? 's' : ''}`;
      item.appendChild(linksBadge);
    }

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 8px;
    `;

    // View button
    const viewBtn = this.createActionButton('View', '#3b82f6', () => {
      this.selectedConversationId = conversation.id;
      this.viewMode = 'context';
      this.render();
    });
    actions.appendChild(viewBtn);

    // Fork button
    const forkBtn = this.createActionButton('Fork', '#10b981', async () => {
      await this.handleFork(conversation);
    });
    actions.appendChild(forkBtn);

    // Continue button
    const continueBtn = this.createActionButton('Continue', '#8b5cf6', async () => {
      await this.handleContinue(conversation);
    });
    actions.appendChild(continueBtn);

    item.appendChild(actions);

    return item;
  }

  /**
   * Create action button
   */
  private createActionButton(label: string, color: string, onclick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.style.cssText = `
      padding: 4px 12px;
      background: ${color};
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      font-weight: 500;
      transition: opacity 0.2s;
    `;
    button.textContent = label;
    button.onclick = (e) => {
      e.stopPropagation();
      onclick();
    };
    button.onmouseenter = () => {
      button.style.opacity = '0.8';
    };
    button.onmouseleave = () => {
      button.style.opacity = '1';
    };
    return button;
  }

  /**
   * Handle fork action
   */
  private async handleFork(conversation: Conversation): Promise<void> {
    if (conversation.messages.length === 0) {
      alert('Cannot fork: conversation has no messages');
      return;
    }

    // Fork at the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    try {
      const result = await conversationLinkManager.forkAtMessage(
        conversation.id,
        lastMessage.id,
        {
          title: `Fork of ${conversation.title}`,
          model: conversation.model,
        }
      );

      console.log('[ConversationBrowser] Created fork:', result.conversation.id);
      alert(`Successfully forked conversation: ${result.conversation.title}`);
      await this.render();
    } catch (error) {
      console.error('[ConversationBrowser] Fork error:', error);
      alert('Failed to fork conversation');
    }
  }

  /**
   * Handle continue action
   */
  private async handleContinue(conversation: Conversation): Promise<void> {
    try {
      const result = await conversationLinkManager.continueFromConversation(
        conversation.id,
        {
          title: `Continued: ${conversation.title}`,
          model: conversation.model,
        },
        {
          includeAllMessages: true,
        }
      );

      console.log('[ConversationBrowser] Created continuation:', result.conversation.id);
      alert(`Successfully created continuation: ${result.conversation.title}`);
      await this.render();
    } catch (error) {
      console.error('[ConversationBrowser] Continue error:', error);
      alert('Failed to continue conversation');
    }
  }

  /**
   * Render graph view
   */
  private async renderGraphView(container: HTMLElement): Promise<void> {
    const graphContainer = document.createElement('div');
    graphContainer.style.cssText = `
      width: 100%;
      height: 500px;
    `;
    container.appendChild(graphContainer);

    // Build and render graph
    try {
      const graph = await conversationLinkManager.buildGraph();
      
      this.graphVisualizer = new ConversationGraphVisualizer(graphContainer, {
        width: graphContainer.clientWidth,
        height: 500,
        onNodeClick: (conversation) => {
          this.selectedConversationId = conversation.id;
          this.viewMode = 'context';
          this.render();
        },
        onNodeHover: (conversation) => {
          // Could show a tooltip
        },
      });

      this.graphVisualizer.render(graph);
    } catch (error) {
      console.error('[ConversationBrowser] Graph render error:', error);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        padding: 20px;
        text-align: center;
        color: #ef4444;
      `;
      errorDiv.textContent = 'Failed to render conversation graph';
      container.appendChild(errorDiv);
    }
  }

  /**
   * Render context view
   */
  private async renderContextView(container: HTMLElement): Promise<void> {
    if (!this.selectedConversationId) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;
      `;
      empty.textContent = 'Select a conversation to view context';
      container.appendChild(empty);
      return;
    }

    const contextContainer = document.createElement('div');
    contextContainer.style.cssText = `
      width: 100%;
      height: 100%;
    `;
    container.appendChild(contextContainer);

    this.contextPanel = new ContextPanel(contextContainer);
    await this.contextPanel.initialize();
    await this.contextPanel.loadContext(this.selectedConversationId);
  }

  /**
   * Destroy the browser
   */
  destroy(): void {
    if (this.graphVisualizer) {
      this.graphVisualizer.destroy();
      this.graphVisualizer = null;
    }
    if (this.contextPanel) {
      this.contextPanel.destroy();
      this.contextPanel = null;
    }
    this.container.innerHTML = '';
  }
}
