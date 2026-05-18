import React, { useState, useCallback } from 'react';
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
import { getSettings } from '../storage/storage';
import { getTheme } from '../theme';
import { getDailyProgressData, isTodayCompleted } from '../game/dailyVault';
import { getTodayKey, formatDateDisplay } from '../utils/date';
import { shareDailyResult } from '../services/shareResults';
import type { ThemeConfig, DailyProgress, VaultAttempt } from '../types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DailyStackParamList } from '../navigation';

type DailyNav = StackNavigationProp<DailyStackParamList, 'DailyVault'>;

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

export function DailyVaultScreen(): React.ReactElement {
  const navigation = useNavigation<DailyNav>();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [todayCompleted, setTodayCompleted] = useState(false);

  const colors = theme ?? DEFAULT_COLORS;
  const todayKey = getTodayKey();
  const todayFormatted = formatDateDisplay(todayKey);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, progress, completed] = await Promise.all([
        getSettings(),
        getDailyProgressData(),
        isTodayCompleted(),
      ]);
      setTheme(getTheme(settings.selectedThemeId));
      setDailyProgress(progress);
      setTodayCompleted(completed);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const dailyStreak = dailyProgress?.currentStreak ?? 0;
  const todayScore = dailyProgress?.dailyScores?.[todayKey];

  // Recent daily completions (last 5 completed dates)
  const recentDates: Array<{ dateKey: string; score: number }> = (() => {
    if (!dailyProgress) return [];
    const completedDates = dailyProgress.completedDates ?? {};
    const dailyScores = dailyProgress.dailyScores ?? {};
    return Object.keys(completedDates)
      .filter((d) => completedDates[d] && d !== todayKey)
      .sort((a, b) => (b > a ? 1 : -1))
      .slice(0, 5)
      .map((d) => ({ dateKey: d, score: dailyScores[d] ?? 0 }));
  })();

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
          <Text style={styles.title}>Daily Vault</Text>
          <Text style={styles.dateText}>{todayFormatted}</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakTextArea}>
            <Text style={styles.streakLabel}>Daily Streak</Text>
            <Text style={styles.streakValue}>
              {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View style={[
            styles.streakBadge,
            { backgroundColor: dailyStreak > 0 ? colors.accent + '33' : colors.surface },
          ]}>
            <Text style={[
              styles.streakBadgeText,
              { color: dailyStreak > 0 ? colors.accent : colors.textMuted },
            ]}>
              {dailyStreak > 0 ? 'Active' : 'Start!'}
            </Text>
          </View>
        </View>

        {/* Main Daily Card */}
        <View style={styles.mainCard}>
          {!todayCompleted ? (
            <>
              <View style={styles.mainCardHeader}>
                <View style={[styles.availableBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '66' }]}>
                  <Text style={[styles.availableBadgeText, { color: colors.accent }]}>Available Today</Text>
                </View>
              </View>
              <Text style={styles.mainCardTitle}>Today's Vault is Ready</Text>
              <Text style={styles.mainCardDesc}>
                12 puzzles. Deterministic daily challenge. Same puzzles for everyone today.
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() =>
                  navigation.navigate('Game', {
                    vaultType: 'daily',
                    isDaily: true,
                    dailyDate: todayKey,
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.startButtonText}>Start Daily Vault</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.mainCardHeader}>
                <View style={[styles.completedBadge, { backgroundColor: colors.success + '22', borderColor: colors.success + '66' }]}>
                  <Text style={[styles.completedBadgeText, { color: colors.success }]}>Completed Today</Text>
                </View>
              </View>
              <Text style={styles.mainCardTitle}>Vault Cracked Today!</Text>
              {todayScore != null && (
                <Text style={styles.completedScore}>
                  Score: <Text style={styles.completedScoreNum}>{todayScore}</Text>
                </Text>
              )}
              <TouchableOpacity
                style={styles.replayButton}
                onPress={() =>
                  navigation.navigate('Game', {
                    vaultType: 'daily',
                    isDaily: false,
                    dailyDate: todayKey,
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.replayButtonText}>Play Again (no streak reward)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent Completions */}
        {recentDates.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Completions</Text>
            {recentDates.map((item) => (
              <View key={item.dateKey} style={styles.recentItem}>
                <Text style={styles.recentDate}>{formatDateDisplay(item.dateKey)}</Text>
                <View style={styles.recentRight}>
                  <Text style={styles.recentScore}>{item.score > 0 ? item.score : '--'}</Text>
                  <Text style={styles.recentScoreLabel}>pts</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {recentDates.length === 0 && todayCompleted && (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentText}>
              This is your first daily vault. Keep the streak going tomorrow!
            </Text>
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
      paddingTop: 20,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    dateText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    streakCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakEmoji: {
      fontSize: 30,
      marginRight: 12,
    },
    streakTextArea: {
      flex: 1,
    },
    streakLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    streakValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    streakBadge: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    streakBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    mainCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mainCardHeader: {
      marginBottom: 10,
    },
    availableBadge: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
    },
    availableBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    completedBadge: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
    },
    completedBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    mainCardTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6,
    },
    mainCardDesc: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 16,
    },
    completedScore: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 16,
    },
    completedScoreNum: {
      color: colors.accent,
      fontWeight: '800',
      fontSize: 18,
    },
    startButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    replayButton: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 52,
      justifyContent: 'center',
      marginBottom: 10,
    },
    replayButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    recentSection: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    recentItem: {
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
    recentDate: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    recentRight: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    recentScore: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    recentScoreLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    emptyRecent: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyRecentText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    adSpacer: {
      height: 8,
    },
  });
}
