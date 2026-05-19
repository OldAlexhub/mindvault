import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import { WeeklySummaryCard } from '../components/WeeklySummaryCard';
import { getSettings, getStats, getAttempts, getDailyProgress, getThemeUnlocks } from '../storage/storage';
import { getTheme } from '../theme';
import { buildExportData, exportToJson, exportToText } from '../utils/export';
import { shareStatsSummary } from '../services/shareResults';
import { formatDateDisplay } from '../utils/date';
import type { ThemeConfig, AppStats, VaultAttempt, DailyProgress } from '../types';

const DEFAULT_COLORS: ThemeConfig = {
  id: 'classic',
  name: 'Classic',
  description: '',
  unlockCondition: '',
  background: '#0f0f1a',
  surface: '#16162a',
  card: '#1e1e35',
  accent: '#4f8ef7',
  accentSecondary: '#7aa8ff',
  text: '#f0f0ff',
  textMuted: '#9999bb',
  textDim: '#777799',
  border: '#2a2a45',
  success: '#4caf73',
  error: '#e05555',
  warning: '#f0a030',
};

function vaultTypeName(type: string): string {
  switch (type) {
    case 'quick': return 'Quick Vault';
    case 'pattern': return 'Pattern Vault';
    case 'number': return 'Number Vault';
    case 'memory': return 'Memory Vault';
    case 'word': return 'Word Vault';
    case 'world': return 'World Vault';
    case 'daily': return 'Daily Vault';
    default: return type;
  }
}

const VAULT_TYPES = ['quick', 'pattern', 'number', 'memory', 'word', 'world', 'daily'] as const;

