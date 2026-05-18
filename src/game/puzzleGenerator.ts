import type { Puzzle, PuzzleType, VaultType } from '../types';
import {
  BUNDLED_WORD_ANALOGIES,
  BUNDLED_WORD_ASSOCIATIONS,
  BUNDLED_SYNONYMS,
  BUNDLED_ANTONYMS,
} from '../data/bundledWords';
import { BUNDLED_COUNTRIES } from '../data/bundledWorldData';
import { generateId } from '../utils/validation';

// ─────────────────────────────────────────────────────────────────────────────
// Seeded random number generator (LCG)
// ─────────────────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic array helpers (accept a RNG function)
// ─────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  return shuffle(arr, rng).slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deduplication helper
// ─────────────────────────────────────────────────────────────────────────────

function dedupeChoices(choices: string[], fallbacks: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of choices) {
    if (!seen.has(c) && c !== '') {
      seen.add(c);
      result.push(c);
    }
  }
  let fi = 0;
  while (result.length < 4 && fi < fallbacks.length) {
    const fb = fallbacks[fi++];
    if (!seen.has(fb) && fb !== '') {
      seen.add(fb);
      result.push(fb);
    }
  }
  return result.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern puzzles
// ─────────────────────────────────────────────────────────────────────────────

interface PatternTemplate {
  sequence: string[];
  answer: string;
  distractors: string[];
}

function buildPatternTemplates(rng: () => number): PatternTemplate[] {
  const templates: PatternTemplate[] = [];

  // Arithmetic sequences (a, a+d, a+2d, ?)
  for (let i = 0; i < 4; i++) {
    const a = randInt(1, 15, rng);
    const d = randInt(2, 8, rng);
    const seq = [a, a + d, a + 2 * d];
    const ans = a + 3 * d;
    templates.push({
      sequence: seq.map(String),
      answer: String(ans),
      distractors: [String(ans + d), String(ans - 1), String(ans + 1)],
    });
  }

  // Geometric sequences (a, a*r, a*r^2, ?)
  for (let i = 0; i < 3; i++) {
    const a = randInt(2, 4, rng);
    const r = randInt(2, 3, rng);
    const seq = [a, a * r, a * r * r];
    const ans = a * r * r * r;
    templates.push({
      sequence: seq.map(String),
      answer: String(ans),
      distractors: [String(ans + r), String(ans - 1), String(ans * 2)],
    });
  }

  // Perfect squares
  const sq0 = randInt(1, 5, rng);
  templates.push({
    sequence: [sq0 * sq0, (sq0 + 1) ** 2, (sq0 + 2) ** 2].map(String),
    answer: String((sq0 + 3) ** 2),
    distractors: [String((sq0 + 3) ** 2 + 1), String((sq0 + 3) ** 2 - 1), String((sq0 + 4) ** 2)],
  });

  // Color patterns
  const colorSeqs: PatternTemplate[] = [
    {
      sequence: ['Red', 'Blue', 'Red', 'Blue'],
      answer: 'Red',
      distractors: ['Green', 'Yellow', 'Purple'],
    },
    {
      sequence: ['Green', 'Green', 'Red', 'Green', 'Green'],
      answer: 'Red',
      distractors: ['Blue', 'Yellow', 'Green'],
    },
    {
      sequence: ['Yellow', 'Orange', 'Yellow', 'Orange'],
      answer: 'Yellow',
      distractors: ['Red', 'Blue', 'Green'],
    },
  ];
  templates.push(...colorSeqs);

  // Shape patterns
  const shapeSeqs: PatternTemplate[] = [
    {
      sequence: ['Circle', 'Square', 'Triangle', 'Circle', 'Square'],
      answer: 'Triangle',
      distractors: ['Circle', 'Square', 'Diamond'],
    },
    {
      sequence: ['Triangle', 'Triangle', 'Square', 'Triangle', 'Triangle'],
      answer: 'Square',
      distractors: ['Circle', 'Diamond', 'Triangle'],
    },
  ];
  templates.push(...shapeSeqs);

  // Fibonacci-style (a, b, a+b, a+2b, ?)
  for (let i = 0; i < 2; i++) {
    const a = randInt(1, 5, rng);
    const b = randInt(2, 6, rng);
    const c = a + b;
    const d2 = a + 2 * b;
    const ans = a + 3 * b;
    templates.push({
      sequence: [a, b, c, d2].map(String),
      answer: String(ans),
      distractors: [String(ans + b), String(ans - 1), String(ans + 1)],
    });
  }

  // Doubling sequence
  const db0 = randInt(1, 4, rng);
  templates.push({
    sequence: [db0, db0 * 2, db0 * 4, db0 * 8].map(String),
    answer: String(db0 * 16),
    distractors: [String(db0 * 14), String(db0 * 18), String(db0 * 12)],
  });

  return templates;
}

