/**
 * Keyboard Shortcuts Manager
 * 
 * Provides centralized keyboard shortcut management with:
 * - Shortcut registration and removal
 * - Platform-specific handling (Cmd on Mac, Ctrl on Windows/Linux)
 * - Conflict detection
 * - Priority handling
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  category?: string;
  priority?: number;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;

  /**
   * Register a keyboard shortcut
   */
  register(id: string, shortcut: KeyboardShortcut): void {
    if (this.shortcuts.has(id)) {
      console.warn(`[KeyboardShortcutManager] Shortcut ${id} already registered`);
      return;
    }

    this.shortcuts.set(id, {
      ...shortcut,
      priority: shortcut.priority ?? 0
    });
    console.log(`[KeyboardShortcutManager] Registered shortcut: ${id}`);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
    console.log(`[KeyboardShortcutManager] Unregistered shortcut: ${id}`);
  }

  /**
   * Handle keyboard event
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.isEnabled) {
      return false;
    }

    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Cmd/Ctrl+K even in input fields
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key === 'k';
      if (!isCmdK) {
        return false;
      }
    }

    // Find matching shortcuts
    const matches: Array<{ id: string; shortcut: KeyboardShortcut }> = [];
    
    for (const [id, shortcut] of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        matches.push({ id, shortcut });
      }
    }

    if (matches.length === 0) {
      return false;
    }

    // Sort by priority (higher priority first)
    matches.sort((a, b) => (b.shortcut.priority ?? 0) - (a.shortcut.priority ?? 0));

    // Execute the highest priority match
    const match = matches[0];
    event.preventDefault();
    event.stopPropagation();
    match.shortcut.handler(event);
    
    console.log(`[KeyboardShortcutManager] Executed shortcut: ${match.id}`);
    return true;
  }

  /**
   * Check if event matches shortcut
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const key = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();
    
    if (key !== shortcutKey) {
      return false;
    }

    // Check modifiers
    const ctrl = shortcut.ctrl ?? false;
    const shift = shortcut.shift ?? false;
    const alt = shortcut.alt ?? false;
    const meta = shortcut.meta ?? false;

    // Handle platform-specific Cmd/Ctrl
    // Note: Using navigator.platform for backward compatibility
    // TODO: Migrate to navigator.userAgentData when widely supported
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;
    const hasModifier = ctrl || meta;

    if (hasModifier && !modifierKey) {
      return false;
    }
    
    if (!hasModifier && modifierKey) {
      return false;
    }

    if (shift !== event.shiftKey) {
      return false;
    }

    if (alt !== event.altKey) {
      return false;
    }

    return true;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): Array<{ id: string; shortcut: KeyboardShortcut }> {
    return Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({ id, shortcut }));
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): Array<{ id: string; shortcut: KeyboardShortcut }> {
    return this.getShortcuts().filter(s => s.shortcut.category === category);
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrl || shortcut.meta) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }
}

// Global instance
export const keyboardManager = new KeyboardShortcutManager();
