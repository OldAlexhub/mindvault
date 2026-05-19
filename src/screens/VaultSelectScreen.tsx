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
import { getSettings, getVaultProgress, saveSettings } from '../storage/storage';
import { getTheme } from '../theme';
import { refreshPuzzleDataIfNeeded } from '../services/publicDataRefresh';
import {
  difficultyForLevel,
  VAULT_UNLOCK_ACCURACY,
  vaultDisplayName,
  vaultTypeForLevel,
  vaultTypeLabel,
  visibleVaultLevels,
} from '../game/vaultProgression';
import type { ThemeConfig, VaultProgress } from '../types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { VaultsStackParamList } from '../navigation';

type Nav = StackNavigationProp<VaultsStackParamList, 'VaultSelect'>;

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

function difficultyColor(
  diff: 'Easy' | 'Medium' | 'Hard',
  colors: typeof DEFAULT_COLORS,
): string {
  switch (diff) {
    case 'Easy': return colors.success;
    case 'Medium': return '#f0a030';
    case 'Hard': return colors.error;
    default: return colors.textMuted;
  }
}

export function VaultSelectScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [progress, setProgress] = useState<VaultProgress | null>(null);
  const [refreshingData, setRefreshingData] = useState(false);

  const colors = theme ?? DEFAULT_COLORS;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [loadedSettings, loadedProgress] = await Promise.all([
            getSettings(),
            getVaultProgress(),
          ]);
          if (!active) return;
          setTheme(getTheme(loadedSettings.selectedThemeId));
          setProgress(loadedProgress);
          setRefreshingData(true);
          refreshPuzzleDataIfNeeded()
            .then(async ({ word, world }) => {
              if (!active || !word.success || !world.success) return;
              const updated = {
                ...loadedSettings,
                lastDataRefreshAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await saveSettings(updated);
            })
            .finally(() => {
              if (active) setRefreshingData(false);
            });
        } catch {
          // Use defaults on error.
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => { active = false; };
    }, []),
  );

  const unlockedLevel = progress?.unlockedLevel ?? 1;
  const levels = visibleVaultLevels(unlockedLevel);
  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top', 'left', 'right']}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Vault Path</Text>
          <Text style={styles.subtitle}>Score at least {VAULT_UNLOCK_ACCURACY}% to open the next vault.</Text>
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              Next vault: {vaultDisplayName(unlockedLevel)}
            </Text>
          </View>
        </View>

        {levels.map((level) => {
          const type = vaultTypeForLevel(level);
          const label = vaultTypeLabel(type);
          const difficulty = difficultyForLevel(level);
          const locked = level > unlockedLevel;
          const completed = Boolean(progress?.completedLevels[String(level)]);
          const bestScore = progress?.bestScores[String(level)] ?? 0;

          return (
            <View
              key={level}
              style={[
                styles.vaultCard,
                locked && styles.lockedCard,
                completed && { borderColor: colors.success + '88' },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.levelBadge, locked && styles.lockedBadge]}>
                  <Text style={styles.levelBadgeText}>{level}</Text>
                </View>
                <View style={styles.cardTitleArea}>
                  <Text style={[styles.cardName, locked && { color: colors.textMuted }]}>
                    {vaultDisplayName(level)}
                  </Text>
                  <View style={[
                    styles.diffBadge,
                    { borderColor: difficultyColor(difficulty, colors) + '88' },
                  ]}>
                    <Text style={[
                      styles.diffText,
                      { color: difficultyColor(difficulty, colors) },
                    ]}>
                      {difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardDescription}>
                {label} challenge. Seeded puzzle mix for this vault.
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.bestScoreArea}>
                  <Text style={styles.bestScoreLabel}>
                    {completed ? 'Best Score' : locked ? 'Unlocks With' : 'Status'}
                  </Text>
                  <Text style={[
                    styles.bestScoreValue,
                    locked && { color: colors.textMuted },
                    completed && { color: colors.success },
                  ]}>
                    {completed ? bestScore : locked ? `${VAULT_UNLOCK_ACCURACY}% on ${vaultDisplayName(level - 1)}` : 'Ready'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    locked && styles.lockedButton,
                    completed && { backgroundColor: colors.surface, borderColor: colors.success + '88' },
                  ]}
                  onPress={() =>
                    navigation.navigate('Game', {
                      vaultType: type,
                      isDaily: false,
                      vaultLevel: level,
                    })
                  }
                  activeOpacity={0.85}
                  disabled={locked}
                >
                  <Text style={[
                    styles.playButtonText,
                    completed && { color: colors.success },
                    locked && { color: colors.textMuted },
                  ]}>
                    {locked ? 'Locked' : completed ? 'Replay' : 'Play'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {refreshingData && (
          <Text style={styles.refreshNote}>Refreshing puzzle data...</Text>
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
    center: {
      justifyContent: 'center',
      alignItems: 'center',
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
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    progressPill: {
      alignSelf: 'flex-start',
      marginTop: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.accent + '88',
      backgroundColor: colors.accent + '22',
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    progressPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    vaultCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lockedCard: {
      opacity: 0.62,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    levelBadge: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lockedBadge: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    levelBadgeText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#fff',
    },
    cardTitleArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    cardName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    diffBadge: {
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    diffText: {
      fontSize: 11,
      fontWeight: '700',
    },
    cardDescription: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
      marginBottom: 14,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    bestScoreArea: {
      flex: 1,
    },
    bestScoreLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    bestScoreValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
      marginTop: 2,
    },
    playButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 22,
      minHeight: 48,
      minWidth: 96,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lockedButton: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    playButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    refreshNote: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    adSpacer: {
      height: 8,
    },
  });
}
