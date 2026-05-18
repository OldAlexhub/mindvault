import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { VaultAttempt, ThemeConfig } from '../types';
import { getTodayKey, getDateKey } from '../utils/date';

export interface WeeklySummaryCardProps {
  attempts: VaultAttempt[];
  theme: ThemeConfig;
}

const DAY_LABELS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Builds an ordered array of the last 7 calendar days ending today.
 * Returns objects with a dateKey (YYYY-MM-DD) and a short label (Mon, Tue, …).
 */
function buildWeekDays(): Array<{ dateKey: string; label: string }> {
  const today = new Date();
  const days: Array<{ dateKey: string; label: string }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      dateKey: getDateKey(d),
      label: DAY_LABELS[d.getDay()],
    });
  }
  return days;
}

export function WeeklySummaryCard({
  attempts,
  theme,
}: WeeklySummaryCardProps): React.ReactElement {
  const todayKey = getTodayKey();
  const weekDays = buildWeekDays();

  // Build a set of dateKeys from the start of the 7-day window to today.
  const weekStart = weekDays[0].dateKey;

  // Filter attempts that are completed and fall within this week.
  const weekAttempts = attempts.filter((a) => {
    if (!a.completedAt) return false;
    const dateKey = getDateKey(new Date(a.completedAt));
    return dateKey >= weekStart && dateKey <= todayKey;
  });

  // Which days had at least one completed attempt.
  const activeDays = new Set<string>(
    weekAttempts.map((a) => getDateKey(new Date(a.completedAt))),
  );

  const gamesThisWeek = weekAttempts.length;

  const bestThisWeek =
    weekAttempts.length > 0
      ? Math.max(...weekAttempts.map((a) => a.score))
      : 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      {/* Title */}
      <Text style={[styles.title, { color: theme.text }]}>This Week</Text>

      {/* 7-day activity bar */}
      <View style={styles.barRow}>
        {weekDays.map(({ dateKey, label }) => {
          const active = activeDays.has(dateKey);
          const isToday = dateKey === todayKey;
          return (
            <View key={dateKey} style={styles.dayColumn}>
              <View
                style={[
                  styles.daySquare,
                  {
                    backgroundColor: active
                      ? theme.accent
                      : theme.surface,
                    borderColor: isToday ? theme.accent : theme.border,
                    borderWidth: isToday ? 1.5 : 1,
                  },
                ]}
              />
              <Text style={[styles.dayLabel, { color: theme.textDim }]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.accent }]}>
            {gamesThisWeek}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            {gamesThisWeek === 1 ? 'game this week' : 'games this week'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.accent }]}>
            {bestThisWeek > 0 ? bestThisWeek : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            best this week
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  daySquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 36,
    marginHorizontal: 8,
  },
});
