import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with plugins
dayjs.extend(relativeTime);

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format);
}

/**
 * Get relative time from now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  return dayjs(date).fromNow();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
}

/**
 * Get the start of today
 */
export function getStartOfToday(): Date {
  return dayjs().startOf('day').toDate();
}

/**
 * Get the start of yesterday
 */
export function getStartOfYesterday(): Date {
  return dayjs().subtract(1, 'day').startOf('day').toDate();
}
