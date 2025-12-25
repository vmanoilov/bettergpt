/**
 * Performance utilities
 * 
 * Provides utilities for performance optimization:
 * - Throttle and debounce functions
 * - Request animation frame wrapper
 * - Performance monitoring
 */

/**
 * Throttle function - limits function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Debounce function - delays function execution until after wait milliseconds have passed
 * since the last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };

    const callNow = immediate && !timeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Request animation frame wrapper with fallback
 */
export function requestAnimationFrameWrapper(callback: () => void): number {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  } else {
    return setTimeout(callback, 16); // ~60fps fallback
  }
}

/**
 * Cancel animation frame with fallback
 */
export function cancelAnimationFrameWrapper(id: number): void {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Measure function execution time
 */
export function measureTime<T extends (...args: any[]) => any>(
  func: T,
  label?: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function measured(...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    const duration = end - start;
    
    console.log(`[Performance] ${label || func.name}: ${duration.toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * Create a cached function that memoizes results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Batch multiple operations into a single RAF
 */
export class BatchScheduler {
  private pending: Set<() => void> = new Set();
  private rafId: number | null = null;

  schedule(callback: () => void): void {
    this.pending.add(callback);

    if (!this.rafId) {
      this.rafId = requestAnimationFrameWrapper(() => {
        this.flush();
      });
    }
  }

  flush(): void {
    const callbacks = Array.from(this.pending);
    this.pending.clear();
    this.rafId = null;

    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[BatchScheduler] Error executing callback:', error);
      }
    });
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrameWrapper(this.rafId);
      this.rafId = null;
    }
    this.pending.clear();
  }
}

/**
 * Global batch scheduler instance
 */
export const batchScheduler = new BatchScheduler();
