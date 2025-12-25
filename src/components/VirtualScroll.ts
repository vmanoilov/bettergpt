/**
 * Virtual Scroll Component
 * 
 * Provides efficient rendering of large lists by only rendering visible items:
 * - Renders only items in viewport
 * - Smooth scrolling
 * - Dynamic item heights
 * - Minimal re-renders
 */

export interface VirtualScrollItem {
  id: string | number;
  height?: number;
}

export interface VirtualScrollOptions<T extends VirtualScrollItem> {
  container: HTMLElement;
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => HTMLElement;
  overscan?: number; // Number of extra items to render above/below viewport
  onScroll?: (scrollTop: number) => void;
}

export class VirtualScroll<T extends VirtualScrollItem> {
  private container: HTMLElement;
  private items: T[];
  private itemHeight: number;
  private renderItem: (item: T, index: number) => HTMLElement;
  private overscan: number;
  private onScroll?: (scrollTop: number) => void;

  private scrollContainer: HTMLElement | null = null;
  private contentContainer: HTMLElement | null = null;
  private spacerTop: HTMLElement | null = null;
  private spacerBottom: HTMLElement | null = null;

  private visibleStart = 0;
  private visibleEnd = 0;
  private renderedElements: Map<string | number, HTMLElement> = new Map();

  private scrollHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: VirtualScrollOptions<T>) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan ?? 3;
    this.onScroll = options.onScroll;

    this.initialize();
  }

  /**
   * Initialize virtual scroll
   */
  private initialize(): void {
    // Create scroll container
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.cssText = `
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    `;

    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.style.cssText = `
      position: relative;
      width: 100%;
    `;

    // Create spacers
    this.spacerTop = document.createElement('div');
    this.spacerBottom = document.createElement('div');

    this.contentContainer.appendChild(this.spacerTop);
    this.contentContainer.appendChild(this.spacerBottom);
    this.scrollContainer.appendChild(this.contentContainer);
    this.container.appendChild(this.scrollContainer);

    // Setup scroll handler
    this.scrollHandler = this.handleScroll.bind(this);
    this.scrollContainer.addEventListener('scroll', this.scrollHandler);

    // Setup resize observer
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateVisibleRange();
      });
      this.resizeObserver.observe(this.scrollContainer);
    }

    // Initial render
    this.updateVisibleRange();
  }

  /**
   * Handle scroll event
   */
  private handleScroll(): void {
    this.updateVisibleRange();
    
    if (this.onScroll && this.scrollContainer) {
      this.onScroll(this.scrollContainer.scrollTop);
    }
  }

  /**
   * Update visible range and render
   */
  private updateVisibleRange(): void {
    if (!this.scrollContainer || !this.contentContainer) {
      return;
    }

    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;

    // Calculate visible range
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / this.itemHeight);

    // Add overscan
    const visibleStart = Math.max(0, start - this.overscan);
    const visibleEnd = Math.min(this.items.length, end + this.overscan);

    // Only update if range changed
    if (visibleStart === this.visibleStart && visibleEnd === this.visibleEnd) {
      return;
    }

    this.visibleStart = visibleStart;
    this.visibleEnd = visibleEnd;

    this.render();
  }

  /**
   * Render visible items
   */
  private render(): void {
    if (!this.contentContainer || !this.spacerTop || !this.spacerBottom) {
      return;
    }

    // Calculate spacer heights
    const topHeight = this.visibleStart * this.itemHeight;
    const bottomHeight = (this.items.length - this.visibleEnd) * this.itemHeight;

    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;

    // Track which items should be rendered
    const shouldRender = new Set<string | number>();
    
    // Render visible items
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i];
      if (!item) continue;

      shouldRender.add(item.id);

      if (!this.renderedElements.has(item.id)) {
        const element = this.renderItem(item, i);
        element.style.position = 'relative';
        this.renderedElements.set(item.id, element);
        this.contentContainer.insertBefore(element, this.spacerBottom);
      }
    }

    // Remove items that are no longer visible
    for (const [id, element] of this.renderedElements) {
      if (!shouldRender.has(id)) {
        element.remove();
        this.renderedElements.delete(id);
      }
    }
  }

  /**
   * Update items
   */
  updateItems(items: T[]): void {
    this.items = items;
    
    // Clear rendered elements
    for (const element of this.renderedElements.values()) {
      element.remove();
    }
    this.renderedElements.clear();

    // Re-render
    this.updateVisibleRange();
  }

  /**
   * Scroll to item
   */
  scrollToItem(index: number, behavior: ScrollBehavior = 'smooth'): void {
    if (!this.scrollContainer) {
      return;
    }

    const scrollTop = index * this.itemHeight;
    this.scrollContainer.scrollTo({
      top: scrollTop,
      behavior
    });
  }

  /**
   * Scroll to top
   */
  scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollToItem(0, behavior);
  }

  /**
   * Get scroll position
   */
  getScrollTop(): number {
    return this.scrollContainer?.scrollTop ?? 0;
  }

  /**
   * Set scroll position
   */
  setScrollTop(scrollTop: number): void {
    if (this.scrollContainer) {
      this.scrollContainer.scrollTop = scrollTop;
    }
  }

  /**
   * Refresh render
   */
  refresh(): void {
    // Clear all rendered elements
    for (const element of this.renderedElements.values()) {
      element.remove();
    }
    this.renderedElements.clear();

    // Re-render
    this.updateVisibleRange();
  }

  /**
   * Destroy virtual scroll
   */
  destroy(): void {
    if (this.scrollHandler && this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    for (const element of this.renderedElements.values()) {
      element.remove();
    }
    this.renderedElements.clear();

    if (this.scrollContainer) {
      this.scrollContainer.remove();
    }

    this.scrollContainer = null;
    this.contentContainer = null;
    this.spacerTop = null;
    this.spacerBottom = null;
  }
}
