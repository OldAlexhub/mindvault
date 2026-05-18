import { TimerMode, ThemeId, VaultType } from '../types';

/**
 * Clamps a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Safely divides numerator by denominator.
 * Returns fallback (default 0) if denominator is 0 or either value is NaN.
 */
export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (!denominator || isNaN(denominator) || isNaN(numerator)) return fallback;
  return numerator / denominator;
}

/**
 * Returns a percentage integer (0–100) from correct / total.
 * Returns 0 if total is 0 or either argument is invalid.
 */
export function safePercent(correct: number, total: number): number {
  if (!total || isNaN(total) || isNaN(correct)) return 0;
  return Math.round(clamp((correct / total) * 100, 0, 100));
}

const VALID_TIMER_MODES: TimerMode[] = ['relaxed', 'standard', 'rush'];

/**
 * Type guard: returns true if value is a valid TimerMode.
 */
export function isValidTimerMode(value: unknown): value is TimerMode {
  return typeof value === 'string' && (VALID_TIMER_MODES as string[]).includes(value);
}

const VALID_THEME_IDS: ThemeId[] = ['classic', 'neon', 'cyber', 'ancient', 'midnight'];

/**
 * Type guard: returns true if value is a valid ThemeId.
 */
export function isValidThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (VALID_THEME_IDS as string[]).includes(value);
}

const VALID_VAULT_TYPES: VaultType[] = ['quick', 'pattern', 'number', 'memory', 'word', 'world', 'daily'];

/**
 * Type guard: returns true if value is a valid VaultType.
 */
export function isValidVaultType(value: unknown): value is VaultType {
  return typeof value === 'string' && (VALID_VAULT_TYPES as string[]).includes(value);
}

/**
 * Normalizes an unknown value to a boolean.
 * Returns fallback if value cannot be meaningfully interpreted.
 */
export function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

/**
 * Ensures a number is positive (> 0) and not NaN.
 * Returns fallback (default 0) if value is negative, zero, or NaN.
 */
export function ensurePositive(value: number, fallback: number = 0): number {
  if (isNaN(value) || value < 0) return fallback;
  return value;
}

/**
 * Generates a random unique ID string combining a timestamp and random base-36 segment.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  return `${timestamp}-${random}`;
}
