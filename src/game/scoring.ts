import type { TimerMode, VaultRank, VaultAttempt } from '../types';
import { clamp } from '../utils/validation';

// ─────────────────────────────────────────────────────────────────────────────
// Timer durations
// ─────────────────────────────────────────────────────────────────────────────

export const TIMER_DURATIONS: Record<TimerMode, number> = {
  relaxed: 25000,
  standard: 15000,
  rush: 8000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Score calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates points earned for a single puzzle answer.
 *
 * Base points:    100 for correct, 0 for wrong/timeout
 * Time bonus:     0–50 pts, scaled linearly by how quickly the answer was given
 *                 (full 50 if answered instantly, 0 if answered at the last millisecond)
 * Streak bonus:   10 × currentStreak, capped at 100
 *
 * Returns 0 for any invalid input.
 */
export function calculateScore(params: {
  correct: boolean;
  answerTimeMs: number;
  timerDurationMs: number;
  currentStreak: number;
}): number {
  const { correct, answerTimeMs, timerDurationMs, currentStreak } = params;

  if (
    typeof correct !== 'boolean' ||
    typeof answerTimeMs !== 'number' ||
    typeof timerDurationMs !== 'number' ||
    typeof currentStreak !== 'number' ||
    isNaN(answerTimeMs) ||
    isNaN(timerDurationMs) ||
    isNaN(currentStreak) ||
    timerDurationMs <= 0 ||
    answerTimeMs < 0
  ) {
    return 0;
  }

  if (!correct) return 0;

  // Base points
  const base = 100;

  // Time bonus: 50 pts when answerTimeMs = 0, 0 pts when answerTimeMs >= timerDurationMs
  const timeRatio = clamp(answerTimeMs / timerDurationMs, 0, 1);
  const timeBonus = Math.round(50 * (1 - timeRatio));

  // Streak bonus: 10 per streak level, max 100
  const streakBonus = clamp(currentStreak * 10, 0, 100);

  return base + timeBonus + streakBonus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vault rank calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the VaultRank earned for a completed vault.
 *
 * Thresholds are scaled by totalQuestions (calibrated for 10 questions):
 *   < 400  → Bronze Key
 *   < 700  → Silver Key
 *   < 1000 → Gold Key
 *   < 1400 → Master Cracker
 *   >= 1400 → Vault Legend
 *
 * For vaults with a different question count, thresholds are scaled proportionally.
 */
export function calculateVaultRank(score: number, totalQuestions: number): VaultRank {
  if (isNaN(score) || score < 0) return 'Bronze Key';
  if (!totalQuestions || totalQuestions <= 0) return 'Bronze Key';

  // Calibrate thresholds to actual question count
  const scale = totalQuestions / 10;
  const bronze = 400 * scale;
  const silver = 700 * scale;
  const gold = 1000 * scale;
  const master = 1400 * scale;

  if (score >= master) return 'Vault Legend';
  if (score >= gold) return 'Master Cracker';
  if (score >= silver) return 'Gold Key';
  if (score >= bronze) return 'Silver Key';
  return 'Bronze Key';
}

// ─────────────────────────────────────────────────────────────────────────────
// Accuracy helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns accuracy as an integer percentage (0–100).
 * Returns 0 if total is 0 or either argument is invalid.
 */
export function computeAccuracy(correct: number, total: number): number {
  if (!total || isNaN(total) || isNaN(correct) || total <= 0) return 0;
  return Math.round(clamp((correct / total) * 100, 0, 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall stats aggregation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes aggregate stats from an array of VaultAttempts.
 */
export function computeOverallStats(attempts: VaultAttempt[]): {
  totalGamesPlayed: number;
  totalPuzzlesAnswered: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  bestVaultScore: number;
  bestStreak: number;
} {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return {
      totalGamesPlayed: 0,
      totalPuzzlesAnswered: 0,
      totalCorrectAnswers: 0,
      overallAccuracy: 0,
      bestVaultScore: 0,
      bestStreak: 0,
    };
  }

  let totalPuzzlesAnswered = 0;
  let totalCorrectAnswers = 0;
  let bestVaultScore = 0;
  let bestStreak = 0;

  for (const attempt of attempts) {
    if (!attempt || typeof attempt !== 'object') continue;
    totalPuzzlesAnswered += attempt.totalQuestions ?? 0;
    totalCorrectAnswers += attempt.correctCount ?? 0;
    if ((attempt.score ?? 0) > bestVaultScore) bestVaultScore = attempt.score;
    if ((attempt.bestStreak ?? 0) > bestStreak) bestStreak = attempt.bestStreak;
  }

  return {
    totalGamesPlayed: attempts.length,
    totalPuzzlesAnswered,
    totalCorrectAnswers,
    overallAccuracy: computeAccuracy(totalCorrectAnswers, totalPuzzlesAnswered),
    bestVaultScore,
    bestStreak,
  };
}
