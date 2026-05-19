import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HomeScreen } from '../screens/HomeScreen';
import { VaultSelectScreen } from '../screens/VaultSelectScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { DailyVaultScreen } from '../screens/DailyVaultScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ThemesScreen } from '../screens/ThemesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';

import type { VaultType, VaultAttempt } from '../types';

// ─── Route param lists ────────────────────────────────────────────────────────

export type VaultsStackParamList = {
  VaultSelect: undefined;
  Game: { vaultType: VaultType; isDaily?: boolean; dailyDate?: string; vaultLevel?: number };
  Results: { attempt: VaultAttempt };
};

export type DailyStackParamList = {
  DailyVault: undefined;
  Game: { vaultType: VaultType; isDaily?: boolean; dailyDate?: string; vaultLevel?: number };
  Results: { attempt: VaultAttempt };
};

export type SettingsStackParamList = {
  Settings: undefined;
  PrivacyPolicy: undefined;
  Themes: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  VaultsTab: undefined;
  DailyTab: undefined;
  StatsTab: undefined;
  SettingsTab: undefined;
};

// ─── Stack navigators ─────────────────────────────────────────────────────────

const VaultsStack = createStackNavigator<VaultsStackParamList>();

function VaultsNavigator(): React.ReactElement {
  return (
    <VaultsStack.Navigator screenOptions={{ headerShown: false }}>
      <VaultsStack.Screen name="VaultSelect" component={VaultSelectScreen} />
      <VaultsStack.Screen name="Game" component={GameScreen} />
      <VaultsStack.Screen name="Results" component={ResultsScreen} />
    </VaultsStack.Navigator>
  );
}

const DailyStack = createStackNavigator<DailyStackParamList>();

function DailyNavigator(): React.ReactElement {
  return (
    <DailyStack.Navigator screenOptions={{ headerShown: false }}>
      <DailyStack.Screen name="DailyVault" component={DailyVaultScreen} />
      <DailyStack.Screen name="Game" component={GameScreen} />
      <DailyStack.Screen name="Results" component={ResultsScreen} />
    </DailyStack.Navigator>
  );
}

const SettingsStack = createStackNavigator<SettingsStackParamList>();

function SettingsNavigator(): React.ReactElement {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <SettingsStack.Screen name="Themes" component={ThemesScreen} />
    </SettingsStack.Navigator>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }): React.ReactElement {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {emoji}
    </Text>
  );
}

// ─── Bottom tab navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

function RootTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ],
        tabBarActiveTintColor: '#4f8ef7',
        tabBarInactiveTintColor: '#555577',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="VaultsTab"
        component={VaultsNavigator}
        options={{
          tabBarLabel: 'Vaults',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DailyTab"
        component={DailyNavigator}
        options={{
          tabBarLabel: 'Daily',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator (default export) ─────────────────────────────────────────

export default function RootNavigator(): React.ReactElement {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#0f0f1a',
    borderTopColor: '#2a2a45',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
