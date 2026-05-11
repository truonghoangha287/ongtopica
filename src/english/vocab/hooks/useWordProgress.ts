import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { applyCorrect, applyIncorrect } from '@/english/vocab/services/priority-scorer';
import { INITIAL_PRIORITY } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

export interface UseWordProgressReturn {
  getProgress: (wordId: string) => Promise<WordProgressRow | undefined>;
  getWordSetProgress: (wordSetId: string) => Promise<WordProgressRow[]>;
  getAllProgress: () => Promise<WordProgressRow[]>;
  recordCorrect: (wordId: string, wordSetId: string) => Promise<void>;
  recordIncorrect: (wordId: string, wordSetId: string) => Promise<void>;
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
      };
      await db.wordProgress.add({ ...newRow, ...applyIncorrect(newRow) });
    }
  };

  return { getProgress, getWordSetProgress, getAllProgress, recordCorrect, recordIncorrect };
}
