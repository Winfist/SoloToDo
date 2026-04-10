import { useMemo } from 'react';
import { isFeatureUnlocked, getNextUnlockLevel, FEATURE_UNLOCKS } from '../data/featureUnlocks.js';

/**
 * React hook for checking feature unlock status.
 * Returns a `can(featureKey)` function and the next unlock level.
 *
 * Usage:
 *   const { can, nextLevel } = useFeatureUnlocks(state.level);
 *   if (can('dungeons')) { ... }
 */
export function useFeatureUnlocks(playerLevel) {
  return useMemo(() => {
    const can = (key) => isFeatureUnlocked(key, playerLevel);
    const nextLevel = getNextUnlockLevel(playerLevel);
    return { can, nextLevel, FEATURE_UNLOCKS };
  }, [playerLevel]);
}