export function StatsScreen(): React.ReactElement {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [attempts, setAttempts] = useState<VaultAttempt[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [exportBusy, setExportBusy] = useState<'json' | 'text' | 'share' | null>(null);
  const [exportError, setExportError] = useState('');

  const colors = theme ?? DEFAULT_COLORS;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, loadedStats, loadedAttempts, daily] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
      ]);
      setTheme(getTheme(settings.selectedThemeId));
      setStats(loadedStats);
      setAttempts(loadedAttempts);
      setDailyProgress(daily);
    } catch { /* Use defaults */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData]),
  );

  const totalGamesPlayed = stats?.totalGamesPlayed ?? 0;
  const overallAccuracy = stats && stats.totalPuzzlesAnswered > 0
    ? Math.round((stats.totalCorrectAnswers / stats.totalPuzzlesAnswered) * 100)
    : 0;

  async function handleExportJson() {
    setExportBusy('json');
    setExportError('');
    try {
      const [settings, loadedStats, loadedAttempts, daily, themes] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
        getThemeUnlocks(),
      ]);
      const data = buildExportData({ settings, stats: loadedStats, attempts: loadedAttempts, daily, themes });
      const json = exportToJson(data);
      await Share.share({ message: json, title: 'MindVault Data Export (JSON)' });
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExportBusy(null);
    }
  }

  async function handleExportText() {
    setExportBusy('text');
    setExportError('');
    try {
      const [settings, loadedStats, loadedAttempts, daily, themes] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
        getThemeUnlocks(),
      ]);
      const data = buildExportData({ settings, stats: loadedStats, attempts: loadedAttempts, daily, themes });
      const text = exportToText(data);
      await Share.share({ message: text, title: 'MindVault Summary' });
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExportBusy(null);
    }
  }

  async function handleShareSummary() {
    setExportBusy('share');
    setExportError('');
    try {
      const loadedStats = await getStats();
      const daily = await getDailyProgress();
      const result = await shareStatsSummary({
        totalGamesPlayed: loadedStats.totalGamesPlayed,
        bestVaultScore: loadedStats.bestVaultScore,
        bestStreak: loadedStats.bestStreak,
        totalCorrectAnswers: loadedStats.totalCorrectAnswers,
        totalPuzzlesAnswered: loadedStats.totalPuzzlesAnswered,
        currentDailyStreak: daily.currentStreak,
      });
      if (!result.success) setExportError(result.message);
    } catch {
      setExportError('Share failed.');
    } finally {
      setExportBusy(null);
    }
  }

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (totalGamesPlayed === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Stats Yet</Text>
          <Text style={styles.emptyDesc}>
            No vaults cracked yet. Play your first challenge to unlock stats.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('VaultsTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>Crack a Vault</Text>
          </TouchableOpacity>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  const recentAttempts = attempts.slice(0, 10);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Vault Stats</Text>
        </View>

        {/* Top Stats Row */}
        <View style={styles.topStatsRow}>
          <View style={styles.topStatCard}>
            <Text style={[styles.topStatValue, { color: colors.accent }]}>{stats?.bestVaultScore ?? 0}</Text>
            <Text style={styles.topStatLabel}>Best Score</Text>
          </View>
          <View style={styles.topStatCard}>
            <Text style={styles.topStatValue}>{totalGamesPlayed}</Text>
            <Text style={styles.topStatLabel}>Total Games</Text>
          </View>
          <View style={styles.topStatCard}>
            <Text style={styles.topStatValue}>{overallAccuracy}%</Text>
            <Text style={styles.topStatLabel}>Accuracy</Text>
          </View>
        </View>

        {/* Streak Cards */}
        <View style={styles.streakRow}>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakValue}>{dailyProgress?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <Text style={styles.streakValue}>{stats?.longestDailyStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <WeeklySummaryCard attempts={attempts} theme={colors} />

        {/* Best Mode */}
        {stats?.bestMode && (
          <View style={styles.bestModeCard}>
            <Text style={styles.sectionTitle}>Best Mode</Text>
            <Text style={styles.bestModeName}>{vaultTypeName(stats.bestMode)}</Text>
            <Text style={styles.bestModeScore}>
              Best: {stats.modeStats?.[stats.bestMode]?.bestScore ?? 0} pts
            </Text>
          </View>
        )}

        {/* Mode Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode Performance</Text>
          {VAULT_TYPES.map((type) => {
            const modeStats = stats?.modeStats?.[type];
            if (!modeStats || modeStats.gamesPlayed === 0) return null;
            return (
              <View key={type} style={styles.modeRow}>
                <View style={styles.modeLeft}>
                  <Text style={styles.modeName}>{vaultTypeName(type)}</Text>
                  <Text style={styles.modeGames}>{modeStats.gamesPlayed} games</Text>
                </View>
                <View style={styles.modeRight}>
                  <Text style={styles.modeBestScore}>{modeStats.bestScore}</Text>
                  <Text style={styles.modeBestLabel}>best</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Attempts</Text>
            {recentAttempts.map((attempt) => {
              const attemptDate = (() => {
                try { return new Date(attempt.completedAt).toLocaleDateString(); }
                catch { return ''; }
              })();
              const accuracy = Math.round(attempt.accuracy);
              return (
                <View key={attempt.id} style={styles.attemptCard}>
                  <View style={styles.attemptLeft}>
                    <Text style={styles.attemptVault}>{vaultTypeName(attempt.vaultType)}</Text>
                    <Text style={styles.attemptDate}>{attemptDate}</Text>
                  </View>
                  <View style={styles.attemptMiddle}>
                    <Text style={styles.attemptRank}>{attempt.vaultRank}</Text>
                  </View>
                  <View style={styles.attemptRight}>
                    <Text style={styles.attemptScore}>{attempt.score}</Text>
                    <Text style={styles.attemptAccuracy}>{accuracy}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportJson}
            disabled={exportBusy !== null}
            activeOpacity={0.85}
          >
            {exportBusy === 'json'
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={styles.exportButtonText}>Export as JSON</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportText}
            disabled={exportBusy !== null}
            activeOpacity={0.85}
          >
            {exportBusy === 'text'
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={styles.exportButtonText}>Export Summary (Text)</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, { borderColor: colors.accent + '66' }]}
            onPress={handleShareSummary}
            disabled={exportBusy !== null}
            activeOpacity={0.85}
          >
            {exportBusy === 'share'
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={[styles.exportButtonText, { color: colors.accent }]}>Share Stats Summary</Text>
            }
          </TouchableOpacity>
          {!!exportError && (
            <Text style={styles.exportError}>{exportError}</Text>
          )}
        </View>

        <View style={styles.adSpacer} />
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

function makeStyles(colors: typeof DEFAULT_COLORS) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      fontSize: 56,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
    },
    emptyDesc: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    ctaButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 32,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ctaButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    header: {
      paddingTop: 20,
      paddingBottom: 14,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    topStatsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    topStatCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topStatValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    topStatLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 3,
      textAlign: 'center',
    },
    streakRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    streakCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakEmoji: {
      fontSize: 22,
      marginBottom: 4,
    },
    streakValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    streakLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    bestModeCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bestModeName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.accent,
      marginTop: 4,
    },
    bestModeScore: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    modeRow: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeLeft: {
      flex: 1,
    },
    modeName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modeGames: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    modeRight: {
      alignItems: 'flex-end',
    },
    modeBestScore: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    modeBestLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    attemptCard: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attemptLeft: {
      flex: 1,
    },
    attemptVault: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    attemptDate: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    attemptMiddle: {
      flex: 1,
      alignItems: 'center',
    },
    attemptRank: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
    },
    attemptRight: {
      alignItems: 'flex-end',
    },
    attemptScore: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.accent,
    },
    attemptAccuracy: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    exportButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 52,
      justifyContent: 'center',
      marginBottom: 10,
    },
    exportButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    exportError: {
      fontSize: 12,
      color: colors.error,
      textAlign: 'center',
      marginTop: 4,
    },
    adSpacer: {
      height: 8,
    },
  });
}
