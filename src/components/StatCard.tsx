import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ThemeConfig } from '../types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  theme: ThemeConfig;
  small?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  theme,
  small = false,
}: StatCardProps): React.ReactElement {
  return (
    <View
      style={[
        styles.card,
        small && styles.cardSmall,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {icon ? (
        <Text style={[styles.icon, small && styles.iconSmall]}>{icon}</Text>
      ) : null}
      <Text
        style={[
          styles.value,
          small && styles.valueSmall,
          { color: theme.accent },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          { color: theme.textMuted },
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    flex: 1,
  },
  cardSmall: {
    padding: 10,
    borderRadius: 10,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  iconSmall: {
    fontSize: 18,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  valueSmall: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 11,
  },
});
