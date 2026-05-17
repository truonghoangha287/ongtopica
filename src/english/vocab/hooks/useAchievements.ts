import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { evaluateAchievements } from '@/english/vocab/services/achievement-evaluator';
import { wordSetRegistry } from '@/data/yle-starters/index';
import type { AchievementRow, WordProgressRow } from '@/shared/db/schema';

export interface UseAchievementsReturn {
  getEarned: () => Promise<AchievementRow[]>;
  recordNewAchievements: (progressMap: Record<string, WordProgressRow>) => Promise<string[]>;
}

export function useAchievements(): UseAchievementsReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  /** Load all earned achievements for the active profile. */
  const getEarned = async (): Promise<AchievementRow[]> => {
    if (!activeProfileId) return [];
    return db.achievements.where('childId').equals(activeProfileId).toArray();
  };

  /**
   * Evaluate achievements against the latest progress map, persist any newly
   * earned ones, and return their IDs so the caller can trigger celebrations.
   */
  const recordNewAchievements = async (
    progressMap: Record<string, WordProgressRow>,
  ): Promise<string[]> => {
    if (!activeProfileId) return [];

    const earned = await getEarned();
    const earnedIds = new Set(earned.map((a) => a.achievementId));

    const newIds = evaluateAchievements(progressMap, wordSetRegistry, earnedIds);
    if (newIds.length === 0) return [];

    const now = Date.now();
    await db.achievements.bulkAdd(
      newIds.map((achievementId) => ({
        id: `${activeProfileId}:${achievementId}`,
        childId: activeProfileId,
        achievementId,
        earnedAt: now,
      })),
    );

    return newIds;
  };

  return { getEarned, recordNewAchievements };
}
