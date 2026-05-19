// Refreshes word and world data from public APIs. Gameplay falls back to
// bundled data when the network is unavailable.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUNDLED_COUNTRIES } from '../data/bundledWorldData';
import {
  BUNDLED_WORD_ASSOCIATIONS,
  BUNDLED_SYNONYMS,
  BUNDLED_ANTONYMS,
} from '../data/bundledWords';
import type {
  CachedTriviaData,
  CachedWordData,
  CachedWorldData,
  Country,
  EconomicIndicator,
  TriviaQuestion,
  WordDefinition,
  WordRelationship,
} from '../types';

const DATAMUSE_BASE = 'https://api.datamuse.com';
const RESTCOUNTRIES_BASE = 'https://restcountries.com/v3.1';
const DICTIONARY_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const OPEN_TRIVIA_BASE = 'https://opentdb.com';
const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';
const FETCH_TIMEOUT_MS = 8000;

const CACHE_KEY_WORDS = 'mindvault:cache:words';
const CACHE_KEY_WORLD = 'mindvault:cache:world';
const CACHE_KEY_TRIVIA = 'mindvault:cache:trivia';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const SEED_WORDS = [
  'bright', 'fast', 'strong', 'happy', 'cold',
  'ancient', 'quiet', 'brave', 'sharp', 'gentle',
  'calm', 'clever', 'simple', 'difficult', 'build',
  'repair', 'open', 'close', 'large', 'small',
  'fresh', 'silent', 'strange', 'choose', 'begin',
  'finish', 'clean', 'rough', 'smooth', 'rich',
  'poor', 'early', 'late', 'safe', 'danger',
  'create', 'destroy', 'light', 'dark', 'quick',
];

const WORLD_BANK_COUNTRY_CODES = [
  'US', 'CN', 'IN', 'BR', 'DE',
  'JP', 'GB', 'FR', 'NG', 'MX',
  'CA', 'AU', 'ZA', 'KR', 'ID',
  'TR', 'SA', 'ES', 'IT', 'AR',
];

const WORLD_BANK_INDICATORS = [
  { code: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)' },
  { code: 'NY.GDP.PCAP.CD', name: 'GDP per capita (current US$)' },
  { code: 'SP.POP.TOTL', name: 'Population' },
  { code: 'IT.NET.USER.ZS', name: 'Individuals using the Internet (%)' },
  { code: 'EN.ATM.CO2E.PC', name: 'CO2 emissions per person' },
];

type RefreshResult = { success: boolean; message: string };
type PuzzleDataRefreshResult = {
  word: RefreshResult;
  world: RefreshResult;
  trivia: RefreshResult;
};

let refreshInFlight: Promise<PuzzleDataRefreshResult> | null = null;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function sanitizeWords(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const wordObj = item as Record<string, unknown>;
    const word = typeof wordObj.word === 'string' ? wordObj.word.trim().toLowerCase() : '';
    if (!word || !/^[a-z]+$/.test(word) || seen.has(word)) continue;
    seen.add(word);
    result.push(word);
  }
  return result;
}

function sanitizePlainWord(value: unknown): string {
  if (typeof value !== 'string') return '';
  const word = value.trim().toLowerCase();
  return /^[a-z]+(?:-[a-z]+)?$/.test(word) ? word : '';
}

