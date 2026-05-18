import { ThemeId, ThemeConfig } from '../types';

const classicTheme: ThemeConfig = {
  id: 'classic',
  name: 'Classic Vault',
  description: 'The original deep charcoal and blue palette.',
  unlockCondition: 'Available from the start.',
  background: '#0f0f1a',
  surface: '#16162a',
  card: '#1e1e35',
  accent: '#4f8ef7',
  accentSecondary: '#7c5cbf',
  text: '#f0f0ff',
  textMuted: '#9999bb',
  textDim: '#555577',
  border: '#2a2a45',
  success: '#4caf73',
  error: '#e05555',
  warning: '#f0a030',
};

const neonTheme: ThemeConfig = {
  id: 'neon',
  name: 'Neon Surge',
  description: 'A high-voltage dark theme with electric neon green highlights.',
  unlockCondition: 'Play 5 games to unlock.',
  background: '#050f0a',
  surface: '#0a1f14',
  card: '#102918',
  accent: '#00ff88',
  accentSecondary: '#00cc66',
  text: '#e0fff0',
  textMuted: '#80c0a0',
  textDim: '#305040',
  border: '#1a4030',
  success: '#00ff88',
  error: '#ff4466',
  warning: '#ffcc00',
};

const cyberTheme: ThemeConfig = {
  id: 'cyber',
  name: 'Cyber Circuit',
  description: 'A futuristic dark theme with cyan circuit-board accents.',
  unlockCondition: 'Play 10 games to unlock.',
  background: '#050a12',
  surface: '#0a1525',
  card: '#101e35',
  accent: '#00d4ff',
  accentSecondary: '#0088cc',
  text: '#d0f0ff',
  textMuted: '#6090b0',
  textDim: '#203040',
  border: '#1a3050',
  success: '#00ff88',
  error: '#ff4455',
  warning: '#ffaa00',
};

const ancientTheme: ThemeConfig = {
  id: 'ancient',
  name: 'Ancient Relic',
  description: 'A dark earthy theme inspired by ancient vaults and gold artifacts.',
  unlockCondition: 'Reach a best score of 500 to unlock.',
  background: '#12090a',
  surface: '#1e1005',
  card: '#2a1808',
  accent: '#d4a843',
  accentSecondary: '#a07830',
  text: '#ffe8c0',
  textMuted: '#b09060',
  textDim: '#504030',
  border: '#3a2415',
  success: '#a0c840',
  error: '#d04040',
  warning: '#d4a843',
};

const midnightTheme: ThemeConfig = {
  id: 'midnight',
  name: 'Midnight Gold',
  description: 'Pure black depths with golden highlights for the most dedicated.',
  unlockCondition: 'Maintain a 3-day daily streak to unlock.',
  background: '#000008',
  surface: '#080812',
  card: '#10101e',
  accent: '#ffd700',
  accentSecondary: '#c0a000',
  text: '#fff8e0',
  textMuted: '#a09060',
  textDim: '#404030',
  border: '#202018',
  success: '#60d060',
  error: '#e04040',
  warning: '#ffd700',
};

export const ALL_THEMES: ThemeConfig[] = [
  classicTheme,
  neonTheme,
  cyberTheme,
  ancientTheme,
  midnightTheme,
];

const THEME_MAP: Record<ThemeId, ThemeConfig> = {
  classic: classicTheme,
  neon: neonTheme,
  cyber: cyberTheme,
  ancient: ancientTheme,
  midnight: midnightTheme,
};

export function getTheme(id: ThemeId): ThemeConfig {
  return THEME_MAP[id] ?? classicTheme;
}

export const THEME_UNLOCK_REQUIREMENTS: Record<
  ThemeId,
  { type: 'default' | 'games' | 'score' | 'streak'; value: number; label: string }
> = {
  classic: {
    type: 'default',
    value: 0,
    label: 'Available from the start',
  },
  neon: {
    type: 'games',
    value: 5,
    label: 'Play 5 games',
  },
  cyber: {
    type: 'games',
    value: 10,
    label: 'Play 10 games',
  },
  ancient: {
    type: 'score',
    value: 500,
    label: 'Reach a best score of 500',
  },
  midnight: {
    type: 'streak',
    value: 3,
    label: 'Maintain a 3-day daily streak',
  },
};
