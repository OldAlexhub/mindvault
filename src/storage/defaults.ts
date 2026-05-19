import type { AppSettings, AppStats, DailyProgress, ModeStats, ThemeUnlocks, VaultProgress } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Storage key constants
// ─────────────────────────────────────────────────────────────────────────────

export const KEYS = {
  SETTINGS: 'mindvault:settings',
  STATS: 'mindvault:stats',
  ATTEMPTS: 'mindvault:attempts',
  DAILY: 'mindvault:daily',
  VAULT_PROGRESS: 'mindvault:vaultProgress',
  THEMES: 'mindvault:themes',
  CACHE_WORDS: 'mindvault:cache:words',
  CACHE_WORLD: 'mindvault:cache:world',
  ONBOARDING: 'mindvault:onboarding',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Default ModeStats
// ─────────────────────────────────────────────────────────────────────────────

export function makeDefaultModeStats(): ModeStats {
  return {
    gamesPlayed: 0,
    bestScore: 0,
    totalScore: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  timerMode: 'standard',
  selectedThemeId: 'classic',
  adsAcknowledged: false,
  sharingAcknowledged: false,
  lastDataRefreshAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_STATS: AppStats = {
  totalGamesPlayed: 0,
  totalPuzzlesAnswered: 0,
  totalCorrectAnswers: 0,
  bestVaultScore: 0,
  bestStreak: 0,
  currentDailyStreak: 0,
  longestDailyStreak: 0,
  bestMode: null,
  modeStats: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_DAILY: DailyProgress = {
  lastCompletedDate: null,
  completedDates: {},
  currentStreak: 0,
  longestStreak: 0,
  dailyScores: {},
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_VAULT_PROGRESS: VaultProgress = {
  unlockedLevel: 1,
  completedLevels: {},
  bestScores: {},
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_THEMES: ThemeUnlocks = {
  selectedThemeId: 'classic',
  unlockedThemeIds: ['classic'],
  unlockProgress: {},
  updatedAt: new Date().toISOString(),
};
