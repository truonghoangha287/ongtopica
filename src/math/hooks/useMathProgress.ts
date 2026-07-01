import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { applyCorrect, applyIncorrect } from '@/math/services/math-scorer';
import type { MathProgressRow } from '@/shared/db/schema';

export interface UseMathProgressReturn {
  getTopicProgress: (topicId: string) => Promise<MathProgressRow[]>;
  getAllProgress: () => Promise<MathProgressRow[]>;
  recordCorrect: (problemId: string, topicId: string) => Promise<void>;
  recordIncorrect: (problemId: string, topicId: string) => Promise<void>;
}

function freshRow(childId: string, problemId: string, topicId: string): MathProgressRow {
  return {
    id: `${childId}:${problemId}`,
    childId,
    topicId,
    problemId,
    consecutiveCorrect: 0,
    totalIncorrect: 0,
    mastered: false,
    lastReviewedAt: Date.now(),
  };
}

export function useMathProgress(): UseMathProgressReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getTopicProgress = async (topicId: string) => {
    if (!activeProfileId) return [];
    return db.mathProgress
      .where('[childId+topicId]')
      .equals([activeProfileId, topicId])
      .toArray();
  };

  const getAllProgress = async () => {
    if (!activeProfileId) return [];
    return db.mathProgress.where('childId').equals(activeProfileId).toArray();
  };

  const recordCorrect = async (problemId: string, topicId: string) => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${problemId}`;
    const existing = await db.mathProgress.get(id);
    if (existing) {
      await db.mathProgress.update(id, applyCorrect(existing));
    } else {
      const row = freshRow(activeProfileId, problemId, topicId);
      await db.mathProgress.add({ ...row, ...applyCorrect(row) });
    }
  };

  const recordIncorrect = async (problemId: string, topicId: string) => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${problemId}`;
    const existing = await db.mathProgress.get(id);
    if (existing) {
      await db.mathProgress.update(id, applyIncorrect(existing));
    } else {
      const row = freshRow(activeProfileId, problemId, topicId);
      await db.mathProgress.add({ ...row, ...applyIncorrect(row) });
    }
  };

  return { getTopicProgress, getAllProgress, recordCorrect, recordIncorrect };
}
