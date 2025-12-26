/**
 * Page Context Utilities
 *
 * Functions to capture context from the current page
 */

import type { PageContext } from './types';

/**
 * Get the currently selected text on the page
 */
export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

/**
 * Get page metadata
 */
export function getPageMetadata(): { title: string; url: string } {
  return {
    title: document.title,
    url: window.location.href,
  };
}

/**
 * Get DOM context around selected text (if any)
 */
export function getDOMContext(maxLength: number = 500): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return '';
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  // Get the parent element
  const element =
    container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;

  if (!element) {
    return '';
  }

  // Get surrounding text
  let context = element.textContent || '';

  // Truncate if too long
  if (context.length > maxLength) {
    const start = Math.max(0, context.indexOf(selection.toString()) - maxLength / 2);
    const end = Math.min(context.length, start + maxLength);
    context =
      (start > 0 ? '...' : '') +
      context.substring(start, end) +
      (end < context.length ? '...' : '');
  }

  return context.trim();
}

/**
 * Capture full page context
 */
export function capturePageContext(): PageContext {
  const { title, url } = getPageMetadata();
  const selectedText = getSelectedText();
  const domContext = selectedText ? getDOMContext() : '';

  return {
    url,
    title,
    selectedText: selectedText || undefined,
    domContext: domContext || undefined,
    timestamp: Date.now(),
  };
}
