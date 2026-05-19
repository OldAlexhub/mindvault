// Refreshes word and world data from public APIs. Gameplay falls back to
// bundled data when the network is unavailable.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUNDLED_COUNTRIES } from '../data/bundledWorldData';
import {
  BUNDLED_WORD_ASSOCIATIONS,
  BUNDLED_SYNONYMS,
  BUNDLED_ANTONYMS,
} from '../data/bundledWords';
import type { CachedWordData, CachedWorldData, Country, WordRelationship } from '../types';

const DATAMUSE_BASE = 'https://api.datamuse.com';
const RESTCOUNTRIES_BASE = 'https://restcountries.com/v3.1';
const FETCH_TIMEOUT_MS = 8000;

const CACHE_KEY_WORDS = 'mindvault:cache:words';
const CACHE_KEY_WORLD = 'mindvault:cache:world';
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

type RefreshResult = { success: boolean; message: string };
type PuzzleDataRefreshResult = { word: RefreshResult; world: RefreshResult };

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

    const allWords = [...wordSet];
    if (allWords.length < 20 || relationships.length < 8) {
      return { success: false, message: 'Insufficient word data received from Datamuse.' };
    }

    const data: CachedWordData = {
      source: 'datamuse',
      refreshedAt: new Date().toISOString(),
      words: allWords,
      relationships,
    };

    await AsyncStorage.setItem(CACHE_KEY_WORDS, JSON.stringify(data));
    return { success: true, message: `Word data refreshed (${relationships.length} relationships).` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `Word refresh failed: ${msg}` };
  }
}

export async function refreshWorldData(): Promise<RefreshResult> {
  try {
    const url = `${RESTCOUNTRIES_BASE}/all?fields=name,capital,region,population,flag`;
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
        const capitalArr = Array.isArray(e.capital) ? e.capital : [];
        const capital = typeof capitalArr[0] === 'string' ? capitalArr[0].trim() : '';
        const region = typeof e.region === 'string' ? e.region.trim() : '';
        const population = typeof e.population === 'number' ? e.population : 0;
        const flagEmoji = typeof e.flag === 'string' ? e.flag : '';

        if (!name || !capital || !region || !population || seen.has(name)) continue;
        seen.add(name);
        countries.push({ name, capital, region, population, flagEmoji });
      } catch {
        // Skip malformed entries.
      }
    }

    if (countries.length < 30) {
      return { success: false, message: `Only ${countries.length} valid countries received; need at least 30.` };
    }

    const data: CachedWorldData = {
      source: 'restcountries',
      refreshedAt: new Date().toISOString(),
      countries,
    };

    await AsyncStorage.setItem(CACHE_KEY_WORLD, JSON.stringify(data));
    return { success: true, message: `World data refreshed (${countries.length} countries).` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `World refresh failed: ${msg}` };
  }
}

export async function refreshPuzzleDataIfNeeded(): Promise<PuzzleDataRefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const [wordCache, worldCache] = await Promise.all([
      readCachedWordData(),
      readCachedWorldData(),
    ]);

    const shouldRefreshWord = !wordCache || !isFresh(wordCache.refreshedAt);
    const shouldRefreshWorld = !worldCache || !isFresh(worldCache.refreshedAt);

    const [word, world] = await Promise.all([
      shouldRefreshWord
        ? refreshWordData()
        : Promise.resolve({ success: true, message: 'Word data cache is fresh.' }),
      shouldRefreshWorld
        ? refreshWorldData()
        : Promise.resolve({ success: true, message: 'World data cache is fresh.' }),
    ]);

    return { word, world };
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
  };
}
