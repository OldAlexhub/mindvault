import { getTodayKey, getYesterday } from '../utils/date';
import { getDailyProgress, saveDailyProgress } from '../storage/storage';
import { generatePuzzlesForVault } from './puzzleGenerator';
import type { DailyProgress, Puzzle } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Seed generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a YYYY-MM-DD date string into a deterministic numeric seed.
 * The same date always produces the same seed, ensuring daily puzzles
 * are identical for all players on the same day.
 */
export function dateSeedFromKey(dateKey: string): number {
  if (!dateKey || typeof dateKey !== 'string') return 20260101;
  // Remove dashes: '2026-05-18' → '20260518'
  const digits = dateKey.replace(/-/g, '');
  const base = parseInt(digits, 10);
  if (isNaN(base)) return 20260101;

  // Mix the base value through a simple hash to spread seeds
  let hash = base;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >>> 16) ^ hash;
  // Ensure positive
  return Math.abs(hash) || 20260101;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily puzzle generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates today's daily vault puzzles deterministically.
 * Returns the same 12 puzzles for all players on the same calendar day.
 */
export function getDailyPuzzles(): Puzzle[] {
  const today = getTodayKey();
  const seed = dateSeedFromKey(today);
  return generatePuzzlesForVault('daily', seed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily progress queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the player has already completed today's daily challenge.
 */
export async function isTodayCompleted(): Promise<boolean> {
  try {
    const progress = await getDailyProgress();
    const today = getTodayKey();
    return Boolean(progress.completedDates[today]);
  } catch {
    return false;
  }
}

/**
 * Returns the current daily progress record from storage.
 */
export async function getDailyProgressData(): Promise<DailyProgress> {
  return getDailyProgress();
}

// ─────────────────────────────────────────────────────────────────────────────
// Completing the daily challenge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks today's daily challenge as completed and updates streak data.
 *
 * Rules:
 * - If today is already marked complete, returns the unchanged progress (no double-counting).
 * - If yesterday was completed, the streak increments by 1.
 * - If yesterday was NOT completed, the streak resets to 1 (new streak begins).
 * - longestStreak is updated if currentStreak exceeds it.
 * - The score is recorded in dailyScores[today].
 */
export async function completeDailyChallenge(score: number): Promise<DailyProgress> {
  try {
    const progress = await getDailyProgress();
    const today = getTodayKey();

    // Guard against double-submission
    if (progress.completedDates[today]) {
      return progress;
    }

    const yesterday = getYesterday();
    const yesterdayCompleted = Boolean(progress.completedDates[yesterday]);

    // Update streak
    let currentStreak: number;
    if (yesterdayCompleted) {
      currentStreak = (progress.currentStreak ?? 0) + 1;
    } else {
      currentStreak = 1;
    }

    const longestStreak = Math.max(progress.longestStreak ?? 0, currentStreak);

    const updated: DailyProgress = {
      lastCompletedDate: today,
      completedDates: {
        ...progress.completedDates,
        [today]: true,
      },
      currentStreak,
      longestStreak,
      dailyScores: {
        ...progress.dailyScores,
        [today]: score,
      },
      updatedAt: new Date().toISOString(),
    };

    await saveDailyProgress(updated);
    return updated;
  } catch {
    // Return a fallback progress if anything goes wrong
    const today = getTodayKey();
    const fallback: DailyProgress = {
      lastCompletedDate: today,
      completedDates: { [today]: true },
      currentStreak: 1,
      longestStreak: 1,
      dailyScores: { [today]: score },
      updatedAt: new Date().toISOString(),
    };
    return fallback;
  }
}
