/**
 * Theme Manager
 * 
 * Manages application themes (light/dark mode) with:
 * - Theme switching
 * - Theme persistence
 * - CSS variable updates
 * - System theme detection
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryHover: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const LIGHT_THEME: ThemeColors = {
  background: '#ffffff',
  surface: '#f9f9f9',
  surfaceAlt: '#f5f5f5',
  primary: '#007bff',
  primaryHover: '#0056b3',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8'
};

const DARK_THEME: ThemeColors = {
  background: '#1a1a1a',
  surface: '#2d2d2d',
  surfaceAlt: '#242424',
  primary: '#4a9eff',
  primaryHover: '#357abd',
  text: '#e0e0e0',
  textSecondary: '#a0a0a0',
  border: '#404040',
  borderLight: '#333333',
  shadow: 'rgba(0, 0, 0, 0.3)',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db'
};

export class ThemeManager {
  private currentTheme: Theme = 'system';
  private activeTheme: 'light' | 'dark' = 'light';
  private listeners: Set<(theme: 'light' | 'dark') => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Initialize theme from storage or system preference
   */
  private async initializeTheme(): Promise<void> {
    try {
      // Try to load saved theme preference
      const result = await chrome.storage.local.get('theme');
      const savedTheme = result.theme as Theme | undefined;
      
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        this.setTheme('system');
      }
    } catch (error) {
      console.error('[ThemeManager] Error loading theme:', error);
      this.setTheme('system');
    }
  }

  /**
   * Setup system theme change listener
   */
  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (this.currentTheme === 'system') {
          this.activeTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.activeTheme);
          this.notifyListeners(this.activeTheme);
        }
      };

      // Modern browsers
      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', handleChange);
      } else {
        // Legacy browsers
        this.mediaQuery.addListener(handleChange);
      }
    }
  }

  /**
   * Set theme
   */
  async setTheme(theme: Theme): Promise<void> {
    this.currentTheme = theme;
    
    if (theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.activeTheme = prefersDark ? 'dark' : 'light';
    } else {
      this.activeTheme = theme;
    }

    this.applyTheme(this.activeTheme);
    this.notifyListeners(this.activeTheme);

    // Save preference
    try {
      await chrome.storage.local.set({ theme: this.currentTheme });
    } catch (error) {
      console.error('[ThemeManager] Error saving theme:', error);
    }
  }

  /**
   * Apply theme colors
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Add theme class to body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);

    console.log(`[ThemeManager] Applied ${theme} theme`);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get active theme (resolved, not 'system')
   */
  getActiveTheme(): 'light' | 'dark' {
    return this.activeTheme;
  }

  /**
   * Toggle between light and dark
   */
  async toggleTheme(): Promise<void> {
    const newTheme = this.activeTheme === 'light' ? 'dark' : 'light';
    await this.setTheme(newTheme);
  }

  /**
   * Get theme colors
   */
  getColors(): ThemeColors {
    return this.activeTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: 'light' | 'dark'): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme);
      } catch (error) {
        console.error('[ThemeManager] Error notifying listener:', error);
      }
    });
  }
}

// Global instance
export const themeManager = new ThemeManager();
