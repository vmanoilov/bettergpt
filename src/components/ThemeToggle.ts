/**
 * Theme Toggle Component
 * 
 * Provides a UI control for switching between light and dark themes
 */

import { themeManager } from '../utils/theme';

export class ThemeToggle {
  private container: HTMLElement;
  private button: HTMLButtonElement | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initialize();
  }

  /**
   * Initialize the theme toggle
   */
  private initialize(): void {
    this.button = document.createElement('button');
    this.button.title = 'Toggle theme';
    this.button.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    this.button.addEventListener('mouseenter', () => {
      if (this.button) {
        this.button.style.background = 'var(--color-surface, #f5f5f5)';
      }
    });

    this.button.addEventListener('mouseleave', () => {
      if (this.button) {
        this.button.style.background = 'none';
      }
    });

    this.button.addEventListener('click', async () => {
      await themeManager.toggleTheme();
    });

    // Update icon based on current theme
    this.updateIcon();

    // Subscribe to theme changes
    this.unsubscribe = themeManager.subscribe(() => {
      this.updateIcon();
    });

    this.container.appendChild(this.button);
  }

  /**
   * Update icon based on current theme
   */
  private updateIcon(): void {
    if (!this.button) return;

    const theme = themeManager.getActiveTheme();
    this.button.textContent = theme === 'dark' ? '☀️' : '🌙';
    this.button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  }

  /**
   * Destroy the theme toggle
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (this.button) {
      this.button.remove();
    }

    this.button = null;
  }
}
