/**
 * Date utility functions for MindVault.
 * All functions use local time unless noted otherwise.
 */

/**
 * Pads a number to 2 digits with a leading zero.
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Returns today's date key in YYYY-MM-DD format using local time.
 */
export function getTodayKey(): string {
  return getDateKey(new Date());
}

/**
 * Returns the date key in YYYY-MM-DD format for any given Date object using local time.
 */
export function getDateKey(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return getTodayKey();
  }
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date key in YYYY-MM-DD format using local time.
 */
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
}

/**
 * Parses a YYYY-MM-DD string into a local midnight Date.
 * Returns null if the string is invalid.
 */
function parseDateKey(key: string): Date | null {
  if (!key || typeof key !== 'string') return null;
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const d = new Date(year, month, day, 0, 0, 0, 0);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Returns true if curr is exactly 1 calendar day after prev.
 * Both arguments must be YYYY-MM-DD strings.
 */
export function isConsecutiveDay(prev: string, curr: string): boolean {
  const prevDate = parseDateKey(prev);
  const currDate = parseDateKey(curr);
  if (!prevDate || !currDate) return false;
  const diffMs = currDate.getTime() - prevDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Returns the number of calendar days between two YYYY-MM-DD strings.
 * The result is always non-negative (absolute difference).
 */
export function daysBetween(a: string, b: string): number {
  const dateA = parseDateKey(a);
  const dateB = parseDateKey(b);
  if (!dateA || !dateB) return 0;
  const diffMs = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if two YYYY-MM-DD strings represent the same calendar day.
 */
export function isSameDay(a: string, b: string): boolean {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  return a.trim() === b.trim();
}

/**
 * Formats a YYYY-MM-DD string into a human-readable string like "May 18, 2026".
 * Returns the original key if it cannot be parsed.
 */
export function formatDateDisplay(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey ?? '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
