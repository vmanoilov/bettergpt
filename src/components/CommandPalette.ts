/**
 * Command Palette Component
 * 
 * Universal command palette accessible via Cmd/Ctrl+K:
 * - Fuzzy search across actions
 * - Categorized actions
 * - Recent items tracking
 * - Keyboard navigation
 */

import { keyboardManager } from '../utils/keyboard';
import { debounce } from '../utils/performance';
import { themeManager } from '../utils/theme';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon?: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

export interface CommandPaletteOptions {
  onClose?: () => void;
}

export class CommandPalette {
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private isVisible = false;
  private actions: CommandAction[] = [];
  private filteredActions: CommandAction[] = [];
  private selectedIndex = 0;
  private recentActions: string[] = [];
  private maxRecent = 10;
  private onClose?: () => void;

  constructor(options: CommandPaletteOptions = {}) {
    this.onClose = options.onClose;
    this.loadRecentActions();
  }

  /**
   * Initialize the command palette
   */
  async initialize(): Promise<void> {
    this.createPalette();
    this.registerDefaultActions();
    console.log('[CommandPalette] Initialized');
  }

  /**
   * Create palette UI
   */
  private createPalette(): void {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'bettergpt-command-palette-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: ${2147483646};
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 100px;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Create modal
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      background: var(--color-background, #ffffff);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 640px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 0.2s ease;
    `;

    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--color-border, #e0e0e0);
      background: var(--color-surface, #f9f9f9);
    `;

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Type a command or search...';
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border: none;
      background: var(--color-background, #ffffff);
      color: var(--color-text, #333333);
      border-radius: 8px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Setup search input handlers
    const debouncedSearch = debounce((query: string) => {
      this.filterActions(query);
    }, 150);

    this.searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      debouncedSearch(query);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    searchContainer.appendChild(this.searchInput);

    // Create results container
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    `;

    this.modal.appendChild(searchContainer);
    this.modal.appendChild(this.resultsContainer);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
  }

  /**
   * Register default actions
   */
  private registerDefaultActions(): void {
    this.registerAction({
      id: 'new-conversation',
      label: 'New Conversation',
      description: 'Start a new conversation',
      category: 'Conversation',
      icon: '➕',
      handler: () => {
        console.log('[CommandPalette] New conversation');
        // This will be implemented by the manager
      }
    });

    this.registerAction({
      id: 'toggle-main-ui',
      label: 'Toggle Main UI',
      description: 'Show or hide the main UI panel',
      category: 'Navigation',
      icon: '🔲',
      shortcut: 'Ctrl+Shift+A',
      handler: () => {
        console.log('[CommandPalette] Toggle main UI');
        chrome.runtime.sendMessage({ type: 'TOGGLE_UI' }).catch(console.error);
      }
    });

    this.registerAction({
      id: 'search-conversations',
      label: 'Search Conversations',
      description: 'Search through all conversations',
      category: 'Search',
      icon: '🔍',
      handler: () => {
        console.log('[CommandPalette] Search conversations');
      }
    });

    this.registerAction({
      id: 'archive-conversation',
      label: 'Archive Current Conversation',
      description: 'Archive the current conversation',
      category: 'Conversation',
      icon: '📦',
      handler: () => {
        console.log('[CommandPalette] Archive conversation');
      }
    });

    this.registerAction({
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      category: 'Settings',
      icon: '🌓',
      handler: async () => {
        await themeManager.toggleTheme();
        console.log('[CommandPalette] Theme toggled');
      }
    });

    this.registerAction({
      id: 'export-conversations',
      label: 'Export Conversations',
      description: 'Export all conversations to a file',
      category: 'Data',
      icon: '💾',
      handler: () => {
        console.log('[CommandPalette] Export conversations');
      }
    });

    this.registerAction({
      id: 'import-conversations',
      label: 'Import Conversations',
      description: 'Import conversations from a file',
      category: 'Data',
      icon: '📥',
      handler: () => {
        console.log('[CommandPalette] Import conversations');
      }
    });
  }

  /**
   * Register an action
   */
  registerAction(action: CommandAction): void {
    // Remove existing action with same ID
    this.actions = this.actions.filter(a => a.id !== action.id);
    this.actions.push(action);
    console.log(`[CommandPalette] Registered action: ${action.id}`);
  }

  /**
   * Unregister an action
   */
  unregisterAction(id: string): void {
    this.actions = this.actions.filter(a => a.id !== id);
  }

  /**
   * Filter actions based on query
   */
  private filterActions(query: string): void {
    if (!query.trim()) {
      // Show recent actions first, then all actions grouped by category
      const recentActionObjects = this.recentActions
        .map(id => this.actions.find(a => a.id === id))
        .filter(a => a !== undefined) as CommandAction[];
      
      const otherActions = this.actions.filter(
        a => !this.recentActions.includes(a.id)
      );

      this.filteredActions = [...recentActionObjects, ...otherActions];
    } else {
      // Simple fuzzy search
      const lowerQuery = query.toLowerCase();
      this.filteredActions = this.actions.filter(action => {
        const labelMatch = action.label.toLowerCase().includes(lowerQuery);
        const descMatch = action.description?.toLowerCase().includes(lowerQuery);
        const categoryMatch = action.category.toLowerCase().includes(lowerQuery);
        return labelMatch || descMatch || categoryMatch;
      });

      // Sort by relevance (exact matches first)
      this.filteredActions.sort((a, b) => {
        const aExact = a.label.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        const bExact = b.label.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        return bExact - aExact;
      });
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  /**
   * Render results
   */
  private renderResults(): void {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = '';

    if (this.filteredActions.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.cssText = `
        padding: 32px;
        text-align: center;
        color: var(--color-textSecondary, #666666);
      `;
      noResults.textContent = 'No commands found';
      this.resultsContainer.appendChild(noResults);
      return;
    }

    // Group by category
    const categories = new Map<string, CommandAction[]>();
    this.filteredActions.forEach(action => {
      if (!categories.has(action.category)) {
        categories.set(action.category, []);
      }
      categories.get(action.category)!.push(action);
    });

    // Render categories
    let globalIndex = 0;
    categories.forEach((actions, category) => {
      // Category header
      const categoryHeader = document.createElement('div');
      categoryHeader.style.cssText = `
        padding: 8px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-textSecondary, #666666);
        letter-spacing: 0.5px;
      `;
      categoryHeader.textContent = category;
      this.resultsContainer!.appendChild(categoryHeader);

      // Actions in category
      actions.forEach(action => {
        const actionEl = this.createActionElement(action, globalIndex);
        this.resultsContainer!.appendChild(actionEl);
        globalIndex++;
      });
    });
  }

  /**
   * Create action element
   */
  private createActionElement(action: CommandAction, index: number): HTMLElement {
    const isSelected = index === this.selectedIndex;
    const isRecent = this.recentActions.includes(action.id);

    const actionEl = document.createElement('div');
    actionEl.style.cssText = `
      padding: 12px 16px;
      margin: 2px 4px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${isSelected ? 'var(--color-primary, #007bff)' : 'transparent'};
      color: ${isSelected ? '#ffffff' : 'var(--color-text, #333333)'};
      transition: background 0.1s ease;
    `;

    // Icon
    if (action.icon) {
      const icon = document.createElement('span');
      icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
      `;
      icon.textContent = action.icon;
      actionEl.appendChild(icon);
    }

    // Content
    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; min-width: 0;';

    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    label.textContent = action.label;
    
    if (action.description) {
      const desc = document.createElement('div');
      desc.style.cssText = `
        font-size: 12px;
        opacity: ${isSelected ? '0.9' : '0.6'};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      desc.textContent = action.description;
      content.appendChild(label);
      content.appendChild(desc);
    } else {
      content.appendChild(label);
    }

    actionEl.appendChild(content);

    // Shortcut or recent badge
    if (action.shortcut) {
      const shortcut = document.createElement('div');
      shortcut.style.cssText = `
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        background: ${isSelected ? 'rgba(255,255,255,0.2)' : 'var(--color-surface, #f0f0f0)'};
        color: ${isSelected ? '#ffffff' : 'var(--color-textSecondary, #666666)'};
        font-family: monospace;
        flex-shrink: 0;
      `;
      shortcut.textContent = action.shortcut;
      actionEl.appendChild(shortcut);
    } else if (isRecent) {
      const badge = document.createElement('div');
      badge.style.cssText = `
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        background: ${isSelected ? 'rgba(255,255,255,0.2)' : 'var(--color-surface, #f0f0f0)'};
        color: ${isSelected ? '#ffffff' : 'var(--color-textSecondary, #666666)'};
        flex-shrink: 0;
      `;
      badge.textContent = 'Recent';
      actionEl.appendChild(badge);
    }

    // Click handler
    actionEl.addEventListener('click', () => {
      this.executeAction(action);
    });

    // Hover handler
    actionEl.addEventListener('mouseenter', () => {
      this.selectedIndex = index;
      this.renderResults();
    });

    return actionEl;
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.filteredActions.length - 1
        );
        this.renderResults();
        this.scrollToSelected();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.renderResults();
        this.scrollToSelected();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.filteredActions[this.selectedIndex]) {
          this.executeAction(this.filteredActions[this.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.hide();
        break;
    }
  }

  /**
   * Scroll to selected item
   */
  private scrollToSelected(): void {
    if (!this.resultsContainer) return;

    const items = this.resultsContainer.querySelectorAll('div[style*="cursor: pointer"]');
    const selected = items[this.selectedIndex] as HTMLElement;
    
    if (selected) {
      selected.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }

  /**
   * Execute an action
   */
  private async executeAction(action: CommandAction): Promise<void> {
    console.log(`[CommandPalette] Executing action: ${action.id}`);
    
    // Add to recent actions
    this.addToRecent(action.id);
    
    // Hide palette
    this.hide();
    
    // Execute handler
    try {
      await action.handler();
    } catch (error) {
      console.error('[CommandPalette] Error executing action:', error);
    }
  }

  /**
   * Add action to recent list
   */
  private addToRecent(actionId: string): void {
    // Remove if already in list
    this.recentActions = this.recentActions.filter(id => id !== actionId);
    
    // Add to front
    this.recentActions.unshift(actionId);
    
    // Limit size
    if (this.recentActions.length > this.maxRecent) {
      this.recentActions = this.recentActions.slice(0, this.maxRecent);
    }
    
    // Save to storage
    this.saveRecentActions();
  }

  /**
   * Load recent actions from storage
   */
  private async loadRecentActions(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('recentActions');
      if (result.recentActions) {
        this.recentActions = result.recentActions;
      }
    } catch (error) {
      console.error('[CommandPalette] Error loading recent actions:', error);
    }
  }

  /**
   * Save recent actions to storage
   */
  private async saveRecentActions(): Promise<void> {
    try {
      await chrome.storage.local.set({ recentActions: this.recentActions });
    } catch (error) {
      console.error('[CommandPalette] Error saving recent actions:', error);
    }
  }

  /**
   * Show the command palette
   */
  show(): void {
    if (this.isVisible || !this.overlay || !this.modal || !this.searchInput) {
      return;
    }

    this.isVisible = true;
    this.overlay.style.display = 'flex';
    
    // Trigger animation
    requestAnimationFrame(() => {
      if (this.overlay && this.modal) {
        this.overlay.style.opacity = '1';
        this.modal.style.transform = 'scale(1)';
      }
    });

    // Focus search input
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.value = '';
        this.searchInput.focus();
      }
    }, 100);

    // Show all actions initially
    this.filterActions('');

    console.log('[CommandPalette] Shown');
  }

  /**
   * Hide the command palette
   */
  hide(): void {
    if (!this.isVisible || !this.overlay || !this.modal) {
      return;
    }

    this.overlay.style.opacity = '0';
    this.modal.style.transform = 'scale(0.95)';

    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      this.isVisible = false;
    }, 200);

    if (this.onClose) {
      this.onClose();
    }

    console.log('[CommandPalette] Hidden');
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if visible
   */
  isOpen(): boolean {
    return this.isVisible;
  }

  /**
   * Destroy the command palette
   */
  destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = null;
    this.modal = null;
    this.searchInput = null;
    this.resultsContainer = null;
    this.isVisible = false;
  }
}
