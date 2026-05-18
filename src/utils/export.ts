import type { AppStats, VaultAttempt, AppSettings, DailyProgress, ThemeUnlocks } from '../types';

export interface ExportData {
  appName: string;
  exportedAt: string;
  version: string;
  settings: AppSettings;
  stats: AppStats;
  dailyProgress: DailyProgress;
  themeUnlocks: ThemeUnlocks;
  recentAttempts: VaultAttempt[];
}

function vaultTypeName(type: string): string {
  switch (type) {
    case 'quick':   return 'Quick Vault';
    case 'pattern': return 'Pattern Vault';
    case 'number':  return 'Number Vault';
    case 'memory':  return 'Memory Vault';
    case 'word':    return 'Word Vault';
    case 'world':   return 'World Vault';
    case 'daily':   return 'Daily Vault';
    default:        return type;
  }
}

export function buildExportData(params: {
  settings: AppSettings;
  stats: AppStats;
  attempts: VaultAttempt[];
  daily: DailyProgress;
  themes: ThemeUnlocks;
}): ExportData {
  const { settings, stats, attempts, daily, themes } = params;
  // Include only last 50 attempts (most recent first)
  const recentAttempts = [...attempts]
    .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
    .slice(0, 50);

  return {
    appName: 'MindVault',
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    settings,
    stats,
    dailyProgress: daily,
    themeUnlocks: themes,
    recentAttempts,
  };
}

export function exportToJson(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function exportToText(data: ExportData): string {
  const { stats, dailyProgress, recentAttempts } = data;

  const accuracy =
    stats.totalPuzzlesAnswered > 0
      ? Math.round((stats.totalCorrectAnswers / stats.totalPuzzlesAnswered) * 100)
      : 0;

  const bestModeName = stats.bestMode ? vaultTypeName(stats.bestMode) : 'N/A';

  const exportDate = (() => {
    try {
      return new Date(data.exportedAt).toLocaleDateString();
    } catch {
      return data.exportedAt;
    }
  })();

  const lines: string[] = [
    'MindVault - Score Summary',
    `Exported: ${exportDate}`,
    '',
    `Total Games: ${stats.totalGamesPlayed}`,
    `Best Vault Score: ${stats.bestVaultScore}`,
    `Overall Accuracy: ${accuracy}%`,
    `Best Streak: ${stats.bestStreak}`,
    `Daily Streak: ${dailyProgress.currentStreak}`,
    `Best Mode: ${bestModeName}`,
    '',
    '--- Recent Attempts ---',
  ];

  const recent10 = recentAttempts.slice(0, 10);
  if (recent10.length === 0) {
    lines.push('No recent attempts.');
  } else {
    for (let i = 0; i < recent10.length; i++) {
      const a = recent10[i];
      const attemptDate = (() => {
        try {
          return new Date(a.completedAt).toLocaleDateString();
        } catch {
          return a.completedAt;
        }
      })();
      const attemptAccuracy = Math.round(a.accuracy);
      lines.push(
        `${i + 1}. ${vaultTypeName(a.vaultType)} | Score: ${a.score} | ` +
        `Accuracy: ${attemptAccuracy}% | Rank: ${a.vaultRank} | Date: ${attemptDate}`,
      );
    }
  }

  return lines.join('\n');
}
