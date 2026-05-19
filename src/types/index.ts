export type VaultType = 'quick' | 'pattern' | 'number' | 'memory' | 'word' | 'world' | 'daily';
export type TimerMode = 'relaxed' | 'standard' | 'rush';
export type ThemeId = 'classic' | 'neon' | 'cyber' | 'ancient' | 'midnight';
export type VaultRank = 'Bronze Key' | 'Silver Key' | 'Gold Key' | 'Master Cracker' | 'Vault Legend';
export type PuzzleType = 'pattern' | 'number' | 'memory' | 'logic' | 'word' | 'world';
export type DataSource = 'bundled' | 'datamuse' | 'restcountries';

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  timerMode: TimerMode;
  selectedThemeId: ThemeId;
  adsAcknowledged: boolean;
  sharingAcknowledged: boolean;
  lastDataRefreshAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModeStats {
  gamesPlayed: number;
  bestScore: number;
  totalScore: number;
  totalCorrect: number;
  totalQuestions: number;
  bestStreak: number;
}

export interface AppStats {
  totalGamesPlayed: number;
  totalPuzzlesAnswered: number;
  totalCorrectAnswers: number;
  bestVaultScore: number;
  bestStreak: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
  bestMode: VaultType | null;
  modeStats: Partial<Record<VaultType, ModeStats>>;
  createdAt: string;
  updatedAt: string;
}

export interface VaultProgress {
  unlockedLevel: number;
  completedLevels: Record<string, boolean>;
  bestScores: Record<string, number>;
  updatedAt: string;
}

export interface PuzzleSummary {
  puzzleId: string;
  puzzleType: PuzzleType;
  wasCorrect: boolean;
  answerTimeMs: number;
  pointsEarned: number;
}

export interface VaultAttempt {
  id: string;
  vaultType: VaultType;
  vaultLevel?: number;
  startedAt: string;
  completedAt: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  bestStreak: number;
  fastestAnswerMs: number;
  timerMode: TimerMode;
  isDaily: boolean;
  dailyDate?: string;
  vaultRank: VaultRank;
  puzzleSummaries: PuzzleSummary[];
}

export interface DailyProgress {
  lastCompletedDate: string | null;
  completedDates: Record<string, boolean>;
  currentStreak: number;
  longestStreak: number;
  dailyScores: Record<string, number>;
  updatedAt: string;
}

export interface ThemeUnlocks {
  selectedThemeId: ThemeId;
  unlockedThemeIds: ThemeId[];
  unlockProgress: Partial<Record<ThemeId, number>>;
  updatedAt: string;
}

export interface CachedWordData {
  source: DataSource;
  refreshedAt: string;
  words: string[];
  relationships: WordRelationship[];
}

export interface WordRelationship {
  word: string;
  related: string[];
  type: 'synonym' | 'antonym' | 'association';
}

export interface Country {
  name: string;
  capital: string;
  region: string;
  population: number;
  flagEmoji: string;
}

export interface CachedWorldData {
  source: DataSource;
  refreshedAt: string;
  countries: Country[];
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export interface GameSession {
  id: string;
  vaultType: VaultType;
  vaultLevel?: number;
  puzzles: Puzzle[];
  currentIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  startedAt: string;
  timerMode: TimerMode;
  answers: Array<{ puzzleId: string; choiceIndex: number; timeMs: number; correct: boolean; points: number }>;
  isComplete: boolean;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  unlockCondition: string;
  background: string;
  surface: string;
  card: string;
  accent: string;
  accentSecondary: string;
  text: string;
  textMuted: string;
  textDim: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}
