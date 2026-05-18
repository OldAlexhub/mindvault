import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getSettings } from '../storage/storage';
import { getTheme } from '../theme';
import type { ThemeConfig } from '../types';

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

interface PolicySection {
  title: string;
  content: string;
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: 'About MindVault',
    content:
      'MindVault is an IQ-style puzzle game developed by Old Alex Hub. It features pattern recognition, number sequences, memory grids, word challenges, and geography puzzles. MindVault is for entertainment and personal challenge only. It is NOT a real IQ test, intelligence assessment, or professional cognitive evaluation. Scores and ranks are for in-game enjoyment and do not reflect actual IQ, intelligence, or any professional measurement.',
  },
  {
    title: 'No Account Required',
    content:
      'MindVault does not require you to create an account or log in. You can use the app completely anonymously. No registration, email address, or personal information is required to play.',
  },
  {
    title: 'No Custom Backend',
    content:
      'MindVault does not operate its own server or backend. Old Alex Hub does not collect, receive, or store any data from your device on any server owned or operated by Old Alex Hub.',
  },
  {
    title: 'Local Storage Only',
    content:
      'All game data, including your scores, streaks, settings, attempts, and theme preferences, is stored exclusively on your local device using Android AsyncStorage. This data never leaves your device unless you choose to export or share it yourself.',
  },
  {
    title: 'Internet Permission',
    content:
      'MindVault requests internet access for two purposes only: (1) to display banner advertisements served by Google AdMob, and (2) to optionally refresh word and world puzzle data from public APIs (Datamuse and REST Countries). Puzzle data refresh is entirely optional and user-initiated. The app is fully playable without an internet connection using bundled puzzle data.',
  },
  {
    title: 'Advertising (Google AdMob)',
    content:
      'MindVault displays banner advertisements provided by Google AdMob (Google LLC). Google AdMob may collect and process certain data in connection with serving advertisements, including advertising identifiers, IP addresses, and usage data. This data collection is governed by Google\'s Privacy Policy (https://policies.google.com/privacy). Old Alex Hub does not receive or control the personal data processed by Google AdMob. Ad transparency is supported through app-ads.txt published at oldalexhub.github.io.',
  },
  {
    title: 'User-Initiated Sharing Only',
    content:
      'MindVault includes optional result-sharing features. Sharing only occurs when you explicitly tap a Share button. Results are composed locally on your device and shared through the Android share sheet. Old Alex Hub does not receive, store, or process any shared content.',
  },
  {
    title: 'Daily Reminders and Notifications',
    content:
      'MindVault offers optional daily brain challenge reminders. Notification permission (POST_NOTIFICATIONS) is requested on first launch. These are local device notifications scheduled by the app on your device. No data is transmitted when a notification is sent or received. You can revoke notification permission at any time in your device settings.',
  },
  {
    title: 'App Permissions',
    content:
      'MindVault requests the following device permissions: INTERNET (required for ads and optional data refresh), POST_NOTIFICATIONS (optional, for daily reminders). MindVault does NOT request access to your camera, contacts, location, microphone, files, or any other sensitive permissions.',
  },
  {
    title: "Children's Privacy",
    content:
      'MindVault is a general-audience puzzle game. We do not knowingly collect any personal information from children under the age of 13. If you are a parent or guardian and believe your child has provided personal information, please contact us so we can address the concern.',
  },
  {
    title: 'Data Deletion',
    content:
      'Because all game data is stored locally on your device, you can delete it at any time. To delete all game data, go to Settings and tap "Reset All Data." This will permanently erase all scores, streaks, settings, and unlock progress from your device. You can also uninstall the app, which will remove all local data.',
  },
  {
    title: 'Changes to This Policy',
    content:
      'This privacy policy may be updated from time to time. Any changes will be reflected in app updates. Continued use of MindVault after an update constitutes acceptance of the revised policy.',
  },
  {
    title: 'Disclaimer',
    content:
      'MindVault is provided for entertainment purposes only. The puzzles, scores, and ranks within the app are not endorsed by any academic, psychological, or professional body. Old Alex Hub makes no warranties regarding the accuracy, completeness, or fitness for purpose of MindVault.',
  },
  {
    title: 'Contact',
    content:
      'If you have any questions or concerns about this privacy policy or MindVault, please contact us at: oldalexhub@gmail.com',
  },
];

export function PrivacyPolicyScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  const colors = theme ?? DEFAULT_COLORS;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const settings = await getSettings();
        if (active) setTheme(getTheme(settings.selectedThemeId));
      } catch { /* Use defaults */ }
    })();
    return () => { active = false; };
  }, []);

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Back Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backArrow}>{'<'}</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>MindVault Privacy Policy</Text>
          <Text style={styles.introDate}>Effective: May 2026</Text>
          <Text style={styles.introText}>
            This policy explains how MindVault handles your data. We are committed to transparency and your privacy.
          </Text>
        </View>

        {/* Policy Sections */}
        {POLICY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.policySection}>
            <Text style={styles.policyTitle}>{section.title}</Text>
            <Text style={styles.policyBody}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Old Alex Hub | oldalexhub@gmail.com
          </Text>
          <Text style={styles.footerText}>
            MindVault is for entertainment purposes only.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: typeof DEFAULT_COLORS) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      minWidth: 70,
    },
    backArrow: {
      fontSize: 18,
      color: colors.accent,
      fontWeight: '700',
      marginRight: 4,
    },
    backLabel: {
      fontSize: 15,
      color: colors.accent,
      fontWeight: '600',
    },
    screenTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    introCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    introTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    introDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 10,
    },
    introText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    policySection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    policyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    policyBody: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
    },
    footer: {
      marginTop: 16,
      padding: 16,
      alignItems: 'center',
      gap: 4,
    },
    footerText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: 24,
    },
  });
}
