import type {
  GameSession,
  Puzzle,
  VaultType,
  TimerMode,
  VaultAttempt,
  VaultRank,
  PuzzleSummary,
  AppStats,
  ModeStats,
  ThemeUnlocks,
} from '../types';
import { generateId } from '../utils/validation';
import {
  calculateScore,
  calculateVaultRank,
  computeAccuracy,
  TIMER_DURATIONS,
} from './scoring';
import {
  saveAttempt,
  getStats,
  saveStats,
  getThemeUnlocks,
  saveThemeUnlocks,
  getVaultProgress,
  saveVaultProgress,
} from '../storage/storage';
import { getTodayKey } from '../utils/date';

// ─────────────────────────────────────────────────────────────────────────────
// Timer helper
// ─────────────────────────────────────────────────────────────────────────────

export function getTimerDuration(timerMode: TimerMode): number {
  return TIMER_DURATIONS[timerMode] ?? TIMER_DURATIONS.standard;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh GameSession for the given vault type and puzzle list.
 */
export function createGameSession(
  vaultType: VaultType,
  puzzles: Puzzle[],
  timerMode: TimerMode,
  options: { vaultLevel?: number } = {},
): GameSession {
  return {
    id: generateId(),
    vaultType,
    vaultLevel: options.vaultLevel,
    puzzles,
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    startedAt: new Date().toISOString(),
    timerMode,
    answers: [],
    isComplete: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer submission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submits an answer for the current puzzle.
 *
 * - Returns unchanged session if session is complete or the current puzzle
 *   has already been answered (prevents double-submission).
 * - Calculates points using the scoring engine.
 * - Updates streak and bestStreak.
 */
export function submitAnswer(
  session: GameSession,
  choiceIndex: number,
  answerTimeMs: number,
): { session: GameSession; points: number; correct: boolean; correctIndex: number } {
  // Guard: session complete
  if (session.isComplete) {
    const puzzle = session.puzzles[session.currentIndex];
    return { session, points: 0, correct: false, correctIndex: puzzle?.correctIndex ?? 0 };
  }

  const puzzle = session.puzzles[session.currentIndex];
  if (!puzzle) {
    return { session, points: 0, correct: false, correctIndex: 0 };
  }

  // Guard: already answered this puzzle
  const alreadyAnswered = session.answers.some((a) => a.puzzleId === puzzle.id);
  if (alreadyAnswered) {
    return { session, points: 0, correct: false, correctIndex: puzzle.correctIndex };
  }

  const correct = choiceIndex === puzzle.correctIndex;
  const timerDurationMs = getTimerDuration(session.timerMode);

  const points = calculateScore({
    correct,
    answerTimeMs,
    timerDurationMs,
    currentStreak: session.streak,
  });

  const newStreak = correct ? session.streak + 1 : 0;
  const newBestStreak = Math.max(session.bestStreak, newStreak);

  const updatedSession: GameSession = {
    ...session,
    score: session.score + points,
    streak: newStreak,
    bestStreak: newBestStreak,
    answers: [
      ...session.answers,
      {
        puzzleId: puzzle.id,
        choiceIndex,
        timeMs: answerTimeMs,
        correct,
        points,
      },
    ],
  };

  return { session: updatedSession, points, correct, correctIndex: puzzle.correctIndex };
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeout handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles a puzzle timeout: counts as a wrong answer with 0 points.
 * Returns updated session and the correctIndex for UI display.
 */
export function handleTimeout(
  session: GameSession,
): { session: GameSession; correctIndex: number } {
  if (session.isComplete) {
    return { session, correctIndex: 0 };
  }

  const puzzle = session.puzzles[session.currentIndex];
  if (!puzzle) {
    return { session, correctIndex: 0 };
  }

  // Check for double-submission
  const alreadyAnswered = session.answers.some((a) => a.puzzleId === puzzle.id);
  if (alreadyAnswered) {
    return { session, correctIndex: puzzle.correctIndex };
  }

  const timerDurationMs = getTimerDuration(session.timerMode);

  const updatedSession: GameSession = {
    ...session,
    streak: 0, // broken by timeout
    answers: [
      ...session.answers,
      {
        puzzleId: puzzle.id,
        choiceIndex: -1, // -1 indicates timeout
        timeMs: timerDurationMs,
        correct: false,
        points: 0,
      },
    ],
  };

  return { session: updatedSession, correctIndex: puzzle.correctIndex };
}

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle advancement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Advances to the next puzzle.
 * If there are no more puzzles, marks the session as complete.
 */
export function advancePuzzle(session: GameSession): GameSession {
  if (session.isComplete) return session;

  const nextIndex = session.currentIndex + 1;

  if (nextIndex >= session.puzzles.length) {
    return { ...session, currentIndex: nextIndex, isComplete: true };
  }

  return { ...session, currentIndex: nextIndex };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session finishing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finalizes a completed session:
 * 1. Builds a VaultAttempt record with full statistics
 * 2. Saves the attempt to storage
 * 3. Updates aggregate AppStats
 * 4. Checks and applies any theme unlock conditions
 * 5. Returns the completed VaultAttempt
 */
export async function finishSession(session: GameSession): Promise<VaultAttempt> {
  const completedAt = new Date().toISOString();
  const totalQuestions = session.puzzles.length;
  const correctCount = session.answers.filter((a) => a.correct).length;
  const accuracy = computeAccuracy(correctCount, totalQuestions);
  const vaultRank: VaultRank = calculateVaultRank(session.score, totalQuestions);

  // Build puzzle summaries
  const puzzleSummaries: PuzzleSummary[] = session.puzzles.map((puzzle) => {
    const answer = session.answers.find((a) => a.puzzleId === puzzle.id);
    return {
      puzzleId: puzzle.id,
      puzzleType: puzzle.type,
      wasCorrect: answer?.correct ?? false,
      answerTimeMs: answer?.timeMs ?? 0,
      pointsEarned: answer?.points ?? 0,
    };
  });

  // Fastest correct answer
  const correctAnswerTimes = session.answers
    .filter((a) => a.correct && a.timeMs > 0)
    .map((a) => a.timeMs);
  const fastestAnswerMs =
    correctAnswerTimes.length > 0 ? Math.min(...correctAnswerTimes) : 0;

  const isDaily = session.vaultType === 'daily';

  const attempt: VaultAttempt = {
    id: generateId(),
    vaultType: session.vaultType,
    vaultLevel: session.vaultLevel,
    startedAt: session.startedAt,
    completedAt,
    score: session.score,
    correctCount,
    totalQuestions,
    accuracy,
    bestStreak: session.bestStreak,
    fastestAnswerMs,
    timerMode: session.timerMode,
    isDaily,
    dailyDate: isDaily ? getTodayKey() : undefined,
    vaultRank,
    puzzleSummaries,
  };

  // Save attempt (fire-and-forget; errors are caught internally)
  await saveAttempt(attempt);

  // Update aggregate stats
  try {
    const stats = await getStats();
    const updatedStats = updateStatsWithAttempt(stats, attempt);
    await saveStats(updatedStats);
    await updateVaultProgressWithAttempt(attempt);

    // Check theme unlocks
    await checkAndUpdateThemeUnlocks(updatedStats, attempt);
  } catch {
    // Stats update is non-critical; session still completes
  }

  return attempt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats update helper
// ─────────────────────────────────────────────────────────────────────────────

async function updateVaultProgressWithAttempt(attempt: VaultAttempt): Promise<void> {
  if (attempt.isDaily || !attempt.vaultLevel || attempt.vaultLevel < 1) return;

  const progress = await getVaultProgress();
  const levelKey = String(attempt.vaultLevel);
  const bestScore = Math.max(progress.bestScores[levelKey] ?? 0, attempt.score);

  await saveVaultProgress({
    ...progress,
    unlockedLevel: Math.max(progress.unlockedLevel ?? 1, attempt.vaultLevel + 1),
    completedLevels: {
      ...progress.completedLevels,
      [levelKey]: true,
    },
    bestScores: {
      ...progress.bestScores,
      [levelKey]: bestScore,
    },
    updatedAt: new Date().toISOString(),
  });
}

function updateStatsWithAttempt(stats: AppStats, attempt: VaultAttempt): AppStats {
  const now = new Date().toISOString();

  // Update totals
  const totalGamesPlayed = (stats.totalGamesPlayed ?? 0) + 1;
  const totalPuzzlesAnswered = (stats.totalPuzzlesAnswered ?? 0) + attempt.totalQuestions;
  const totalCorrectAnswers = (stats.totalCorrectAnswers ?? 0) + attempt.correctCount;
  const bestVaultScore = Math.max(stats.bestVaultScore ?? 0, attempt.score);
  const bestStreak = Math.max(stats.bestStreak ?? 0, attempt.bestStreak);

  // Update per-mode stats
  const existingMode: ModeStats = stats.modeStats?.[attempt.vaultType] ?? {
    gamesPlayed: 0,
    bestScore: 0,
    totalScore: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestStreak: 0,
  };

  const updatedMode: ModeStats = {
    gamesPlayed: existingMode.gamesPlayed + 1,
    bestScore: Math.max(existingMode.bestScore, attempt.score),
    totalScore: existingMode.totalScore + attempt.score,
    totalCorrect: existingMode.totalCorrect + attempt.correctCount,
    totalQuestions: existingMode.totalQuestions + attempt.totalQuestions,
    bestStreak: Math.max(existingMode.bestStreak, attempt.bestStreak),
  };

  // Determine best mode by highest bestScore
  const modeStats = {
    ...stats.modeStats,
    [attempt.vaultType]: updatedMode,
  };

  let bestMode = stats.bestMode;
  if (!bestMode || (modeStats[attempt.vaultType]?.bestScore ?? 0) >= (modeStats[bestMode]?.bestScore ?? 0)) {
    bestMode = attempt.vaultType;
  }

  return {
    ...stats,
    totalGamesPlayed,
    totalPuzzlesAnswered,
    totalCorrectAnswers,
    bestVaultScore,
    bestStreak,
    modeStats,
    bestMode,
    updatedAt: now,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme unlock check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether any new themes should be unlocked given the latest stats
 * and the just-completed attempt, then persists any changes to storage.
 *
 * Unlock conditions:
 *   classic  : always unlocked (default)
 *   neon     : totalGamesPlayed >= 5
 *   cyber    : totalGamesPlayed >= 10
 *   ancient  : bestVaultScore >= 500
 *   midnight : currentDailyStreak >= 3
 */
async function checkAndUpdateThemeUnlocks(
  stats: AppStats,
  _attempt: VaultAttempt,
): Promise<void> {
  try {
    const unlocks = await getThemeUnlocks();
    const alreadyUnlocked = new Set(unlocks.unlockedThemeIds);
    let changed = false;

    // neon
    if (!alreadyUnlocked.has('neon') && stats.totalGamesPlayed >= 5) {
      alreadyUnlocked.add('neon');
      changed = true;
    }

    // cyber
    if (!alreadyUnlocked.has('cyber') && stats.totalGamesPlayed >= 10) {
      alreadyUnlocked.add('cyber');
      changed = true;
    }

    // ancient
    if (!alreadyUnlocked.has('ancient') && stats.bestVaultScore >= 500) {
      alreadyUnlocked.add('ancient');
      changed = true;
    }

    // midnight: based on daily streak stored in stats
    if (!alreadyUnlocked.has('midnight') && (stats.currentDailyStreak ?? 0) >= 3) {
      alreadyUnlocked.add('midnight');
      changed = true;
    }

    if (changed) {
      const updated: ThemeUnlocks = {
        ...unlocks,
        unlockedThemeIds: [...alreadyUnlocked],
        updatedAt: new Date().toISOString(),
      };
      await saveThemeUnlocks(updated);
    }
  } catch {
    // Non-critical: silently fail
  }
}
