/**
 * ChatGPT Sidebar Injector
 * 
 * This module injects a sidebar UI into the ChatGPT interface for:
 * - Quick access to saved conversations
 * - Folder navigation
 * - Search and filter
 * - Conversation management
 */

import type { Conversation, Folder } from '../../content/types';
import { db } from '../../data/database';

export class ChatGPTSidebarInjector {
  private sidebar: HTMLElement | null = null;
  private isVisible = false;
  private isInitialized = false;

  /**
   * Initialize the sidebar
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[ChatGPTSidebarInjector] Already initialized');
      return;
    }

    console.log('[ChatGPTSidebarInjector] Initializing sidebar');
    
    // Check if we're on ChatGPT
    if (!this.isChatGPTPage()) {
      console.log('[ChatGPTSidebarInjector] Not on ChatGPT page');
      return;
    }

    await this.createSidebar();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Check if current page is ChatGPT
   */
  private isChatGPTPage(): boolean {
    return window.location.hostname.includes('chat.openai.com') ||
           window.location.hostname.includes('chatgpt.com');
  }

  /**
   * Create the sidebar UI
   */
  private async createSidebar(): Promise<void> {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'bettergpt-chatgpt-sidebar';
    this.sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #e5e7eb;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create header
    const header = this.createHeader();
    this.sidebar.appendChild(header);

    // Create search bar
    const searchBar = this.createSearchBar();
    this.sidebar.appendChild(searchBar);

    // Create folder and conversation list
    const content = await this.createContent();
    this.sidebar.appendChild(content);

    // Create footer with actions
    const footer = this.createFooter();
    this.sidebar.appendChild(footer);

    document.body.appendChild(this.sidebar);
  }

  /**
   * Create sidebar header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
    `;

    const title = document.createElement('h3');
    title.textContent = 'BetterGPT';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 4px 8px;
      border-radius: 4px;
    `;
    closeButton.onmouseover = () => closeButton.style.background = '#e5e7eb';
    closeButton.onmouseout = () => closeButton.style.background = 'none';
    closeButton.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeButton);

    return header;
  }

  /**
   * Create search bar
   */
  private createSearchBar(): HTMLElement {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search conversations...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    `;
    
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.handleSearch(query);
    });

    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  /**
   * Create content area with folders and conversations
   */
  private async createContent(): Promise<HTMLElement> {
    const content = document.createElement('div');
    content.id = 'bettergpt-sidebar-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    `;

    // Load folders and conversations
    await this.refreshContent(content);

    return content;
  }

  /**
   * Refresh content area
   */
  private async refreshContent(container: HTMLElement): Promise<void> {
    container.innerHTML = '';

    // Add "All Conversations" section
    const allSection = this.createSection('All Conversations');
    container.appendChild(allSection);

    // Load and display conversations
    const conversations = await db.getActiveConversations();
    const conversationList = this.createConversationList(conversations);
    container.appendChild(conversationList);

    // Add "Favorites" section if there are any
    const favorites = await db.getFavoriteConversations();
    if (favorites.length > 0) {
      const favSection = this.createSection('Favorites');
      container.appendChild(favSection);
      
      const favList = this.createConversationList(favorites);
      container.appendChild(favList);
    }

    // Add "Folders" section
    const folders = await db.getAllFolders();
    if (folders.length > 0) {
      const folderSection = this.createSection('Folders');
      container.appendChild(folderSection);
      
      const folderList = this.createFolderList(folders);
      container.appendChild(folderList);
    }
  }

  /**
   * Create section header
   */
  private createSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px 8px 8px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `;
    section.textContent = title;
    return section;
  }

  /**
   * Create conversation list
   */
  private createConversationList(conversations: Conversation[]): HTMLElement {
    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    `;

    for (const conv of conversations.slice(0, 10)) { // Show first 10
      const item = this.createConversationItem(conv);
      list.appendChild(item);
    }

