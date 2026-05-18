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
import { getSettings, getStats } from '../storage/storage';
import { getTheme } from '../theme';
import type { AppStats, ThemeConfig, VaultType, ModeStats } from '../types';
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

interface VaultMode {
  type: VaultType;
  icon: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const VAULT_MODES: VaultMode[] = [
  {
    type: 'quick',
    icon: '⚡',
    name: 'Quick Vault',
    description: '10 mixed brain puzzles. Pattern, number, memory, word, and world.',
    difficulty: 'Medium',
  },
  {
    type: 'pattern',
    icon: '🔷',
    name: 'Pattern Vault',
    description: '10 visual pattern and sequence challenges.',
    difficulty: 'Medium',
  },
  {
    type: 'number',
    icon: '🔢',
    name: 'Number Vault',
    description: '10 number sequences and numeric reasoning puzzles.',
    difficulty: 'Hard',
  },
  {
    type: 'memory',
    icon: '🧠',
    name: 'Memory Vault',
    description: '8 memory grid recall challenges. Remember fast.',
    difficulty: 'Hard',
  },
  {
    type: 'word',
    icon: '📝',
    name: 'Word Vault',
    description: '10 word analogies, associations, synonyms, and antonyms.',
    difficulty: 'Easy',
  },
  {
    type: 'world',
    icon: '🌍',
    name: 'World Vault',
    description: '10 country, capital, region, and geography puzzles.',
    difficulty: 'Easy',
  },
];

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
  const [stats, setStats] = useState<AppStats | null>(null);

  const colors = theme ?? DEFAULT_COLORS;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [settings, loadedStats] = await Promise.all([
            getSettings(),
            getStats(),
          ]);
          if (!active) return;
          setTheme(getTheme(settings.selectedThemeId));
          setStats(loadedStats);
        } catch {
          // Use defaults on error
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, []),
  );

  function getBestScore(type: VaultType): number {
    const modeStats: ModeStats | undefined = stats?.modeStats?.[type];
    return modeStats?.bestScore ?? 0;
  }

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
          <Text style={styles.title}>Choose a Vault</Text>
          <Text style={styles.subtitle}>Select a challenge and crack it open</Text>
        </View>

        {/* Vault Cards */}
        {VAULT_MODES.map((mode) => {
          const bestScore = getBestScore(mode.type);
          return (
            <View key={mode.type} style={styles.vaultCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardIcon}>{mode.icon}</Text>
                <View style={styles.cardTitleArea}>
                  <Text style={styles.cardName}>{mode.name}</Text>
                  <View style={[
                    styles.diffBadge,
                    { borderColor: difficultyColor(mode.difficulty, colors) + '88' },
                  ]}>
                    <Text style={[
                      styles.diffText,
                      { color: difficultyColor(mode.difficulty, colors) },
                    ]}>
                      {mode.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardDescription}>{mode.description}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.bestScoreArea}>
                  <Text style={styles.bestScoreLabel}>Best Score</Text>
                  <Text style={styles.bestScoreValue}>
                    {bestScore > 0 ? bestScore : '--'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() =>
                    navigation.navigate('Game', {
                      vaultType: mode.type,
                      isDaily: false,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

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
    vaultCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardIcon: {
      fontSize: 30,
      marginRight: 12,
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
    },
    bestScoreArea: {
      flexDirection: 'column',
    },
    bestScoreLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    bestScoreValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    playButton: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 28,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    adSpacer: {
      height: 8,
    },
  });
}
