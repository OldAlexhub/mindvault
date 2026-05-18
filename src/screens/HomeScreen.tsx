import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import {
  getSettings,
  getStats,
  getAttempts,
  getDailyProgress,
} from '../storage/storage';
import { getTheme } from '../theme';
import { formatDateDisplay } from '../utils/date';
import { getTodayKey } from '../utils/date';
import type { AppSettings, AppStats, VaultAttempt, DailyProgress, ThemeConfig } from '../types';

const DEFAULT_COLORS = {
  background: '#0f0f1a',
  surface: '#16162a',
  card: '#1e1e35',
  accent: '#4f8ef7',
  text: '#f0f0ff',
  textMuted: '#9999bb',
  border: '#2a2a45',
  success: '#4caf73',
  error: '#e05555',
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
    default: return 'Vault';
  }
}

export function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<VaultAttempt[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);

  const colors = theme ?? DEFAULT_COLORS;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, loadedStats, attempts, daily] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
      ]);
      const loadedTheme = getTheme(settings.selectedThemeId);
      setTheme(loadedTheme);
      setStats(loadedStats);
      setRecentAttempts(attempts.slice(0, 3));
      setDailyProgress(daily);
      setStatsError(false);
    } catch {
      setStatsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const todayKey = getTodayKey();
  const todayFormatted = formatDateDisplay(todayKey);
  const todayCompleted = dailyProgress?.completedDates?.[todayKey] ?? false;
  const dailyStreak = dailyProgress?.currentStreak ?? 0;

  const totalGamesPlayed = stats?.totalGamesPlayed ?? 0;
  const bestVaultScore = stats?.bestVaultScore ?? 0;
  const currentDailyStreak = stats?.currentDailyStreak ?? dailyStreak;

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MindVault</Text>
          <Text style={styles.titleEmoji}>🔐</Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingCard}>
          {totalGamesPlayed === 0 ? (
            <Text style={styles.greetingText}>
              Crack your first vault and start building your score.
            </Text>
          ) : (
            <Text style={styles.greetingText}>
              Welcome back! Your best score: <Text style={styles.greetingAccent}>{bestVaultScore}</Text>
            </Text>
          )}
        </View>

        {/* Stats error */}
        {statsError && (
          <Text style={styles.errorNote}>
            Stats could not be loaded. You can still play.
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{bestVaultScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentDailyStreak}</Text>
            <Text style={styles.statLabel}>Streak days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalGamesPlayed}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('VaultsTab')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Crack a Vault</Text>
        </TouchableOpacity>

        {/* Daily Vault Card */}
        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>Daily Vault</Text>
            <View style={[
              styles.dailyBadge,
              { backgroundColor: todayCompleted ? colors.success + '33' : colors.border },
            ]}>
              <Text style={[
                styles.dailyBadgeText,
                { color: todayCompleted ? colors.success : colors.textMuted },
              ]}>
                {todayCompleted ? 'Completed' : 'Available'}
              </Text>
            </View>
          </View>
          <Text style={styles.dailyDate}>{todayFormatted}</Text>
          <Text style={styles.dailyStreak}>
            Daily Streak: <Text style={styles.dailyStreakNum}>{dailyStreak} days</Text>
          </Text>
          <TouchableOpacity
            style={styles.dailyButton}
            onPress={() => navigation.navigate('DailyTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.dailyButtonText}>
              {todayCompleted ? 'View Daily Vault' : 'Start Daily Vault'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Vaults</Text>
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
                  <View style={styles.attemptRight}>
                    <Text style={styles.attemptScore}>{attempt.score}</Text>
                    <Text style={styles.attemptAccuracy}>{accuracy}% accuracy</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    titleEmoji: {
      fontSize: 28,
      marginLeft: 10,
    },
    greetingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    greetingText: {
      fontSize: 15,
      color: colors.textMuted,
      lineHeight: 22,
    },
    greetingAccent: {
      color: colors.accent,
      fontWeight: '700',
    },
    errorNote: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 8,
      fontStyle: 'italic',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.accent,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
      minHeight: 52,
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.3,
    },
    dailyCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dailyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    dailyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    dailyBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    dailyBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    dailyDate: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 4,
    },
    dailyStreak: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 12,
    },
    dailyStreakNum: {
      color: colors.accent,
      fontWeight: '700',
    },
    dailyButton: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.accent + '66',
      minHeight: 52,
      justifyContent: 'center',
    },
    dailyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
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
    attemptCard: {
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
    attemptLeft: {
      flex: 1,
    },
    attemptVault: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    attemptDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    attemptRight: {
      alignItems: 'flex-end',
    },
    attemptScore: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    attemptAccuracy: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    adSpacer: {
      height: 8,
    },
  });
}
