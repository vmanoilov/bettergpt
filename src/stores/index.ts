import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { ExtensionConfig } from '@/content/types';

/**
 * Configuration store
 */
export const config: Writable<ExtensionConfig> = writable({
  enabled: true,
  theme: 'light',
  shortcuts: {
    toggleUI: 'Ctrl+Shift+A',
  },
});

/**
 * UI visibility store
 */
export const isUIVisible: Writable<boolean> = writable(false);

/**
 * Loading state store
 */
export const isLoading: Writable<boolean> = writable(false);

/**
 * Error store
 */
export const error: Writable<string | null> = writable(null);

/**
 * Current conversation ID store
 */
export const currentConversationId: Writable<number | null> = writable(null);

/**
 * Search query store
 */
export const searchQuery: Writable<string> = writable('');

/**
 * Theme derived store
 */
export const isDarkMode: Readable<boolean> = derived(config, ($config) => $config.theme === 'dark');

/**
 * Clear error after a delay
 */
export function clearErrorAfterDelay(delay: number = 5000): void {
  setTimeout(() => {
    error.set(null);
  }, delay);
}
