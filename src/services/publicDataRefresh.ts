// Refreshes word and world data from public APIs (Datamuse and REST Countries).
// Falls back gracefully on any failure. Never blocks gameplay.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUNDLED_COUNTRIES } from '../data/bundledWorldData';
import { BUNDLED_WORD_ANALOGIES } from '../data/bundledWords';
import type { CachedWordData, CachedWorldData, Country, WordRelationship } from '../types';

const DATAMUSE_BASE = 'https://api.datamuse.com';
const RESTCOUNTRIES_BASE = 'https://restcountries.com/v3.1';
const FETCH_TIMEOUT_MS = 8000;

const CACHE_KEY_WORDS = 'mindvault:cache:words';
const CACHE_KEY_WORLD = 'mindvault:cache:world';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SEED_WORDS = [
  'bright', 'fast', 'strong', 'happy', 'cold',
  'ancient', 'quiet', 'brave', 'sharp', 'gentle',
];

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
    if (!word) continue;
    if (!/^[a-z]+$/.test(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    result.push(word);
  }
  return result;
}

export async function refreshWordData(): Promise<{ success: boolean; message: string }> {
  try {
    const allWords: string[] = [];
    const relationships: WordRelationship[] = [];

    for (const seed of SEED_WORDS) {
      try {
        const url = `${DATAMUSE_BASE}/words?rel_syn=${encodeURIComponent(seed)}&max=10`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) continue;
        const json = await res.json();
        if (!Array.isArray(json)) continue;
        const words = sanitizeWords(json);
        if (words.length === 0) continue;
        // Add seed word itself if alphabetic
        if (/^[a-z]+$/.test(seed) && !allWords.includes(seed)) {
          allWords.push(seed);
        }
        for (const w of words) {
          if (!allWords.includes(w)) allWords.push(w);
        }
        relationships.push({ word: seed, related: words, type: 'synonym' });
      } catch {
        // Skip individual seed failures silently
      }
    }

    if (allWords.length < 10) {
      return { success: false, message: 'Insufficient word data received from Datamuse.' };
    }

    const data: CachedWordData = {
      source: 'datamuse',
      refreshedAt: new Date().toISOString(),
      words: allWords,
      relationships,
    };

    await AsyncStorage.setItem(CACHE_KEY_WORDS, JSON.stringify(data));
    return { success: true, message: 'Word data refreshed.' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, message: `Word refresh failed: ${msg}` };
  }
}

export async function refreshWorldData(): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${RESTCOUNTRIES_BASE}/all?fields=name,capital,region,population,flags`;
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

        // Extract name
        const nameObj = e.name as Record<string, unknown> | undefined;
        const name = typeof nameObj?.common === 'string' ? nameObj.common.trim() : '';
        if (!name) continue;
        if (seen.has(name)) continue;

        // Extract capital
        const capitalArr = Array.isArray(e.capital) ? e.capital : [];
        const capital = typeof capitalArr[0] === 'string' && capitalArr[0].trim()
          ? capitalArr[0].trim()
          : 'N/A';

        // Extract region
        const region = typeof e.region === 'string' ? e.region.trim() : '';

        // Extract population
        const population = typeof e.population === 'number' ? e.population : 0;

        // Extract flag emoji from flags.png or use empty string
        const flagsObj = e.flags as Record<string, unknown> | undefined;
        const flagEmoji = typeof flagsObj?.png === 'string' ? flagsObj.png : '';

        seen.add(name);
        countries.push({ name, capital, region, population, flagEmoji });
      } catch {
        // Skip malformed entries
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

export async function getWordDataForPuzzles(): Promise<CachedWordData> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_WORDS);
    if (raw) {
      const parsed: CachedWordData = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.refreshedAt === 'string' &&
        Array.isArray(parsed.words) &&
        parsed.words.length > 0
      ) {
        const age = Date.now() - new Date(parsed.refreshedAt).getTime();
        if (age < CACHE_MAX_AGE_MS) {
          return parsed;
        }
      }
    }
  } catch {
    // Fall through to bundled
  }

  return {
    source: 'bundled',
    refreshedAt: new Date().toISOString(),
    words: BUNDLED_WORD_ANALOGIES.map(a => a.word),
    relationships: BUNDLED_WORD_ANALOGIES.map(a => ({
      word: a.word,
      related: a.related,
      type: 'synonym' as const,
    })),
  };
}

export async function getWorldDataForPuzzles(): Promise<CachedWorldData> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_WORLD);
    if (raw) {
      const parsed: CachedWorldData = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.refreshedAt === 'string' &&
        Array.isArray(parsed.countries) &&
        parsed.countries.length >= 30
      ) {
        const age = Date.now() - new Date(parsed.refreshedAt).getTime();
        if (age < CACHE_MAX_AGE_MS) {
          return parsed;
        }
      }
    }
  } catch {
    // Fall through to bundled
  }

  return {
    source: 'bundled',
    refreshedAt: new Date().toISOString(),
    countries: BUNDLED_COUNTRIES,
  };
}
