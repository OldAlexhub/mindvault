import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdBanner } from '../components/AdBanner';
import { getSettings } from '../storage/storage';
import { getTheme } from '../theme';
import { getDailyPuzzles } from '../game/dailyVault';
import { generatePuzzlesForVaultAsync } from '../game/puzzleGenerator';
import { vaultDisplayName, vaultSeedForLevel, vaultTypeForLevel, vaultTypeLabel } from '../game/vaultProgression';
import { refreshPuzzleDataIfNeeded } from '../services/publicDataRefresh';
import {
  createGameSession,
  submitAnswer,
  handleTimeout,
  advancePuzzle,
  finishSession,
} from '../game/gameSession';
import { TIMER_DURATIONS } from '../game/scoring';
import type {
  AppSettings,
  ThemeConfig,
  GameSession,
  Puzzle,
  TimerMode,
} from '../types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { VaultsStackParamList } from '../navigation';

type GameRouteProp = RouteProp<VaultsStackParamList, 'Game'>;
type GameNavProp = StackNavigationProp<VaultsStackParamList, 'Game'>;

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

// ─── Memory Puzzle ────────────────────────────────────────────────────────────

interface MemoryConfig {
  gridSize: number;
  cells: number[];
  showMs: number;
}

interface MemoryPuzzleUIProps {
  puzzle: Puzzle;
  onSelect: (choiceIndex: number) => void;
  showFeedback: boolean;
  correctChoiceIndex: number;
  selectedChoice: number | null;
  disabled: boolean;
  colors: typeof DEFAULT_COLORS;
}