function decodeApiText(value: unknown): string {
  if (typeof value !== 'string') return '';
  let text = value;
  try {
    text = decodeURIComponent(text);
  } catch {
    // Open Trivia can be configured with URL encoding, but keep raw text if decoding fails.
  }
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeDefinition(value: unknown, word: string): string {
  const definition = decodeApiText(value);
  if (definition.length < 24 || definition.length > 180) return '';
  if (definition.toLowerCase().includes(word.toLowerCase())) return '';
  return definition;
}

function isFresh(refreshedAt: string | undefined): boolean {
  if (!refreshedAt) return false;
  const time = new Date(refreshedAt).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time < CACHE_MAX_AGE_MS;
}

async function readCachedWordData(): Promise<CachedWordData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_WORDS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWordData;
    if (!parsed || !Array.isArray(parsed.words) || !Array.isArray(parsed.relationships)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readCachedWorldData(): Promise<CachedWorldData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_WORLD);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWorldData;
    if (!parsed || !Array.isArray(parsed.countries)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readCachedTriviaData(): Promise<CachedTriviaData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_TRIVIA);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTriviaData;
    if (!parsed || !Array.isArray(parsed.questions)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function fetchDictionaryDefinitions(words: string[]): Promise<WordDefinition[]> {
  const uniqueWords = [...new Set(words.map(sanitizePlainWord).filter(Boolean))].slice(0, 24);
  const results = await Promise.all(
    uniqueWords.map(async (word) => {
      try {
        const url = `${DICTIONARY_BASE}/${encodeURIComponent(word)}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json)) return [];

        const definitions: WordDefinition[] = [];
        for (const entry of json) {
          if (typeof entry !== 'object' || entry === null) continue;
          const meanings = Array.isArray((entry as Record<string, unknown>).meanings)
            ? ((entry as Record<string, unknown>).meanings as unknown[])
            : [];

          for (const meaning of meanings) {
            if (definitions.length >= 2) break;
            if (typeof meaning !== 'object' || meaning === null) continue;
            const m = meaning as Record<string, unknown>;
            const partOfSpeech = typeof m.partOfSpeech === 'string' ? m.partOfSpeech : undefined;
            const meaningSynonyms = Array.isArray(m.synonyms) ? m.synonyms.map(sanitizePlainWord).filter(Boolean) : [];
            const meaningAntonyms = Array.isArray(m.antonyms) ? m.antonyms.map(sanitizePlainWord).filter(Boolean) : [];
            const definitionEntries = Array.isArray(m.definitions) ? m.definitions : [];

            for (const definitionEntry of definitionEntries) {
              if (definitions.length >= 2) break;
              if (typeof definitionEntry !== 'object' || definitionEntry === null) continue;
              const d = definitionEntry as Record<string, unknown>;
              const definition = sanitizeDefinition(d.definition, word);
              if (!definition) continue;
              const definitionSynonyms = Array.isArray(d.synonyms) ? d.synonyms.map(sanitizePlainWord).filter(Boolean) : [];
              const definitionAntonyms = Array.isArray(d.antonyms) ? d.antonyms.map(sanitizePlainWord).filter(Boolean) : [];

              definitions.push({
                word,
                definition,
                partOfSpeech,
                synonyms: [...new Set([...meaningSynonyms, ...definitionSynonyms])].slice(0, 8),
                antonyms: [...new Set([...meaningAntonyms, ...definitionAntonyms])].slice(0, 8),
              });
            }
          }
        }
        return definitions;
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<string>();
  const definitions: WordDefinition[] = [];
  for (const item of results.flat()) {
    const key = `${item.word}:${item.definition}`;
    if (seen.has(key)) continue;
    seen.add(key);
    definitions.push(item);
  }
  return definitions;
}

export async function refreshWordData(): Promise<RefreshResult> {
  try {
    const wordSet = new Set<string>();
    const relationships: WordRelationship[] = [];
    const requests = SEED_WORDS.flatMap((seed) => [
      { seed, rel: 'rel_syn', type: 'synonym' as const },
      { seed, rel: 'rel_ant', type: 'antonym' as const },
    ]);

    const results = await Promise.all(
      requests.map(async ({ seed, rel, type }) => {
        try {
          const url = `${DATAMUSE_BASE}/words?${rel}=${encodeURIComponent(seed)}&max=12`;
          const res = await fetchWithTimeout(url);
          if (!res.ok) return null;
          const json = await res.json();
          if (!Array.isArray(json)) return null;
          const words = sanitizeWords(json);
          if (words.length === 0) return null;
          return { seed: seed.toLowerCase(), type, words };
        } catch {
          return null;
        }
      }),
    );

    for (const result of results) {
      if (!result) continue;
      wordSet.add(result.seed);
      for (const word of result.words) {
        wordSet.add(word);
      }
      relationships.push({
        word: result.seed,
        related: result.words,
        type: result.type,
      });
    }

    const definitionSeedWords = [
      ...SEED_WORDS.slice(0, 18),
      ...[...wordSet].slice(0, 12),
    ];
    const definitions = await fetchDictionaryDefinitions(definitionSeedWords);

    for (const definition of definitions) {
      wordSet.add(definition.word);
      for (const synonym of definition.synonyms) {
        wordSet.add(synonym);
      }
      for (const antonym of definition.antonyms) {
        wordSet.add(antonym);
      }
      if (definition.synonyms.length > 0) {
        relationships.push({
          word: definition.word,
          related: definition.synonyms,
          type: 'synonym',
        });
      }
      if (definition.antonyms.length > 0) {
        relationships.push({
          word: definition.word,
          related: definition.antonyms,
          type: 'antonym',
        });
      }
    }

    const allWords = [...wordSet];
    if (allWords.length < 20 || (relationships.length < 8 && definitions.length < 8)) {
      return { success: false, message: 'Insufficient word data received from word APIs.' };
    }

    const data: CachedWordData = {
      source: definitions.length > 0 ? 'mixed-word' : 'datamuse',
      refreshedAt: new Date().toISOString(),
      words: allWords,
      relationships,
      definitions,
    };

    await AsyncStorage.setItem(CACHE_KEY_WORDS, JSON.stringify(data));
    return {
      success: true,
      message: `Word data refreshed (${relationships.length} relationships, ${definitions.length} definitions).`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `Word refresh failed: ${msg}` };
  }
}

async function fetchWorldBankIndicators(): Promise<EconomicIndicator[]> {
  const countryParam = WORLD_BANK_COUNTRY_CODES.join(';');
  const results = await Promise.all(
    WORLD_BANK_INDICATORS.map(async (indicator) => {
      try {
        const url =
          `${WORLD_BANK_BASE}/country/${countryParam}/indicator/${indicator.code}` +
          '?format=json&per_page=200&MRV=1';
        const res = await fetchWithTimeout(url);
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json) || !Array.isArray(json[1])) return [];

        const rows: EconomicIndicator[] = [];
        for (const item of json[1]) {
          if (typeof item !== 'object' || item === null) continue;
          const entry = item as Record<string, unknown>;
          const value = typeof entry.value === 'number' ? entry.value : NaN;
          if (!Number.isFinite(value) || value <= 0) continue;

          const country = entry.country as Record<string, unknown> | undefined;
          const countryCode = typeof country?.id === 'string' ? country.id : '';
          const countryName = typeof country?.value === 'string' ? country.value : '';
          const year = typeof entry.date === 'string' ? entry.date : '';
          const unit = typeof entry.unit === 'string' ? entry.unit : undefined;

          if (!countryCode || !countryName || !year) continue;
          rows.push({
            countryName,
            countryCode,
            indicatorCode: indicator.code,
            indicatorName: indicator.name,
            year,
            value,
            unit,
          });
        }
        return rows;
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<string>();
  const indicators: EconomicIndicator[] = [];
  for (const row of results.flat()) {
    const key = `${row.countryCode}:${row.indicatorCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    indicators.push(row);
  }
  return indicators;
}

export async function refreshWorldData(): Promise<RefreshResult> {
  try {
    const url = `${RESTCOUNTRIES_BASE}/all?fields=name,cca2,capital,region,population,flag`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return { success: false, message: `REST Countries returned status ${res.status}.` };
    }

    const json = await res.json();
    if (!Array.isArray(json)) {
      return { success: false, message: 'Unexpected response format from REST Countries.' };
    }

    const seen = new Set<string>();
    const countries: Country[] = [];

    for (const entry of json) {
      try {
        if (typeof entry !== 'object' || entry === null) continue;
        const e = entry as Record<string, unknown>;
        const nameObj = e.name as Record<string, unknown> | undefined;
        const name = typeof nameObj?.common === 'string' ? nameObj.common.trim() : '';
        const countryCode = typeof e.cca2 === 'string' ? e.cca2.trim().toUpperCase() : undefined;
        const capitalArr = Array.isArray(e.capital) ? e.capital : [];
        const capital = typeof capitalArr[0] === 'string' ? capitalArr[0].trim() : '';
        const region = typeof e.region === 'string' ? e.region.trim() : '';
        const population = typeof e.population === 'number' ? e.population : 0;
        const flagEmoji = typeof e.flag === 'string' ? e.flag : '';

        if (!name || !capital || !region || !population || seen.has(name)) continue;
        seen.add(name);
        countries.push({ name, countryCode, capital, region, population, flagEmoji });
      } catch {
        // Skip malformed entries.
      }
    }

    if (countries.length < 30) {
      return { success: false, message: `Only ${countries.length} valid countries received; need at least 30.` };
    }

    const economicIndicators = await fetchWorldBankIndicators();

    const data: CachedWorldData = {
      source: economicIndicators.length > 0 ? 'mixed-world' : 'restcountries',
      refreshedAt: new Date().toISOString(),
      countries,
      economicIndicators,
    };

    await AsyncStorage.setItem(CACHE_KEY_WORLD, JSON.stringify(data));
    return {
      success: true,
      message: `World data refreshed (${countries.length} countries, ${economicIndicators.length} indicators).`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `World refresh failed: ${msg}` };
  }
}

export async function refreshTriviaData(): Promise<RefreshResult> {
  try {
    const url = `${OPEN_TRIVIA_BASE}/api.php?amount=50&type=multiple&encode=url3986`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return { success: false, message: `Open Trivia DB returned status ${res.status}.` };
    }

    const json = await res.json();
    if (!json || typeof json !== 'object') {
      return { success: false, message: 'Unexpected response format from Open Trivia DB.' };
    }

    const payload = json as Record<string, unknown>;
    if (payload.response_code !== 0 || !Array.isArray(payload.results)) {
      return { success: false, message: `Open Trivia DB response code ${String(payload.response_code)}.` };
    }

    const questions: TriviaQuestion[] = [];
    const seen = new Set<string>();
    for (const item of payload.results) {
      if (typeof item !== 'object' || item === null) continue;
      const entry = item as Record<string, unknown>;
      const question = decodeApiText(entry.question);
      const correctAnswer = decodeApiText(entry.correct_answer);
      const incorrectAnswers = Array.isArray(entry.incorrect_answers)
        ? entry.incorrect_answers.map(decodeApiText).filter(Boolean)
        : [];
      const category = decodeApiText(entry.category) || 'Trivia';
      const difficulty = decodeApiText(entry.difficulty) || 'mixed';

      if (!question || !correctAnswer || incorrectAnswers.length < 3 || seen.has(question)) continue;
      seen.add(question);
      questions.push({
        category,
        difficulty,
        question,
        correctAnswer,
        incorrectAnswers: incorrectAnswers.slice(0, 3),
      });
    }

    if (questions.length < 10) {
      return { success: false, message: `Only ${questions.length} valid trivia questions received; need at least 10.` };
    }

    const data: CachedTriviaData = {
      source: 'opentdb',
      refreshedAt: new Date().toISOString(),
      questions,
    };

    await AsyncStorage.setItem(CACHE_KEY_TRIVIA, JSON.stringify(data));
    return { success: true, message: `Trivia data refreshed (${questions.length} questions).` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `Trivia refresh failed: ${msg}` };
  }
}

export async function refreshPuzzleDataIfNeeded(): Promise<PuzzleDataRefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const [wordCache, worldCache, triviaCache] = await Promise.all([
      readCachedWordData(),
      readCachedWorldData(),
      readCachedTriviaData(),
    ]);

    const shouldRefreshWord = !wordCache || !isFresh(wordCache.refreshedAt);
    const shouldRefreshWorld = !worldCache || !isFresh(worldCache.refreshedAt);
    const shouldRefreshTrivia = !triviaCache || !isFresh(triviaCache.refreshedAt);

    const [word, world, trivia] = await Promise.all([
      shouldRefreshWord
        ? refreshWordData()
        : Promise.resolve({ success: true, message: 'Word data cache is fresh.' }),
      shouldRefreshWorld
        ? refreshWorldData()
        : Promise.resolve({ success: true, message: 'World data cache is fresh.' }),
      shouldRefreshTrivia
        ? refreshTriviaData()
        : Promise.resolve({ success: true, message: 'Trivia data cache is fresh.' }),
    ]);

    return { word, world, trivia };
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function getWordDataForPuzzles(): Promise<CachedWordData> {
  const cached = await readCachedWordData();
  if (cached && isFresh(cached.refreshedAt) && cached.words.length > 0) {
    return cached;
  }

  const relationships: WordRelationship[] = [
    ...BUNDLED_SYNONYMS.map((item) => ({
      word: item.word.toLowerCase(),
      related: [item.choices[item.correctIndex].toLowerCase()],
      type: 'synonym' as const,
    })),
    ...BUNDLED_ANTONYMS.map((item) => ({
      word: item.word.toLowerCase(),
      related: [item.choices[item.correctIndex].toLowerCase()],
      type: 'antonym' as const,
    })),
    ...BUNDLED_WORD_ASSOCIATIONS.map((item) => ({
      word: item.word.toLowerCase(),
      related: item.related.map((word) => word.toLowerCase()),
      type: 'association' as const,
    })),
  ];

  const words = [...new Set([
    ...relationships.map((item) => item.word),
    ...relationships.flatMap((item) => item.related),
  ])];

  return {
    source: 'bundled',
    refreshedAt: new Date().toISOString(),
    words,
    relationships,
    definitions: [],
  };
}

export async function getWorldDataForPuzzles(): Promise<CachedWorldData> {
  const cached = await readCachedWorldData();
  if (cached && isFresh(cached.refreshedAt) && cached.countries.length >= 30) {
    return cached;
  }

  return {
    source: 'bundled',
    refreshedAt: new Date().toISOString(),
    countries: BUNDLED_COUNTRIES,
    economicIndicators: [],
  };
}

export async function getTriviaDataForPuzzles(): Promise<CachedTriviaData> {
  const cached = await readCachedTriviaData();
  if (cached && isFresh(cached.refreshedAt) && cached.questions.length >= 10) {
    return cached;
  }

  return {
    source: 'bundled',
    refreshedAt: new Date().toISOString(),
    questions: [],
  };
}