    return list;
  }

  /**
   * Create conversation item
   */
  private createConversationItem(conversation: Conversation): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      background: #f9fafb;
      transition: background 0.2s;
    `;
    item.onmouseover = () => item.style.background = '#f3f4f6';
    item.onmouseout = () => item.style.background = '#f9fafb';

    const title = document.createElement('div');
    title.textContent = conversation.title;
    title.style.cssText = `
      font-size: 14px;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    `;

    const meta = document.createElement('div');
    meta.textContent = `${conversation.model} • ${this.formatDate(conversation.updatedAt)}`;
    meta.style.cssText = `
      font-size: 12px;
      color: #6b7280;
    `;

    item.appendChild(title);
    item.appendChild(meta);

    // Add click handler to open conversation
    item.onclick = () => this.openConversation(conversation.id);

    return item;
  }

  /**
   * Create folder list
   */
  private createFolderList(folders: Folder[]): HTMLElement {
    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    `;

    for (const folder of folders) {
      const item = this.createFolderItem(folder);
      list.appendChild(item);
    }

    return list;
  }

  /**
   * Create folder item
   */
  private createFolderItem(folder: Folder): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      background: #f9fafb;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    item.onmouseover = () => item.style.background = '#f3f4f6';
    item.onmouseout = () => item.style.background = '#f9fafb';

    const icon = document.createElement('span');
    icon.textContent = '📁';
    icon.style.fontSize = '16px';

    const name = document.createElement('span');
    name.textContent = folder.name;
    name.style.cssText = `
      font-size: 14px;
      color: #111827;
    `;

    item.appendChild(icon);
    item.appendChild(name);

    // Add click handler
    item.onclick = () => this.openFolder(folder.id);

    return item;
  }

  /**
   * Create footer with actions
   */
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    `;

    const newFolderBtn = this.createButton('+ New Folder', () => this.createNewFolder());
    footer.appendChild(newFolderBtn);

    return footer;
  }

  /**
   * Create button
   */
  private createButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    `;
    button.onmouseover = () => button.style.background = '#2563eb';
    button.onmouseout = () => button.style.background = '#3b82f6';
    button.onclick = onClick;

    return button;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for conversation changes
    window.addEventListener('chatgpt-conversation-change', () => {
      this.refreshContentIfVisible();
    });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Refresh content if sidebar is visible
   */
  private async refreshContentIfVisible(): Promise<void> {
    if (this.isVisible && this.sidebar) {
      const content = this.sidebar.querySelector('#bettergpt-sidebar-content');
      if (content) {
        await this.refreshContent(content as HTMLElement);
      }
    }
  }

  /**
   * Handle search
   */
  private async handleSearch(query: string): Promise<void> {
    if (!this.sidebar) return;

    const content = this.sidebar.querySelector('#bettergpt-sidebar-content');
    if (!content) return;

    if (query.trim() === '') {
      await this.refreshContent(content as HTMLElement);
      return;
    }

    // Search conversations
    const results = await db.searchConversations(query);
    
    content.innerHTML = '';
    const resultSection = this.createSection(`Search Results (${results.length})`);
    content.appendChild(resultSection);
    
    const resultList = this.createConversationList(results);
    content.appendChild(resultList);
  }

  /**
   * Open conversation
   */
  private openConversation(conversationId: string): void {
    console.log('[ChatGPTSidebarInjector] Opening conversation:', conversationId);
    // This would navigate to the conversation in ChatGPT
    // The actual implementation depends on ChatGPT's URL structure
  }

  /**
   * Open folder
   */
  private async openFolder(folderId: string): Promise<void> {
    console.log('[ChatGPTSidebarInjector] Opening folder:', folderId);
    
    if (!this.sidebar) return;
    const content = this.sidebar.querySelector('#bettergpt-sidebar-content');
    if (!content) return;

    const conversations = await db.getConversationsByFolder(folderId);
    const folder = await db.getFolder(folderId);
    
    content.innerHTML = '';
    const folderSection = this.createSection(folder?.name || 'Folder');
    content.appendChild(folderSection);
    
    const convList = this.createConversationList(conversations);
    content.appendChild(convList);
  }

  /**
   * Create new folder
   */
  private async createNewFolder(): Promise<void> {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const folder: Folder = {
      id: `folder_${Date.now()}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.saveFolder(folder);
    await this.refreshContentIfVisible();
    console.log('[ChatGPTSidebarInjector] Created folder:', name);
  }

  /**
   * Format date for display
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString();
  }

  /**
   * Show sidebar
   */
  show(): void {
    if (!this.sidebar) return;
    
    this.sidebar.style.transform = 'translateX(0)';
    this.isVisible = true;
    this.refreshContentIfVisible();
  }

  /**
   * Hide sidebar
   */
  hide(): void {
    if (!this.sidebar) return;
    
    this.sidebar.style.transform = 'translateX(100%)';
    this.isVisible = false;
  }

  /**
   * Toggle sidebar visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Cleanup and remove sidebar
   */
  destroy(): void {
    if (!this.isInitialized) return;

    console.log('[ChatGPTSidebarInjector] Destroying sidebar');
    
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
    
    this.isInitialized = false;
    this.isVisible = false;
  }
}
