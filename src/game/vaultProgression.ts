import type { VaultType } from '../types';

const VAULT_TYPE_SEQUENCE: VaultType[] = ['quick', 'pattern', 'number', 'word', 'world', 'memory'];

export function normalizeVaultLevel(level?: number): number {
  if (!level || !Number.isFinite(level) || level < 1) return 1;
  return Math.floor(level);
}

export function vaultTypeForLevel(level: number): VaultType {
  const normalized = normalizeVaultLevel(level);
  return VAULT_TYPE_SEQUENCE[(normalized - 1) % VAULT_TYPE_SEQUENCE.length];
}

export function vaultSeedForLevel(level: number): number {
  const normalized = normalizeVaultLevel(level);
  let seed = normalized * 2654435761;
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 2246822507);
  seed ^= seed >>> 13;
  seed = Math.imul(seed, 3266489909);
  seed ^= seed >>> 16;
  return Math.abs(seed) || normalized;
}

export function vaultDisplayName(level?: number): string {
  return level ? `Vault ${normalizeVaultLevel(level)}` : 'Vault';
}

export function vaultTypeLabel(type: VaultType): string {
  switch (type) {
    case 'quick': return 'Mixed';
    case 'pattern': return 'Patterns';
    case 'number': return 'Numbers';
    case 'memory': return 'Memory';
    case 'word': return 'Words';
    case 'world': return 'World';
    case 'daily': return 'Daily';
    default: return 'Vault';
  }
}

export function difficultyForLevel(level: number): 'Easy' | 'Medium' | 'Hard' {
  const normalized = normalizeVaultLevel(level);
  if (normalized <= 3) return 'Easy';
  if (normalized <= 9) return 'Medium';
  return 'Hard';
}

export function visibleVaultLevels(unlockedLevel: number): number[] {
  const highest = Math.max(12, normalizeVaultLevel(unlockedLevel) + 5);
  return Array.from({ length: highest }, (_, index) => index + 1);
}
