import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import { getSettings, getStats } from '../storage/storage';
import { getTheme } from '../theme';
import { shareResult } from '../services/shareResults';
import {
  meetsVaultUnlockRequirement,
  VAULT_UNLOCK_ACCURACY,
  vaultDisplayName,
  vaultTypeLabel,
} from '../game/vaultProgression';
import type { ThemeConfig, VaultAttempt, AppStats } from '../types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { VaultsStackParamList } from '../navigation';

type ResultsRouteProp = RouteProp<VaultsStackParamList, 'Results'>;
type ResultsNavProp = StackNavigationProp<VaultsStackParamList, 'Results'>;

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

function getRankColor(rank: string, colors: typeof DEFAULT_COLORS): string {
  switch (rank) {
    case 'Bronze Key': return '#cd7f32';
    case 'Silver Key': return '#a0a0b0';
    case 'Gold Key': return '#ffd700';
    case 'Master Cracker': return '#9b59b6';
    case 'Vault Legend': return '#00e5ff';
    default: return colors.accent;
  }
}

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '--';
  const seconds = Math.floor(ms / 1000);
  const millis = ms % 1000;
  return `${seconds}.${String(Math.floor(millis / 100))}s`;
}

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

export function ResultsScreen(): React.ReactElement {
  const navigation = useNavigation<ResultsNavProp>();
  const route = useRoute<ResultsRouteProp>();
  const attempt: VaultAttempt = route.params?.attempt;

  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareError, setShareError] = useState('');
  const [sharing, setSharing] = useState(false);

  const colors = theme ?? DEFAULT_COLORS;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loadedSettings, loadedStats] = await Promise.all([
          getSettings(),
          getStats(),
        ]);
        if (!active) return;
        setTheme(getTheme(loadedSettings.selectedThemeId));
        setStats(loadedStats);
      } catch { /* Use defaults */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  if (!attempt) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_COLORS.background, justifyContent: 'center', alignItems: 'center' }} edges={['top', 'left', 'right']}>
        <Text style={{ color: DEFAULT_COLORS.error, fontSize: 16 }}>No result data found.</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('VaultSelect')}
          style={{ marginTop: 16, padding: 16, backgroundColor: DEFAULT_COLORS.accent, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Vaults</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const accuracy = Math.round(attempt.accuracy);
  const cracked = attempt.isDaily ? accuracy >= 60 : meetsVaultUnlockRequirement(accuracy);
  const rankColor = getRankColor(attempt.vaultRank, colors);
  const isNewBest = stats != null && attempt.score >= stats.bestVaultScore && attempt.score > 0;
  const displayVaultName = attempt.vaultLevel
    ? `${vaultDisplayName(attempt.vaultLevel)} - ${vaultTypeLabel(attempt.vaultType)}`
    : vaultTypeName(attempt.vaultType);

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  async function handleShare() {
    setSharing(true);
    setShareError('');
    try {
      const result = await shareResult(attempt);
      if (!result.success) {
        setShareError(result.message);
      }
    } catch {
      setShareError('Sharing is not available.');
    } finally {
      setSharing(false);
    }
  }

  function handlePlayAgain() {
    const isDaily = attempt.vaultType === 'daily';
    navigation.replace('Game', {
      vaultType: attempt.vaultType,
      isDaily,
      dailyDate: attempt.dailyDate,
      vaultLevel: attempt.vaultLevel,
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vault Status Header */}
        <View style={styles.statusHeader}>
          <Text style={[styles.statusTitle, { color: cracked ? colors.success : colors.textMuted }]}>
            {cracked ? 'Vault Cracked! 🔓' : 'Vault Failed 🔒'}
          </Text>
          <Text style={styles.vaultNameText}>{displayVaultName}</Text>
          {!attempt.isDaily && (
            <Text style={styles.unlockHint}>
              {cracked ? 'Next vault unlocked.' : `${VAULT_UNLOCK_ACCURACY}% needed to unlock the next vault.`}
            </Text>
          )}
        </View>

        {/* New Best Badge */}
        {isNewBest && (
          <View style={styles.newBestBadge}>
            <Text style={styles.newBestText}>New Best Score!</Text>
          </View>
        )}

        {/* Rank Badge */}
        <View style={[styles.rankBadge, { borderColor: rankColor }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>{attempt.vaultRank}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statBig, { color: colors.accent }]}>{attempt.score}</Text>
            <Text style={styles.statName}>Vault Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statBig}>{accuracy}%</Text>
            <Text style={styles.statName}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statBig}>{attempt.correctCount}/{attempt.totalQuestions}</Text>
            <Text style={styles.statName}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statBig}>{attempt.bestStreak}</Text>
            <Text style={styles.statName}>Best Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statBig}>{formatMs(attempt.fastestAnswerMs)}</Text>
            <Text style={styles.statName}>Fastest Answer</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statBig}>{attempt.timerMode}</Text>
            <Text style={styles.statName}>Timer Mode</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsStack}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePlayAgain}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('VaultSelect')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Try Another Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.getParent()?.navigate('StatsTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>View Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={styles.shareButtonText}>Share Result</Text>
            )}
          </TouchableOpacity>

          {!!shareError && (
            <Text style={styles.shareError}>{shareError}</Text>
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
    statusHeader: {
      paddingTop: 24,
      paddingBottom: 12,
      alignItems: 'center',
    },
    statusTitle: {
      fontSize: 26,
      fontWeight: '800',
      textAlign: 'center',
    },
    vaultNameText: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: 4,
    },
    unlockHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
      textAlign: 'center',
    },
    newBestBadge: {
      alignSelf: 'center',
      backgroundColor: '#ffd70033',
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#ffd70088',
      marginBottom: 12,
    },
    newBestText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffd700',
    },
    rankBadge: {
      alignSelf: 'center',
      borderRadius: 16,
      borderWidth: 2,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginBottom: 20,
    },
    rankText: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    statItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      width: '47%',
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statBig: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    statName: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
      textAlign: 'center',
    },
    buttonsStack: {
      gap: 10,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 52,
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    shareButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.accent,
      minHeight: 52,
      justifyContent: 'center',
    },
    shareButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.accent,
    },
    shareError: {
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
