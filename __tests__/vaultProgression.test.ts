import {
  meetsVaultUnlockRequirement,
  VAULT_UNLOCK_ACCURACY,
} from '../src/game/vaultProgression';

describe('vault progression', () => {
  it('requires at least 80% accuracy to unlock the next vault', () => {
    expect(VAULT_UNLOCK_ACCURACY).toBe(80);
    expect(meetsVaultUnlockRequirement(79)).toBe(false);
    expect(meetsVaultUnlockRequirement(80)).toBe(true);
    expect(meetsVaultUnlockRequirement(100)).toBe(true);
  });
});
