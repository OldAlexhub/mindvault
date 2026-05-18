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
import { useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import { getSettings, getStats, getDailyProgress, getThemeUnlocks, saveSettings, saveThemeUnlocks } from '../storage/storage';
import { getTheme, ALL_THEMES, THEME_UNLOCK_REQUIREMENTS } from '../theme';
import type { ThemeConfig, ThemeId, AppSettings, AppStats, ThemeUnlocks, DailyProgress } from '../types';

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

export function ThemesScreen(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [themeUnlocks, setThemeUnlocks] = useState<ThemeUnlocks | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [applying, setApplying] = useState<ThemeId | null>(null);

  const colors = theme ?? DEFAULT_COLORS;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedSettings, loadedStats, unlocks, daily] = await Promise.all([
        getSettings(),
        getStats(),
        getThemeUnlocks(),
        getDailyProgress(),
      ]);
      setSettings(loadedSettings);
      setTheme(getTheme(loadedSettings.selectedThemeId));
      setStats(loadedStats);
      setThemeUnlocks(unlocks);
      setDailyProgress(daily);
    } catch { /* Use defaults */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData]),
  );

  function isUnlocked(themeId: ThemeId): boolean {
    return themeUnlocks?.unlockedThemeIds?.includes(themeId) ?? themeId === 'classic';
  }

  function getProgress(themeId: ThemeId): { current: number; required: number; label: string } {
    const req = THEME_UNLOCK_REQUIREMENTS[themeId];
    if (!req || req.type === 'default') return { current: 0, required: 0, label: 'Available from the start' };

    const totalGames = stats?.totalGamesPlayed ?? 0;
    const bestScore = stats?.bestVaultScore ?? 0;
    const dailyStreak = dailyProgress?.currentStreak ?? 0;

    switch (req.type) {
      case 'games':
        return { current: totalGames, required: req.value, label: `${totalGames} / ${req.value} games` };
      case 'score':
        return { current: bestScore, required: req.value, label: `Best score: ${bestScore} / ${req.value}` };
      case 'streak':
        return { current: dailyStreak, required: req.value, label: `Daily streak: ${dailyStreak} / ${req.value} days` };
      default:
        return { current: 0, required: 0, label: '' };
    }
  }

  async function handleApply(themeId: ThemeId) {
    if (!settings || !themeUnlocks) return;
    setApplying(themeId);
    setApplyError('');
    setApplySuccess('');

    try {
      const updatedSettings: AppSettings = { ...settings, selectedThemeId: themeId, updatedAt: new Date().toISOString() };
      const updatedUnlocks: ThemeUnlocks = { ...themeUnlocks, selectedThemeId: themeId, updatedAt: new Date().toISOString() };

      await Promise.all([
        saveSettings(updatedSettings),
        saveThemeUnlocks(updatedUnlocks),
      ]);

      setSettings(updatedSettings);
      setThemeUnlocks(updatedUnlocks);
      setTheme(getTheme(themeId));
      setApplySuccess(`${getTheme(themeId).name} applied!`);

      setTimeout(() => setApplySuccess(''), 2000);
    } catch {
      setApplyError('Failed to apply theme. Please try again.');
    } finally {
      setApplying(null);
    }
  }

  const selectedThemeId = settings?.selectedThemeId ?? 'classic';
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
          <Text style={styles.title}>Themes</Text>
          <Text style={styles.subtitle}>Unlock and apply new vault skins</Text>
        </View>

        {applySuccess !== '' && (
          <View style={[styles.successBanner, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}>
            <Text style={[styles.successBannerText, { color: colors.success }]}>{applySuccess}</Text>
          </View>
        )}

        {applyError !== '' && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '22', borderColor: colors.error + '55' }]}>
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{applyError}</Text>
          </View>
        )}

        {ALL_THEMES.map((themeConfig) => {
          const unlocked = isUnlocked(themeConfig.id);
          const isSelected = themeConfig.id === selectedThemeId;
          const progress = getProgress(themeConfig.id);
          const req = THEME_UNLOCK_REQUIREMENTS[themeConfig.id];
          const isApplying = applying === themeConfig.id;

          const progressRatio = req.type !== 'default' && progress.required > 0
            ? Math.min(1, progress.current / progress.required)
            : 1;

          return (
            <View
              key={themeConfig.id}
              style={[
                styles.themeCard,
                isSelected && { borderColor: themeConfig.accent, borderWidth: 2 },
                !unlocked && styles.lockedCard,
              ]}
            >
              {/* Theme Preview Strip */}
              <View style={[styles.previewStrip, { backgroundColor: themeConfig.background }]}>
                <View style={[styles.previewAccentBar, { backgroundColor: themeConfig.accent }]} />
                <View style={[styles.previewDot, { backgroundColor: themeConfig.accentSecondary }]} />
                <View style={[styles.previewDot, { backgroundColor: themeConfig.success }]} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardName, !unlocked && { opacity: 0.5 }]}>
                    {themeConfig.name}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: themeConfig.accent + '33', borderColor: themeConfig.accent }]}>
                      <Text style={[styles.selectedBadgeText, { color: themeConfig.accent }]}>Active</Text>
                    </View>
                  )}
                  {unlocked && !isSelected && (
                    <View style={[styles.unlockedBadge, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}>
                      <Text style={[styles.unlockedBadgeText, { color: colors.success }]}>Unlocked</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.cardDesc, !unlocked && { opacity: 0.5 }]}>
                  {themeConfig.description}
                </Text>

                {/* Unlock condition */}
                {!unlocked && (
                  <>
                    <Text style={styles.unlockCondition}>{themeConfig.unlockCondition}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${Math.round(progressRatio * 100)}%`, backgroundColor: themeConfig.accent }]} />
                    </View>
                    <Text style={styles.progressLabel}>{progress.label}</Text>
                  </>
                )}

                {/* Apply Button */}
                {unlocked && !isSelected && (
                  <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: themeConfig.accent }]}
                    onPress={() => handleApply(themeConfig.id)}
                    disabled={isApplying}
                    activeOpacity={0.85}
                  >
                    {isApplying
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.applyButtonText}>Apply</Text>
                    }
                  </TouchableOpacity>
                )}
                {isSelected && (
                  <View style={[styles.applyButton, { backgroundColor: themeConfig.accent + '44' }]}>
                    <Text style={[styles.applyButtonText, { color: themeConfig.accent }]}>Applied</Text>
                  </View>
                )}
                {!unlocked && (
                  <View style={[styles.applyButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.applyButtonText, { color: colors.textMuted }]}>Locked</Text>
                  </View>
                )}
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
      paddingBottom: 14,
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
    successBanner: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    successBannerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    errorBanner: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    errorBannerText: {
      fontSize: 14,
      fontWeight: '600',
    },
    themeCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    lockedCard: {
      opacity: 0.85,
    },
    previewStrip: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 8,
    },
    previewAccentBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
    },
    previewDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    cardBody: {
      padding: 14,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    cardName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    selectedBadge: {
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    selectedBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    unlockedBadge: {
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    unlockedBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    cardDesc: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
      marginBottom: 10,
    },
    unlockCondition: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.card,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: 6,
      borderRadius: 3,
    },
    progressLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 10,
    },
    applyButton: {
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
    adSpacer: {
      height: 8,
    },
  });
}
