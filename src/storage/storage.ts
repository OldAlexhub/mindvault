import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppSettings,
  AppStats,
  VaultAttempt,
  DailyProgress,
  ThemeUnlocks,
  CachedWordData,
  CachedWorldData,
  VaultProgress,
} from '../types';
import {
  KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  DEFAULT_DAILY,
  DEFAULT_VAULT_PROGRESS,
  DEFAULT_THEMES,
} from './defaults';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parses a JSON string. Returns null on any error.
 */
function safeParse<T>(raw: string | null): T | null {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Deep-merges `defaults` with `stored` so that missing fields are filled in
 * without overwriting values that do exist.
 */
function mergeWithDefaults<T extends object>(
  stored: Partial<T> | null | undefined,
  defaults: T,
): T {
  if (!stored || typeof stored !== 'object') return { ...defaults };
  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  const storedRecord = stored as Record<string, unknown>;
  for (const key of Object.keys(storedRecord)) {
    if (storedRecord[key] !== undefined && storedRecord[key] !== null) {
      result[key] = storedRecord[key];
    }
  }
  return result as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    const parsed = safeParse<Partial<AppSettings>>(raw);
    return mergeWithDefaults<AppSettings>(parsed, DEFAULT_SETTINGS);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<AppStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    const parsed = safeParse<Partial<AppStats>>(raw);
    const merged = mergeWithDefaults<AppStats>(parsed, DEFAULT_STATS);
    // Ensure modeStats is always an object
    if (!merged.modeStats || typeof merged.modeStats !== 'object') {
      merged.modeStats = {};
    }
    return merged;
  } catch {
    return { ...DEFAULT_STATS, modeStats: {} };
  }
}

export async function saveStats(stats: AppStats): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Attempts
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 100;

export async function getAttempts(): Promise<VaultAttempt[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ATTEMPTS);
    const parsed = safeParse<VaultAttempt[]>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export async function saveAttempt(attempt: VaultAttempt): Promise<boolean> {
  try {
    const existing = await getAttempts();
    const updated = [attempt, ...existing].slice(0, MAX_ATTEMPTS);
    await AsyncStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Progress
// ─────────────────────────────────────────────────────────────────────────────

export async function getDailyProgress(): Promise<DailyProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DAILY);
    const parsed = safeParse<Partial<DailyProgress>>(raw);
    const merged = mergeWithDefaults<DailyProgress>(parsed, DEFAULT_DAILY);
    if (!merged.completedDates || typeof merged.completedDates !== 'object') {
      merged.completedDates = {};
    }
    if (!merged.dailyScores || typeof merged.dailyScores !== 'object') {
      merged.dailyScores = {};
    }
    return merged;
  } catch {
    return { ...DEFAULT_DAILY, completedDates: {}, dailyScores: {} };
  }
}

export async function saveDailyProgress(progress: DailyProgress): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.DAILY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme Unlocks
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Vault Progress
// ---------------------------------------------------------------------------

export async function getVaultProgress(): Promise<VaultProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.VAULT_PROGRESS);
    const parsed = safeParse<Partial<VaultProgress>>(raw);
    const merged = mergeWithDefaults<VaultProgress>(parsed, DEFAULT_VAULT_PROGRESS);
    if (!merged.unlockedLevel || merged.unlockedLevel < 1) {
      merged.unlockedLevel = 1;
    }
    if (!merged.completedLevels || typeof merged.completedLevels !== 'object') {
      merged.completedLevels = {};
    }
    if (!merged.bestScores || typeof merged.bestScores !== 'object') {
      merged.bestScores = {};
    }
    return merged;
  } catch {
    return { ...DEFAULT_VAULT_PROGRESS, completedLevels: {}, bestScores: {} };
  }
}

export async function saveVaultProgress(progress: VaultProgress): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.VAULT_PROGRESS, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export async function getThemeUnlocks(): Promise<ThemeUnlocks> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.THEMES);
    const parsed = safeParse<Partial<ThemeUnlocks>>(raw);
    const merged = mergeWithDefaults<ThemeUnlocks>(parsed, DEFAULT_THEMES);
    if (!Array.isArray(merged.unlockedThemeIds)) {
      merged.unlockedThemeIds = ['classic'];
    }
    if (!merged.unlockProgress || typeof merged.unlockProgress !== 'object') {
      merged.unlockProgress = {};
    }
    return merged;
  } catch {
    return { ...DEFAULT_THEMES };
  }
}

export async function saveThemeUnlocks(unlocks: ThemeUnlocks): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.THEMES, JSON.stringify(unlocks));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached Word Data
// ─────────────────────────────────────────────────────────────────────────────

export async function getCachedWordData(): Promise<CachedWordData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CACHE_WORDS);
    return safeParse<CachedWordData>(raw);
  } catch {
    return null;
  }
}

export async function saveCachedWordData(data: CachedWordData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.CACHE_WORDS, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached World Data
// ─────────────────────────────────────────────────────────────────────────────

export async function getCachedWorldData(): Promise<CachedWorldData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CACHE_WORLD);
    return safeParse<CachedWorldData>(raw);
  } catch {
    return null;
  }
}

export async function saveCachedWorldData(data: CachedWorldData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.CACHE_WORLD, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset / Export
// ─────────────────────────────────────────────────────────────────────────────

export async function resetAllData(): Promise<boolean> {
  try {
    const allKeys = Object.values(KEYS);
    await AsyncStorage.multiRemove(allKeys);
    return true;
  } catch {
    return false;
  }
}

export async function exportAllData(): Promise<string> {
  try {
    const [settings, stats, attempts, daily, vaultProgress, themes, wordCache, worldCache] =
      await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
        getVaultProgress(),
        getThemeUnlocks(),
        getCachedWordData(),
        getCachedWorldData(),
      ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      settings,
      stats,
      attempts,
      daily,
      vaultProgress,
      themes,
      wordCache,
      worldCache,
    };

    return JSON.stringify(exportPayload, null, 2);
  } catch {
    return JSON.stringify({ exportedAt: new Date().toISOString(), error: 'Export failed' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────────────────────────────────────

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING, 'true');
  } catch {
    // Silently fail: onboarding flag is non-critical
  }
}
