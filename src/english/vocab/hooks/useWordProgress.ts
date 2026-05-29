import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { applyCorrect, applyIncorrect } from '@/english/vocab/services/priority-scorer';
import { advanceCursor } from '@/english/vocab/services/rotation-cursor';
import { INITIAL_PRIORITY, ROTATION_BATCH_SIZE } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

export interface UseWordProgressReturn {
  getProgress: (wordId: string) => Promise<WordProgressRow | undefined>;
  getWordSetProgress: (wordSetId: string) => Promise<WordProgressRow[]>;
  getAllProgress: () => Promise<WordProgressRow[]>;
  recordCorrect: (wordId: string, wordSetId: string) => Promise<void>;
  recordIncorrect: (wordId: string, wordSetId: string) => Promise<void>;
  recordIntroduced: (wordIds: string[], wordSetId: string) => Promise<void>;
  getRotationCursor: (wordSetId: string) => Promise<number>;
  advanceRotationCursor: (wordSetId: string, totalWords: number) => Promise<void>;
}

export function useWordProgress(): UseWordProgressReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getProgress = async (wordId: string) => {
    if (!activeProfileId) return undefined;
    return db.wordProgress.get(`${activeProfileId}:${wordId}`);
  };

  const getWordSetProgress = async (wordSetId: string) => {
    if (!activeProfileId) return [];
    return db.wordProgress
      .where('[childId+wordSetId]')
      .equals([activeProfileId, wordSetId])
      .toArray();
  };

  const getAllProgress = async () => {
    if (!activeProfileId) return [];
    return db.wordProgress.where('childId').equals(activeProfileId).toArray();
  };

  const recordCorrect = async (wordId: string, wordSetId: string) => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${wordId}`;
    const existing = await db.wordProgress.get(id);
    if (existing) {
      await db.wordProgress.update(id, applyCorrect(existing));
    } else {
      const newRow: WordProgressRow = {
        id,
        childId: activeProfileId,
        wordId,
        wordSetId,
        stage: 1,
        consecutiveCorrect: 0,
        totalIncorrect: 0,
        priorityScore: INITIAL_PRIORITY,
        lastReviewedAt: Date.now(),
        introducedAt: null,
      };
      await db.wordProgress.add({ ...newRow, ...applyCorrect(newRow) });
    }
  };

  const recordIncorrect = async (wordId: string, wordSetId: string) => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${wordId}`;
    const existing = await db.wordProgress.get(id);
    if (existing) {
      await db.wordProgress.update(id, applyIncorrect(existing));
    } else {
      const newRow: WordProgressRow = {
        id,
        childId: activeProfileId,
        wordId,
        wordSetId,
        stage: 1,
        consecutiveCorrect: 0,
        totalIncorrect: 0,
        priorityScore: INITIAL_PRIORITY,
        lastReviewedAt: Date.now(),
        introducedAt: null,
      };
      await db.wordProgress.add({ ...newRow, ...applyIncorrect(newRow) });
    }
  };

  /**
   * Mark words as introduced (set introducedAt) for those that don't have it yet.
   * Called after a Listen & Learn session completes.
   */
  const recordIntroduced = async (wordIds: string[], wordSetId: string) => {
    if (!activeProfileId) return;
    const now = Date.now();
    await Promise.all(
      wordIds.map(async (wordId) => {
        const id = `${activeProfileId}:${wordId}`;
        const existing = await db.wordProgress.get(id);
        if (existing) {
          if (existing.introducedAt == null) {
            await db.wordProgress.update(id, { introducedAt: now });
          }
        } else {
          const newRow: WordProgressRow = {
            id,
            childId: activeProfileId,
            wordId,
            wordSetId,
            stage: 1,
            consecutiveCorrect: 0,
            totalIncorrect: 0,
            priorityScore: INITIAL_PRIORITY,
            lastReviewedAt: now,
            introducedAt: now,
          };
          await db.wordProgress.add(newRow);
        }
      }),
    );
  };

  /**
   * Read the rotation cursor for this (child, wordSet) pair.
   * Returns 0 if no row exists yet.
   */
  const getRotationCursor = async (wordSetId: string): Promise<number> => {
    if (!activeProfileId) return 0;
    const id = `${activeProfileId}:${wordSetId}`;
    const row = await db.wordSetState.get(id);
    return row?.rotationCursor ?? 0;
  };

  /**
   * Advance and persist the rotation cursor for this (child, wordSet) pair.
   */
  const advanceRotationCursor = async (wordSetId: string, totalWords: number): Promise<void> => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${wordSetId}`;
    const existing = await db.wordSetState.get(id);
    const current = existing?.rotationCursor ?? 0;
    const next = advanceCursor(current, totalWords, ROTATION_BATCH_SIZE);
    const now = Date.now();
    if (existing) {
      await db.wordSetState.update(id, { rotationCursor: next, lastUpdatedAt: now });
    } else {
      await db.wordSetState.add({
        id,
        childId: activeProfileId,
        wordSetId,
        rotationCursor: next,
        lastUpdatedAt: now,
      });
    }
  };

  return {
    getProgress,
    getWordSetProgress,
    getAllProgress,
    recordCorrect,
    recordIncorrect,
    recordIntroduced,
    getRotationCursor,
    advanceRotationCursor,
  };
}