function generatePatternPuzzles(count: number, rng: () => number): Puzzle[] {
  const templates = buildPatternTemplates(rng);
  const chosen = pickN(templates, count, rng);
  return chosen.map((t) => {
    const correct = t.answer;
    const allChoices = [correct, ...t.distractors.slice(0, 3)];
    const shuffled = shuffle(allChoices, rng);
    const correctIndex = shuffled.indexOf(correct);
    const sequenceStr = t.sequence.join(', ');
    return {
      id: generateId(),
      type: 'pattern' as PuzzleType,
      prompt: `What comes next?\n${sequenceStr}, ?`,
      choices: shuffled,
      correctIndex,
      explanation: `The pattern continues: ${sequenceStr}, ${correct}`,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Number sequence puzzles
// ─────────────────────────────────────────────────────────────────────────────

interface NumberTemplate {
  sequence: number[];
  answer: number;
  explanation: string;
}

function buildNumberTemplates(rng: () => number): NumberTemplate[] {
  const templates: NumberTemplate[] = [];

  // Arithmetic
  for (let i = 0; i < 4; i++) {
    const a = randInt(1, 20, rng);
    const d = randInt(1, 10, rng);
    templates.push({
      sequence: [a, a + d, a + 2 * d, a + 3 * d],
      answer: a + 4 * d,
      explanation: `Arithmetic sequence with starting value ${a} and common difference ${d}`,
    });
  }

  // Geometric
  for (let i = 0; i < 3; i++) {
    const a = randInt(2, 5, rng);
    const r = randInt(2, 3, rng);
    templates.push({
      sequence: [a, a * r, a * r ** 2],
      answer: a * r ** 3,
      explanation: `Geometric sequence (multiply by ${r} each time)`,
    });
  }

  // Alternating interleaved sequences
  for (let i = 0; i < 3; i++) {
    const a = randInt(2, 10, rng);
    const b = randInt(10, 20, rng);
    const inc = randInt(2, 5, rng);
    // a, b, a+inc, b+inc, a+2inc, ?  → b+2inc
    templates.push({
      sequence: [a, b, a + inc, b + inc, a + 2 * inc],
      answer: b + 2 * inc,
      explanation: `Two interleaved sequences alternating: ${a},${a + inc},${a + 2 * inc}... and ${b},${b + inc},${b + 2 * inc}...`,
    });
  }

  // Perfect squares
  for (let i = 0; i < 2; i++) {
    const start = randInt(1, 6, rng);
    const seq = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
    templates.push({
      sequence: seq,
      answer: (start + 4) ** 2,
      explanation: `Perfect squares: ${start}², ${start + 1}², ${start + 2}², ${start + 3}², ${start + 4}²`,
    });
  }

  // Fibonacci-style (a, b, a+b, a+2b, ?)
  for (let i = 0; i < 2; i++) {
    const a = randInt(1, 5, rng);
    const b = randInt(2, 7, rng);
    templates.push({
      sequence: [a, b, a + b, a + 2 * b],
      answer: a + 3 * b,
      explanation: `Each term adds ${b} to the previous term`,
    });
  }

  return templates;
}

function generateNumberPuzzles(count: number, rng: () => number): Puzzle[] {
  const templates = buildNumberTemplates(rng);
  const chosen = pickN(templates, count, rng);
  return chosen.map((t) => {
    const correct = t.answer;
    // Generate plausible distractors near the correct answer
    const offsets = shuffle([1, -1, 2, -2, 3, 5, -5, 10, -10], rng);
    const distractors: number[] = [];
    for (const off of offsets) {
      const d = correct + off;
      if (d >= 0 && d !== correct && !distractors.includes(d)) {
        distractors.push(d);
      }
      if (distractors.length >= 3) break;
    }
    // Fallback distractors
    while (distractors.length < 3) {
      const d = correct + distractors.length + 1;
      if (!distractors.includes(d)) distractors.push(d);
    }

    const allChoices = [String(correct), ...distractors.slice(0, 3).map(String)];
    const shuffled = shuffle(allChoices, rng);
    const correctIndex = shuffled.indexOf(String(correct));
    const seqStr = t.sequence.join(', ');

    return {
      id: generateId(),
      type: 'number' as PuzzleType,
      prompt: `What is the missing number?\n${seqStr}, ?`,
      choices: shuffled,
      correctIndex,
      explanation: t.explanation,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory puzzles
// ─────────────────────────────────────────────────────────────────────────────

function generateMemoryPuzzles(count: number, rng: () => number): Puzzle[] {
  const puzzles: Puzzle[] = [];
  const configs: Array<{ gridSize: 3 | 4; cellCount: number; showMs: number }> = [
    { gridSize: 3, cellCount: 2, showMs: 1500 },
    { gridSize: 3, cellCount: 3, showMs: 1500 },
    { gridSize: 3, cellCount: 3, showMs: 1200 },
    { gridSize: 3, cellCount: 4, showMs: 1000 },
    { gridSize: 4, cellCount: 3, showMs: 1500 },
    { gridSize: 4, cellCount: 4, showMs: 1200 },
    { gridSize: 4, cellCount: 4, showMs: 1000 },
    { gridSize: 4, cellCount: 5, showMs: 1000 },
  ];

  const used = pickN(configs, count, rng);
  for (const cfg of used) {
    const totalCells = cfg.gridSize * cfg.gridSize;
    const allIndices = Array.from({ length: totalCells }, (_, i) => i);
    const correctCells = pickN(allIndices, cfg.cellCount, rng).sort((a, b) => a - b);
    const correctStr = JSON.stringify(correctCells);

    // Generate 3 wrong answers: permute different sets of cells
    const wrongSets: string[] = [];
    let attempts = 0;
    while (wrongSets.length < 3 && attempts < 40) {
      attempts++;
      const candidates = shuffle([...allIndices], rng).slice(0, cfg.cellCount).sort((a, b) => a - b);
      const s = JSON.stringify(candidates);
      if (s !== correctStr && !wrongSets.includes(s)) {
        wrongSets.push(s);
      }
    }
    while (wrongSets.length < 3) {
      // Last-resort: offset correct cells
      const fallback = correctCells.map((c) => (c + wrongSets.length + 1) % totalCells).sort((a, b) => a - b);
      const s = JSON.stringify(fallback);
      if (s !== correctStr && !wrongSets.includes(s)) wrongSets.push(s);
      else wrongSets.push(JSON.stringify([0, 1, 2].slice(0, cfg.cellCount)));
    }

    const allChoices = [correctStr, ...wrongSets.slice(0, 3)];
    const shuffled = shuffle(allChoices, rng);
    const correctIndex = shuffled.indexOf(correctStr);

    const config = {
      gridSize: cfg.gridSize,
      cells: correctCells,
      showMs: cfg.showMs,
    };

    puzzles.push({
      id: generateId(),
      type: 'memory' as PuzzleType,
      prompt: `MEMORY_CONFIG:${JSON.stringify(config)}\nRemember the highlighted cells!`,
      choices: shuffled,
      correctIndex,
      explanation: `The highlighted cells were at positions: ${correctCells.join(', ')}`,
    });
  }

  return puzzles;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logic puzzles
// ─────────────────────────────────────────────────────────────────────────────

interface LogicTemplate {
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

const LOGIC_TEMPLATES: LogicTemplate[] = [
  {
    prompt: 'Alex is taller than Bob. Bob is taller than Carol. Who is the tallest?',
    choices: ['Alex', 'Bob', 'Carol', 'Cannot tell'],
    correctIndex: 0,
    explanation: 'Alex > Bob > Carol, so Alex is the tallest.',
  },
  {
    prompt: 'All birds can fly. A penguin is a bird. According to this logic, can a penguin fly?',
    choices: ['Yes', 'No', 'Maybe', 'Not enough info'],
    correctIndex: 0,
    explanation: 'If all birds can fly and a penguin is a bird, then according to this logic a penguin can fly (even though it is not true in reality).',
  },
  {
    prompt: 'If it rains, the ground gets wet. The ground is wet. Is it definitely raining?',
    choices: ['Not necessarily', 'Yes, definitely', 'No, never', 'Only sometimes'],
    correctIndex: 0,
    explanation: 'The ground could be wet for other reasons (e.g., a sprinkler). This is the fallacy of affirming the consequent.',
  },
  {
    prompt: 'All mammals are warm-blooded. A whale is a mammal. Is a whale warm-blooded?',
    choices: ['Yes', 'No', 'Maybe', 'Only in warm water'],
    correctIndex: 0,
    explanation: 'All mammals are warm-blooded, and a whale is a mammal, so a whale is warm-blooded.',
  },
  {
    prompt: 'Tom is older than Sam. Sam is older than Kim. Who is the youngest?',
    choices: ['Kim', 'Sam', 'Tom', 'Cannot tell'],
    correctIndex: 0,
    explanation: 'Tom > Sam > Kim, so Kim is the youngest.',
  },
  {
    prompt: 'If you study hard, you pass the exam. Mia did not study hard. Did Mia fail the exam?',
    choices: ['Not necessarily', 'Yes, definitely', 'No', 'Cannot tell'],
    correctIndex: 0,
    explanation: 'Not studying hard does not necessarily mean failing; there may be other ways to pass. This is denying the antecedent.',
  },
  {
    prompt: 'No reptiles are mammals. A lizard is a reptile. Is a lizard a mammal?',
    choices: ['No', 'Yes', 'Maybe', 'Sometimes'],
    correctIndex: 0,
    explanation: 'Since no reptiles are mammals and a lizard is a reptile, a lizard is not a mammal.',
  },
  {
    prompt: 'Red is heavier than Blue. Blue is heavier than Green. Which is the lightest?',
    choices: ['Green', 'Blue', 'Red', 'Cannot tell'],
    correctIndex: 0,
    explanation: 'Red > Blue > Green, so Green is the lightest.',
  },
  {
    prompt: 'All squares are rectangles. Shape X is a square. Is Shape X a rectangle?',
    choices: ['Yes', 'No', 'Maybe', 'Only if it has equal sides'],
    correctIndex: 0,
    explanation: 'All squares are rectangles by definition, so Shape X is a rectangle.',
  },
  {
    prompt: 'Some cats are black. Whiskers is a cat. Is Whiskers necessarily black?',
    choices: ['Not necessarily', 'Yes', 'No, never', 'Only at night'],
    correctIndex: 0,
    explanation: '"Some cats are black" does not mean all cats are black, so Whiskers may or may not be black.',
  },
  {
    prompt: 'Every student in Class A passed. Zara is in Class A. Did Zara pass?',
    choices: ['Yes', 'No', 'Maybe', 'Not enough info'],
    correctIndex: 0,
    explanation: 'Every student in Class A passed, and Zara is in Class A, so Zara passed.',
  },
  {
    prompt: 'A is faster than B. C is slower than B. Who is the fastest?',
    choices: ['A', 'B', 'C', 'Cannot tell'],
    correctIndex: 0,
    explanation: 'A > B > C, so A is the fastest.',
  },
];

function generateLogicPuzzles(count: number, rng: () => number): Puzzle[] {
  const chosen = pickN(LOGIC_TEMPLATES, count, rng);
  return chosen.map((t) => {
    const shuffled = shuffle([...t.choices], rng);
    const correct = t.choices[t.correctIndex];
    const correctIndex = shuffled.indexOf(correct);
    return {
      id: generateId(),
      type: 'logic' as PuzzleType,
      prompt: t.prompt,
      choices: shuffled,
      correctIndex,
      explanation: t.explanation,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Word puzzles
// ─────────────────────────────────────────────────────────────────────────────

type WordPuzzleSubtype = 'analogy' | 'association' | 'synonym' | 'antonym';

function generateWordPuzzles(count: number, rng: () => number): Puzzle[] {
  const subtypes: WordPuzzleSubtype[] = ['analogy', 'association', 'synonym', 'antonym'];
  const puzzles: Puzzle[] = [];

  const analogies = shuffle([...BUNDLED_WORD_ANALOGIES], rng);
  const associations = shuffle([...BUNDLED_WORD_ASSOCIATIONS], rng);
  const synonyms = shuffle([...BUNDLED_SYNONYMS], rng);
  const antonyms = shuffle([...BUNDLED_ANTONYMS], rng);

  let ai = 0, si_assoc = 0, si_syn = 0, anI = 0;

  for (let i = 0; i < count; i++) {
    const subtype = subtypes[i % subtypes.length];

    if (subtype === 'analogy' && ai < analogies.length) {
      const item = analogies[ai++];
      const shuffled = shuffle([...item.choices], rng);
      const correct = item.choices[item.correctIndex];
      const correctIndex = shuffled.indexOf(correct);
      puzzles.push({
        id: generateId(),
        type: 'word' as PuzzleType,
        prompt: item.prompt,
        choices: shuffled,
        correctIndex,
        explanation: `The answer is "${correct}"`,
      });
    } else if (subtype === 'association' && si_assoc < associations.length) {
      const item = associations[si_assoc++];
      // Format: "Which of these does NOT belong with: Apple, Banana, Cherry?"
      const allChoices = shuffle([...item.related, item.oddOne], rng);
      const correctIndex = allChoices.indexOf(item.oddOne);
      puzzles.push({
        id: generateId(),
        type: 'word' as PuzzleType,
        prompt: `Which does NOT belong with the others?\nCategory: ${item.word}`,
        choices: allChoices,
        correctIndex,
        explanation: `"${item.oddOne}" does not belong in the ${item.word} category.`,
      });
    } else if (subtype === 'synonym' && si_syn < synonyms.length) {
      const item = synonyms[si_syn++];
      const shuffled = shuffle([...item.choices], rng);
      const correct = item.choices[item.correctIndex];
      const correctIndex = shuffled.indexOf(correct);
      puzzles.push({
        id: generateId(),
        type: 'word' as PuzzleType,
        prompt: `Which word is closest in meaning to "${item.word}"?`,
        choices: shuffled,
        correctIndex,
        explanation: `"${correct}" is a synonym of "${item.word}"`,
      });
    } else if (anI < antonyms.length) {
      const item = antonyms[anI++];
      const shuffled = shuffle([...item.choices], rng);
      const correct = item.choices[item.correctIndex];
      const correctIndex = shuffled.indexOf(correct);
      puzzles.push({
        id: generateId(),
        type: 'word' as PuzzleType,
        prompt: `Which word is the opposite of "${item.word}"?`,
        choices: shuffled,
        correctIndex,
        explanation: `"${correct}" is the opposite (antonym) of "${item.word}"`,
      });
    }
  }

  return puzzles.slice(0, count);
}

// ─────────────────────────────────────────────────────────────────────────────
// World puzzles
// ─────────────────────────────────────────────────────────────────────────────

type WorldPuzzleSubtype = 'capital' | 'region' | 'population' | 'flag';

function generateWorldPuzzles(count: number, rng: () => number): Puzzle[] {
  const countries = shuffle([...BUNDLED_COUNTRIES], rng);
  const subtypes: WorldPuzzleSubtype[] = ['capital', 'region', 'population', 'flag'];
  const puzzles: Puzzle[] = [];
  let ci = 0;

  for (let i = 0; i < count; i++) {
    const subtype = subtypes[i % subtypes.length];

    if (subtype === 'capital') {
      // Pick 4 distinct countries for choices
      const group = pickN(countries, 4, rng);
      if (group.length < 4) continue;
      const target = group[0];
      const capitals = group.map((c) => c.capital);
      const shuffled = shuffle(capitals, rng);
      const correctIndex = shuffled.indexOf(target.capital);
      puzzles.push({
        id: generateId(),
        type: 'world' as PuzzleType,
        prompt: `What is the capital of ${target.name}?`,
        choices: shuffled,
        correctIndex,
        explanation: `The capital of ${target.name} is ${target.capital}.`,
      });
    } else if (subtype === 'region') {
      const target = countries[ci % countries.length];
      ci++;
      // Build 4 distinct region options
      const allRegions = [...new Set(BUNDLED_COUNTRIES.map((c) => c.region))];
      const correctRegion = target.region;
      const wrongRegions = shuffle(allRegions.filter((r) => r !== correctRegion), rng).slice(0, 3);
      if (wrongRegions.length < 3) continue;
      const choices = shuffle([correctRegion, ...wrongRegions], rng);
      const correctIndex = choices.indexOf(correctRegion);
      puzzles.push({
        id: generateId(),
        type: 'world' as PuzzleType,
        prompt: `Which region is ${target.name} in?`,
        choices,
        correctIndex,
        explanation: `${target.name} is located in ${correctRegion}.`,
      });
    } else if (subtype === 'population') {
      // Pick 4 countries, ask which has the largest population
      const group = pickN(countries, 4, rng);
      if (group.length < 4) continue;
      const largest = group.reduce((prev, c) => (c.population > prev.population ? c : prev));
      const names = group.map((c) => c.name);
      const shuffled = shuffle(names, rng);
      const correctIndex = shuffled.indexOf(largest.name);
      puzzles.push({
        id: generateId(),
        type: 'world' as PuzzleType,
        prompt: `Which of these countries has the largest population?`,
        choices: shuffled,
        correctIndex,
        explanation: `${largest.name} has the largest population (~${(largest.population / 1000000).toFixed(0)}M) among the options.`,
      });
    } else {
      // flag
      const group = pickN(countries, 4, rng);
      if (group.length < 4) continue;
      const target = group[0];
      const names = group.map((c) => c.name);
      const shuffled = shuffle(names, rng);
      const correctIndex = shuffled.indexOf(target.name);
      puzzles.push({
        id: generateId(),
        type: 'world' as PuzzleType,
        prompt: `Which country does this flag belong to?\n${target.flagEmoji}`,
        choices: shuffled,
        correctIndex,
        explanation: `${target.flagEmoji} is the flag of ${target.name}.`,
      });
    }
  }

  return puzzles.slice(0, count);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function generatePuzzlesForVault(vaultType: VaultType, seed?: number): Puzzle[] {
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;

  switch (vaultType) {
    case 'pattern':
      return generatePatternPuzzles(10, rng);

    case 'number':
      return generateNumberPuzzles(10, rng);

    case 'memory':
      return generateMemoryPuzzles(8, rng);

    case 'word':
      return generateWordPuzzles(10, rng);

    case 'world':
      return generateWorldPuzzles(10, rng);

    case 'quick': {
      // Mixed: 2 pattern + 2 number + 2 memory + 2 word + 2 world
      const pattern = generatePatternPuzzles(2, rng);
      const number = generateNumberPuzzles(2, rng);
      const memory = generateMemoryPuzzles(2, rng);
      const word = generateWordPuzzles(2, rng);
      const world = generateWorldPuzzles(2, rng);
      const all = [...pattern, ...number, ...memory, ...word, ...world];
      return shuffle(all, rng);
    }

    case 'daily': {
      // 12 puzzles, deterministic from seed
      const s = seed ?? Date.now();
      const rng2 = seededRandom(s);
      const pattern = generatePatternPuzzles(2, rng2);
      const number = generateNumberPuzzles(2, rng2);
      const memory = generateMemoryPuzzles(2, rng2);
      const logic = generateLogicPuzzles(2, rng2);
      const word = generateWordPuzzles(2, rng2);
      const world = generateWorldPuzzles(2, rng2);
      const all = [...pattern, ...number, ...memory, ...logic, ...word, ...world];
      return shuffle(all, rng2);
    }

    default:
      return generatePatternPuzzles(10, rng);
  }
}
