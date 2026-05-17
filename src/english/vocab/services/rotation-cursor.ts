import { ROTATION_BATCH_SIZE } from '@/shared/constants/game-constants';

/**
 * Pure functions for Listen & Learn rotation cursor logic.
 * All Dexie I/O is the caller's responsibility.
 */

/**
 * Return the next cursor position after a session of batchSize words
 * from a set of totalWords.
 */
export function advanceCursor(
  cursor: number,
  totalWords: number,
  batchSize: number = ROTATION_BATCH_SIZE,
): number {
  if (totalWords === 0) return 0;
  return (cursor + batchSize) % totalWords;
}

/**
 * Given the current cursor and a word list, return an ordered array of
 * word-list indices for the next Listen & Learn batch.
 *
 * Rules (contract §Mode A):
 * - Take a window of `batchSize` starting at `cursor`, wrapping at end.
 * - Deduplicate by index (wrap can create overlaps for small sets).
 * - Within the window, prefer un-introduced words first (preserving order),
 *   then already-introduced words to fill remaining slots.
 * - Return at most `batchSize` indices; may return fewer for small sets.
 */
export function buildBatchIndices(
  cursor: number,
  totalWords: number,
  introducedFlags: boolean[], // introducedFlags[i] === true means words[i] is already introduced
  batchSize: number = ROTATION_BATCH_SIZE,
): number[] {
  if (totalWords === 0) return [];

  // Build raw window (with wrap-around), deduplicated
  const seen = new Set<number>();
  const window: number[] = [];
  for (let offset = 0; offset < batchSize; offset++) {
    const idx = (cursor + offset) % totalWords;
    if (!seen.has(idx)) {
      seen.add(idx);
      window.push(idx);
    }
  }

  // Partition: un-introduced first, then already-introduced (stable order)
  const unintroduced = window.filter((i) => !introducedFlags[i]);
  const introduced = window.filter((i) => introducedFlags[i]);

  return [...unintroduced, ...introduced].slice(0, batchSize);
}
