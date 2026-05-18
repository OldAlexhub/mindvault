import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import { getSettings, saveSettings, getStats, getDailyProgress, getAttempts, getThemeUnlocks, resetAllData } from '../storage/storage';
import { getTheme } from '../theme';
import { refreshWordData, refreshWorldData } from '../services/publicDataRefresh';
import { buildExportData, exportToJson, exportToText } from '../utils/export';
import { formatDateDisplay } from '../utils/date';
import type { ThemeConfig, AppSettings, TimerMode } from '../types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SettingsStackParamList } from '../navigation';

type SettingsNav = StackNavigationProp<SettingsStackParamList, 'Settings'>;

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

const TIMER_MODES: Array<{ mode: TimerMode; label: string; desc: string }> = [
  { mode: 'relaxed', label: 'Relaxed', desc: '25s' },
  { mode: 'standard', label: 'Standard', desc: '15s' },
  { mode: 'rush', label: 'Rush', desc: '8s' },
];

export function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<SettingsNav>();

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('');
  const [exportBusy, setExportBusy] = useState<'json' | 'text' | null>(null);
  const [exportError, setExportError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const colors = theme ?? DEFAULT_COLORS;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setTheme(getTheme(loadedSettings.selectedThemeId));
    } catch { /* Use defaults */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData]),
  );

  async function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    const updated: AppSettings = { ...settings, [key]: value, updatedAt: new Date().toISOString() };
    setSettings(updated);
    await saveSettings(updated);
    if (key === 'selectedThemeId') {
      setTheme(getTheme(value as any));
    }
  }

  async function handleRefreshData() {
    setRefreshBusy(true);
    setRefreshStatus('Refreshing...');
    try {
      const [wordResult, worldResult] = await Promise.all([
        refreshWordData(),
        refreshWorldData(),
      ]);
      if (wordResult.success && worldResult.success) {
        setRefreshStatus('Data refreshed successfully!');
        if (settings) {
          await updateSetting('lastDataRefreshAt', new Date().toISOString());
        }
      } else {
        const msg = !wordResult.success ? wordResult.message : worldResult.message;
        setRefreshStatus(`Refresh partially failed: ${msg}`);
      }
    } catch {
      setRefreshStatus('Refresh failed. Check your internet connection.');
    } finally {
      setRefreshBusy(false);
    }
  }

  async function handleExportJson() {
    setExportBusy('json');
    setExportError('');
    try {
      const [loadedSettings, stats, attempts, daily, themes] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
        getThemeUnlocks(),
      ]);
      const data = buildExportData({ settings: loadedSettings, stats, attempts, daily, themes });
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
      const [loadedSettings, stats, attempts, daily, themes] = await Promise.all([
        getSettings(),
        getStats(),
        getAttempts(),
        getDailyProgress(),
        getThemeUnlocks(),
      ]);
      const data = buildExportData({ settings: loadedSettings, stats, attempts, daily, themes });
      const text = exportToText(data);
      await Share.share({ message: text, title: 'MindVault Summary' });
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExportBusy(null);
    }
  }

  function handleResetData() {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete your scores, streaks, attempts, and unlocks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetBusy(true);
            try {
              await resetAllData();
              setSettings(null);
              setRefreshStatus('All data has been reset.');
              await loadData();
            } catch {
              Alert.alert('Error', 'Reset failed. Please try again.');
            } finally {
              setResetBusy(false);
            }
          },
        },
      ],
    );
  }

  const styles = makeStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  const lastRefreshDate = settings?.lastDataRefreshAt
    ? (() => {
        try { return new Date(settings.lastDataRefreshAt).toLocaleDateString(); }
        catch { return settings.lastDataRefreshAt; }
      })()
    : 'Never';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ─── GAMEPLAY ──────────────────────────────── */}
        <Text style={styles.sectionHeader}>GAMEPLAY</Text>
        <View style={styles.section}>
          {/* Sound */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowTitle}>Sound</Text>
              <Text style={styles.rowDesc}>Play sound effects</Text>
            </View>
            <Switch
              value={settings?.soundEnabled ?? false}
              onValueChange={(val) => updateSetting('soundEnabled', val)}
              trackColor={{ false: colors.border, true: colors.accent + 'aa' }}
              thumbColor={settings?.soundEnabled ? colors.accent : colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          {/* Vibration */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowTitle}>Vibration</Text>
              <Text style={styles.rowDesc}>Haptic feedback on answers</Text>
            </View>
            <Switch
              value={settings?.vibrationEnabled ?? false}
              onValueChange={(val) => updateSetting('vibrationEnabled', val)}
              trackColor={{ false: colors.border, true: colors.accent + 'aa' }}
              thumbColor={settings?.vibrationEnabled ? colors.accent : colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          {/* Timer Mode */}
          <View style={styles.timerSection}>
            <Text style={styles.rowTitle}>Timer Mode</Text>
            <Text style={styles.rowDesc}>How long you have to answer each puzzle</Text>
            <View style={styles.timerButtons}>
              {TIMER_MODES.map(({ mode, label, desc }) => {
                const selected = settings?.timerMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.timerButton,
                      selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => updateSetting('timerMode', mode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timerButtonLabel, selected && { color: '#fff' }]}>
                      {label}
                    </Text>
                    <Text style={[styles.timerButtonDesc, selected && { color: '#ffffffcc' }]}>
                      {desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ─── DATA ──────────────────────────────────── */}
        <Text style={styles.sectionHeader}>DATA</Text>
        <View style={styles.section}>
          {/* Refresh Data */}
          <View style={styles.refreshRow}>
            <View style={styles.rowLabel}>
              <Text style={styles.rowTitle}>Refresh Puzzle Data</Text>
              <Text style={styles.rowDesc}>Last refreshed: {lastRefreshDate}</Text>
              {refreshStatus !== '' && (
                <Text style={[
                  styles.refreshStatus,
                  { color: refreshStatus.includes('failed') || refreshStatus.includes('Failed') ? colors.error : colors.success },
                ]}>
                  {refreshStatus}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefreshData}
              disabled={refreshBusy}
              activeOpacity={0.85}
            >
              {refreshBusy
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={styles.refreshButtonText}>Refresh</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Export JSON */}
          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExportJson}
            disabled={exportBusy !== null}
            activeOpacity={0.85}
          >
            {exportBusy === 'json'
              ? <ActivityIndicator size="small" color={colors.accent} />
              : (
                <>
                  <Text style={styles.rowTitle}>Export Game Data (JSON)</Text>
                  <Text style={styles.chevron}>›</Text>
                </>
              )
            }
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Export Text */}
          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExportText}
            disabled={exportBusy !== null}
            activeOpacity={0.85}
          >
            {exportBusy === 'text'
              ? <ActivityIndicator size="small" color={colors.accent} />
              : (
                <>
                  <Text style={styles.rowTitle}>Export Summary (Text)</Text>
                  <Text style={styles.chevron}>›</Text>
                </>
              )
            }
          </TouchableOpacity>

          {exportError !== '' && (
            <Text style={styles.exportError}>{exportError}</Text>
          )}

          <View style={styles.divider} />

          {/* Reset All Data */}
          <TouchableOpacity
            style={styles.resetRow}
            onPress={handleResetData}
            disabled={resetBusy}
            activeOpacity={0.85}
          >
            {resetBusy
              ? <ActivityIndicator size="small" color={colors.error} />
              : <Text style={[styles.rowTitle, { color: colors.error }]}>Reset All Data</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ─── PRIVACY & ADS ─────────────────────────── */}
        <Text style={styles.sectionHeader}>PRIVACY AND ADS</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.85}
          >
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Data Safety Summary</Text>
            <Text style={styles.infoText}>
              All game data (scores, settings, streaks) is stored locally on your device only. No personal data is collected or sent to any server by Old Alex Hub.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Ads</Text>
            <Text style={styles.infoText}>
              MindVault shows banner ads through Google AdMob. Internet is used for ads and optional puzzle data refresh. No personal data is collected by Old Alex Hub. Ad transparency is supported through app-ads.txt.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Sharing</Text>
            <Text style={styles.infoText}>
              Sharing results is optional and only happens when you tap Share. Results are created locally and opened in the Android share sheet.
            </Text>
          </View>
        </View>

        {/* ─── ABOUT ─────────────────────────────────── */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('Themes')}
            activeOpacity={0.85}
          >
            <Text style={styles.rowTitle}>Themes</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>About MindVault</Text>
            <Text style={styles.infoText}>
              MindVault is a brain puzzle game developed by Old Alex Hub. It features pattern, number, memory, word, and geography challenges. MindVault is for entertainment and self-challenge purposes only. It is NOT a real IQ test or professional cognitive assessment. Scores do not reflect actual IQ or intelligence.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.versionRow}>
            <Text style={styles.rowTitle}>App Version</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
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
    header: {
      paddingTop: 20,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginTop: 20,
      marginBottom: 8,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      justifyContent: 'space-between',
    },
    rowLabel: {
      flex: 1,
      marginRight: 12,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    rowDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    timerSection: {
      padding: 16,
    },
    timerButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    timerButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    timerButtonLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    timerButtonDesc: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    refreshRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      justifyContent: 'space-between',
    },
    refreshStatus: {
      fontSize: 12,
      marginTop: 4,
    },
    refreshButton: {
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
      alignItems: 'center',
    },
    refreshButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
    exportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      justifyContent: 'space-between',
    },
    exportError: {
      fontSize: 12,
      color: colors.error,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    resetRow: {
      padding: 16,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      justifyContent: 'space-between',
    },
    chevron: {
      fontSize: 20,
      color: colors.textMuted,
    },
    infoBlock: {
      padding: 16,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    infoText: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      justifyContent: 'space-between',
    },
    versionText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    adSpacer: {
      height: 8,
    },
  });
}
