import { Share } from 'react-native';
import type { VaultAttempt } from '../types';
import { vaultDisplayName, vaultTypeLabel } from '../game/vaultProgression';

function vaultTypeName(type: string): string {
  switch (type) {
    case 'quick':   return 'Quick Vault';
    case 'pattern': return 'Pattern Vault';
    case 'number':  return 'Number Vault';
    case 'memory':  return 'Memory Vault';
    case 'word':    return 'Word Vault';
    case 'world':   return 'World Vault';
    case 'daily':   return 'Daily Vault';
    default:        return 'Vault';
  }
}

export function buildShareText(attempt: VaultAttempt): string {
  const name = attempt.vaultLevel
    ? `${vaultDisplayName(attempt.vaultLevel)} - ${vaultTypeLabel(attempt.vaultType)}`
    : vaultTypeName(attempt.vaultType);
  const accuracy = Math.round(attempt.accuracy);
  return (
    `I cracked a vault in MindVault!\n\n` +
    `Vault: ${name}\n` +
    `Vault Score: ${attempt.score}\n` +
    `Accuracy: ${accuracy}%\n` +
    `Best Streak: ${attempt.bestStreak}\n` +
    `Rank: ${attempt.vaultRank}\n\n` +
    `Can you beat my score?`
  );
}

export function buildDailyShareText(attempt: VaultAttempt, streak: number): string {
  const accuracy = Math.round(attempt.accuracy);
  const dailyLabel = attempt.dailyDate ? ` (${attempt.dailyDate})` : '';
  return (
    `I completed today's Daily Vault in MindVault!\n\n` +
    `Daily Vault${dailyLabel}\n` +
    `Vault Score: ${attempt.score}\n` +
    `Accuracy: ${accuracy}%\n` +
    `Best Streak: ${attempt.bestStreak}\n` +
    `Rank: ${attempt.vaultRank}\n` +
    `Daily Streak: ${streak} day${streak === 1 ? '' : 's'}\n\n` +
    `Can you beat my score?`
  );
}

export function buildStatsSummaryShareText(stats: {
  totalGamesPlayed: number;
  bestVaultScore: number;
  bestStreak: number;
  totalCorrectAnswers: number;
  totalPuzzlesAnswered: number;
  currentDailyStreak: number;
}): string {
  const accuracy =
    stats.totalPuzzlesAnswered > 0
      ? Math.round((stats.totalCorrectAnswers / stats.totalPuzzlesAnswered) * 100)
      : 0;
  return (
    `My MindVault Stats\n\n` +
    `Total Games: ${stats.totalGamesPlayed}\n` +
    `Best Vault Score: ${stats.bestVaultScore}\n` +
    `Overall Accuracy: ${accuracy}%\n` +
    `Best Streak: ${stats.bestStreak}\n` +
    `Daily Streak: ${stats.currentDailyStreak} day${stats.currentDailyStreak === 1 ? '' : 's'}\n\n` +
    `Think you can top that? Play MindVault!`
  );
}

export async function shareResult(
  attempt: VaultAttempt,
): Promise<{ success: boolean; message: string }> {
  try {
    const text = buildShareText(attempt);
    const result = await Share.share({ message: text });
    if (result.action === Share.dismissedAction) {
      return { success: false, message: 'Share dismissed.' };
    }
    return { success: true, message: 'Shared successfully.' };
  } catch {
    return { success: false, message: 'Sharing not available.' };
  }
}

export async function shareDailyResult(
  attempt: VaultAttempt,
  streak: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const text = buildDailyShareText(attempt, streak);
    const result = await Share.share({ message: text });
    if (result.action === Share.dismissedAction) {
      return { success: false, message: 'Share dismissed.' };
    }
    return { success: true, message: 'Shared successfully.' };
  } catch {
    return { success: false, message: 'Sharing not available.' };
  }
}

export async function shareStatsSummary(
  stats: {
    totalGamesPlayed: number;
    bestVaultScore: number;
    bestStreak: number;
    totalCorrectAnswers: number;
    totalPuzzlesAnswered: number;
    currentDailyStreak: number;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    const text = buildStatsSummaryShareText(stats);
    const result = await Share.share({ message: text });
    if (result.action === Share.dismissedAction) {
      return { success: false, message: 'Share dismissed.' };
    }
    return { success: true, message: 'Shared successfully.' };
  } catch {
    return { success: false, message: 'Sharing not available.' };
  }
}
