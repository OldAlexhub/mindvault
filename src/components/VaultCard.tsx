import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import type { ThemeConfig } from '../types';

interface VaultCardProps {
  icon: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bestScore: number;
  onPress: () => void;
  theme: ThemeConfig;
}

function difficultyColor(difficulty: 'Easy' | 'Medium' | 'Hard', theme: ThemeConfig): string {
  switch (difficulty) {
    case 'Easy':   return theme.success;
    case 'Medium': return theme.warning;
    case 'Hard':   return theme.error;
    default:       return theme.textMuted;
  }
}

export function VaultCard({
  icon,
  name,
  description,
  difficulty,
  bestScore,
  onPress,
  theme,
}: VaultCardProps): React.ReactElement {
  const badgeColor = difficultyColor(difficulty, theme);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      {/* Icon row */}
      <View style={styles.topRow}>
        <Text style={styles.icon}>{icon}</Text>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: badgeColor + '22', borderColor: badgeColor },
          ]}
        >
          <Text style={[styles.difficultyText, { color: badgeColor }]}>
            {difficulty}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: theme.text }]}>{name}</Text>

      {/* Description */}
      <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
        {description}
      </Text>

      {/* Best score footer */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.bestScoreLabel, { color: theme.textDim }]}>Best Score</Text>
        <Text style={[styles.bestScoreValue, { color: theme.accent }]}>
          {bestScore > 0 ? bestScore : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 32,
  },
  difficultyBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  bestScoreLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bestScoreValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