function MemoryPuzzleUI({
  puzzle,
  onSelect,
  showFeedback,
  correctChoiceIndex,
  selectedChoice,
  disabled,
  colors,
}: MemoryPuzzleUIProps): React.ReactElement {
  const [phase, setPhase] = useState<'showing' | 'hidden' | 'revealed'>('showing');
  const [tappedCells, setTappedCells] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const configRef = useRef<MemoryConfig | null>(null);

  useEffect(() => {
    setPhase('showing');
    setTappedCells([]);
    setSubmitted(false);

    try {
      const configStr = puzzle.prompt.split('MEMORY_CONFIG:')[1];
      const parsed: MemoryConfig = JSON.parse(configStr.split('\n')[0]);
      configRef.current = parsed;
    } catch {
      configRef.current = null;
    }

    const cfg = configRef.current;
    const showMs = cfg?.showMs ?? 1500;

    const timer = setTimeout(() => {
      setPhase('hidden');
    }, showMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  useEffect(() => {
    if (showFeedback) {
      setPhase('revealed');
    }
  }, [showFeedback]);

  const cfg = configRef.current;
  if (!cfg) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.error }}>Memory puzzle error.</Text>
      </View>
    );
  }

  const { gridSize, cells: correctCells } = cfg;
  const totalCells = gridSize * gridSize;
  const correctSet = new Set(correctCells);
  const tappedSet = new Set(tappedCells);

  function handleCellTap(idx: number) {
    if (phase !== 'hidden' || disabled || submitted) return;
    const newTapped = tappedSet.has(idx)
      ? tappedCells.filter((c) => c !== idx)
      : [...tappedCells, idx];
    setTappedCells(newTapped);
  }

  function handleSubmitMemory() {
    if (submitted || phase !== 'hidden') return;
    setSubmitted(true);

    const tappedSorted = [...tappedCells].sort((a, b) => a - b);
    const tappedStr = JSON.stringify(tappedSorted);

    // Find which choice matches
    let matchIndex = -1;
    for (let i = 0; i < puzzle.choices.length; i++) {
      try {
        const choiceCells = JSON.parse(puzzle.choices[i]) as number[];
        const choiceSorted = [...choiceCells].sort((a, b) => a - b);
        if (JSON.stringify(choiceSorted) === tappedStr) {
          matchIndex = i;
          break;
        }
      } catch { /* */ }
    }

    if (matchIndex === -1) {
      // No exact match - find closest or pick first non-correct
      const nonCorrect = puzzle.choices.findIndex((_, i) => i !== puzzle.correctIndex);
      matchIndex = nonCorrect >= 0 ? nonCorrect : 0;
    }

    onSelect(matchIndex);
  }

  const gridStyle = {
    width: gridSize === 3 ? 240 : 280,
    height: gridSize === 3 ? 240 : 280,
  };
  const cellSize = gridSize === 3 ? 72 : 60;
  const cellGap = gridSize === 3 ? 8 : 8;

  return (
    <View style={{ alignItems: 'center' }}>
      {phase === 'showing' && (
        <Text style={{ color: colors.accent, fontSize: 14, marginBottom: 10, fontWeight: '600' }}>
          Memorize the highlighted cells!
        </Text>
      )}
      {phase === 'hidden' && !submitted && (
        <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 10 }}>
          Tap the cells you remember, then press Submit.
        </Text>
      )}
      {phase === 'revealed' && (
        <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 10 }}>
          The correct cells are shown in green.
        </Text>
      )}
      <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: cellGap }, gridStyle]}>
        {Array.from({ length: totalCells }, (_, idx) => {
          const isCorrect = correctSet.has(idx);
          const isTapped = tappedSet.has(idx);

          let bg = colors.card;
          let borderColor = colors.border;

          if (phase === 'showing') {
            if (isCorrect) { bg = colors.accent; borderColor = colors.accent; }
          } else if (phase === 'hidden') {
            if (isTapped) { bg = colors.accent + '99'; borderColor = colors.accent; }
          } else {
            // revealed
            if (isCorrect && isTapped) { bg = colors.success; borderColor = colors.success; }
            else if (isCorrect && !isTapped) { bg = colors.success + '55'; borderColor = colors.success; }
            else if (!isCorrect && isTapped) { bg = colors.error + '66'; borderColor = colors.error; }
          }

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleCellTap(idx)}
              activeOpacity={0.7}
              disabled={phase !== 'hidden' || submitted}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: bg,
                borderRadius: 8,
                borderWidth: 2,
                borderColor,
              }}
            />
          );
        })}
      </View>
      {phase === 'hidden' && !submitted && (
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: colors.accent,
            borderRadius: 10,
            paddingVertical: 13,
            paddingHorizontal: 32,
            minHeight: 52,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleSubmitMemory}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

export function GameScreen(): React.ReactElement {
  const navigation = useNavigation<GameNavProp>();
  const route = useRoute<GameRouteProp>();
  const { vaultType, isDaily = false, vaultLevel } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const timerModeRef = useRef<TimerMode>('standard');
  const timerDurationRef = useRef(15);
  const vibrationRef = useRef(false);
  const handlingTimeoutRef = useRef(false);
  const timerBarAnim = useRef(new Animated.Value(1)).current;

  const colors = theme ?? DEFAULT_COLORS;

  // Initialize game
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loadedSettings = await getSettings();
        const loadedTheme = getTheme(loadedSettings.selectedThemeId);
        const timerMode = loadedSettings.timerMode;
        const timerDurationMs = TIMER_DURATIONS[timerMode];
        const timerDurationSec = Math.floor(timerDurationMs / 1000);

        timerModeRef.current = timerMode;
        timerDurationRef.current = timerDurationSec;
        vibrationRef.current = loadedSettings.vibrationEnabled;

        const regularVaultType = vaultLevel ? vaultTypeForLevel(vaultLevel) : vaultType;
        const effectiveVaultType = isDaily ? vaultType : regularVaultType;
        if (!isDaily) {
          const refreshAttempt = refreshPuzzleDataIfNeeded().catch(() => null);
          await Promise.race([
            refreshAttempt,
            new Promise<void>((resolve) => setTimeout(() => resolve(), 2500)),
          ]);
        }

        const puzzles = isDaily
          ? getDailyPuzzles()
          : await generatePuzzlesForVaultAsync(effectiveVaultType, vaultLevel ? vaultSeedForLevel(vaultLevel) : undefined);
        const newSession = createGameSession(effectiveVaultType, puzzles, timerMode, {
          vaultLevel: isDaily ? undefined : vaultLevel,
        });

        if (!active) return;
        setSettings(loadedSettings);
        setTheme(loadedTheme);
        setSession(newSession);
        sessionRef.current = newSession;
        setTimeLeft(timerDurationSec);
        setLoading(false);
        setTimerRunning(true);
      } catch {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer logic
  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerRunning(false);
          if (!handlingTimeoutRef.current) {
            handlingTimeoutRef.current = true;
            handleTimerExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  // Animate timer bar
  useEffect(() => {
    const total = timerDurationRef.current;
    const ratio = total > 0 ? timeLeft / total : 0;
    Animated.timing(timerBarAnim, {
      toValue: ratio,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function stopTimer() {
    setTimerRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function handleTimerExpired() {
    const currentSession = sessionRef.current;
    if (!currentSession || currentSession.isComplete) return;

    const result = handleTimeout(currentSession);
    const updatedSession = result.session;
    sessionRef.current = updatedSession;
    setSession(updatedSession);
    setCorrectChoiceIndex(result.correctIndex);
    setSelectedChoice(-1);
    setFeedbackCorrect(false);
    setShowFeedback(true);

    feedbackTimerRef.current = setTimeout(() => {
      handlingTimeoutRef.current = false;
      handleAdvance(updatedSession);
    }, 1200);
  }

  function handleAnswerPress(choiceIndex: number) {
    if (submitting || showFeedback) return;
    const currentSession = sessionRef.current;
    if (!currentSession || currentSession.isComplete) return;

    setSubmitting(true);
    stopTimer();

    const timerDurationMs = TIMER_DURATIONS[timerModeRef.current];
    const answerTimeMs = (timerDurationRef.current - timeLeft) * 1000;
    const clampedTime = Math.max(0, Math.min(answerTimeMs, timerDurationMs));

    const result = submitAnswer(currentSession, choiceIndex, clampedTime);
    const updatedSession = result.session;
    sessionRef.current = updatedSession;
    setSession(updatedSession);
    setSelectedChoice(choiceIndex);
    setCorrectChoiceIndex(result.correctIndex);
    setFeedbackCorrect(result.correct);
    setShowFeedback(true);

    if (vibrationRef.current) {
      if (result.correct) {
        Vibration.vibrate(50);
      } else {
        Vibration.vibrate([0, 50, 50, 50]);
      }
    }

    feedbackTimerRef.current = setTimeout(() => {
      handleAdvance(updatedSession);
    }, 1200);
  }

  function handleAdvance(currentSession: GameSession) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    const advanced = advancePuzzle(currentSession);
    sessionRef.current = advanced;
    setSession(advanced);

    if (advanced.isComplete) {
      handleGameComplete(advanced);
      return;
    }

    setSelectedChoice(null);
    setShowFeedback(false);
    setFeedbackCorrect(false);
    setSubmitting(false);
    setTimeLeft(timerDurationRef.current);
    handlingTimeoutRef.current = false;
    setTimerRunning(true);
  }

  async function handleGameComplete(completedSession: GameSession) {
    try {
      const attempt = await finishSession(completedSession);
      navigation.replace('Results', { attempt });
    } catch {
      navigation.goBack();
    }
  }

  function handleQuit() {
    stopTimer();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    Alert.alert(
      'Quit Challenge',
      'Your progress will be lost.',
      [
        {
          text: 'Continue',
          onPress: () => {
            setTimerRunning(true);
          },
        },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const styles = makeStyles(colors);

  if (loading || !session) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
          Generating puzzles...
        </Text>
      </SafeAreaView>
    );
  }

  const currentPuzzle: Puzzle | undefined = session.puzzles[session.currentIndex];
  if (!currentPuzzle) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Text style={{ color: colors.error, padding: 20 }}>Puzzle not found.</Text>
      </SafeAreaView>
    );
  }

  const totalPuzzles = session.puzzles.length;
  const currentNum = session.currentIndex + 1;
  const timerRatio = timerDurationRef.current > 0 ? timeLeft / timerDurationRef.current : 0;
  const timerBarColor = timeLeft <= 3 ? colors.error : colors.accent;
  const isMemory = currentPuzzle.type === 'memory';

  const vaultName = session.vaultLevel
    ? `${vaultDisplayName(session.vaultLevel)} - ${vaultTypeLabel(session.vaultType)}`
    : (() => {
      switch (session.vaultType) {
        case 'quick': return 'Quick Vault';
        case 'pattern': return 'Pattern Vault';
        case 'number': return 'Number Vault';
        case 'memory': return 'Memory Vault';
        case 'word': return 'Word Vault';
        case 'world': return 'World Vault';
        case 'daily': return 'Daily Vault';
        default: return 'Vault';
      }
    })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.gameContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.vaultName}>{vaultName}</Text>
            <Text style={styles.puzzleCounter}>
              Puzzle {currentNum} of {totalPuzzles}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{session.score}</Text>
            </View>
            <TouchableOpacity
              style={styles.quitButton}
              onPress={handleQuit}
              activeOpacity={0.8}
            >
              <Text style={styles.quitButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerBarBg}>
          <Animated.View
            style={[
              styles.timerBarFill,
              {
                backgroundColor: timerBarColor,
                width: timerBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, timeLeft <= 3 && { color: colors.error }]}>
            {timeLeft}s
          </Text>
          {session.streak > 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                Streak {session.streak}
              </Text>
            </View>
          )}
        </View>

        {/* Puzzle Prompt */}
        <View style={styles.promptCard}>
          {isMemory ? (
            <Text style={styles.promptText}>Remember the highlighted cells!</Text>
          ) : (
            <Text style={styles.promptText}>{currentPuzzle.prompt}</Text>
          )}
        </View>

        {/* Memory Grid or Choice Buttons */}
        {isMemory ? (
          <View style={styles.memoryContainer}>
            <MemoryPuzzleUI
              puzzle={currentPuzzle}
              onSelect={handleAnswerPress}
              showFeedback={showFeedback}
              correctChoiceIndex={correctChoiceIndex}
              selectedChoice={selectedChoice}
              disabled={submitting || showFeedback}
              colors={colors}
            />
          </View>
        ) : (
          <View style={styles.choicesContainer}>
            {currentPuzzle.choices.map((choice, idx) => {
              let borderColor = colors.border;
              let bgColor = colors.card;
              let textColor = colors.text;

              if (showFeedback) {
                if (idx === correctChoiceIndex) {
                  borderColor = colors.success;
                  bgColor = colors.success + '22';
                  textColor = colors.success;
                } else if (idx === selectedChoice && selectedChoice !== correctChoiceIndex) {
                  borderColor = colors.error;
                  bgColor = colors.error + '22';
                  textColor = colors.error;
                }
              } else if (selectedChoice === idx) {
                borderColor = colors.accent;
                bgColor = colors.accent + '22';
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.choiceButton, { borderColor, backgroundColor: bgColor }]}
                  onPress={() => handleAnswerPress(idx)}
                  activeOpacity={0.8}
                  disabled={showFeedback || submitting}
                >
                  <Text style={[styles.choiceText, { color: textColor }]}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Feedback overlay */}
        {showFeedback && !isMemory && (
          <View style={styles.feedbackRow}>
            <Text style={[
              styles.feedbackText,
              { color: feedbackCorrect ? colors.success : colors.error },
            ]}>
              {feedbackCorrect ? 'Correct!' : 'Incorrect'}
            </Text>
          </View>
        )}
      </View>
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
    gameContent: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
    },
    headerLeft: {
      flex: 1,
    },
    vaultName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    puzzleCounter: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    scoreBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scoreLabel: {
      fontSize: 10,
      color: colors.textMuted,
    },
    scoreValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
    },
    quitButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quitButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    timerBarBg: {
      height: 6,
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 3,
      overflow: 'hidden',
    },
    timerBarFill: {
      height: 6,
      borderRadius: 3,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 6,
      marginBottom: 12,
    },
    timerText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    streakBadge: {
      backgroundColor: colors.accent + '33',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.accent + '66',
    },
    streakText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    promptCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
      justifyContent: 'center',
    },
    promptText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 26,
      textAlign: 'center',
    },
    choicesContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 10,
    },
    choiceButton: {
      borderRadius: 12,
      borderWidth: 2,
      paddingVertical: 15,
      paddingHorizontal: 16,
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    choiceText: {
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    memoryContainer: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    feedbackRow: {
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    feedbackText: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
  });
}
