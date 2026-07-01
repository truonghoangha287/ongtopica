import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { evaluateMathAchievements } from '@/math/services/math-achievement-evaluator';
import { mathTopicRegistry } from '@/data/math-starters/index';
import type { AchievementRow } from '@/shared/db/schema';
import type { MathProgressMap } from '@/math/types/math.types';

/** All math achievement ids share the `math_` prefix or the `topic_master:` root. */
function isMathAchievement(id: string): boolean {
  return id.startsWith('math_') || id.startsWith('topic_master:');
}

export interface UseMathAchievementsReturn {
  getEarned: () => Promise<AchievementRow[]>;
  recordNewAchievements: (progressMap: MathProgressMap) => Promise<string[]>;
}

export function useMathAchievements(): UseMathAchievementsReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getEarned = async () => {
    if (!activeProfileId) return [];
    const rows = await db.achievements.where('childId').equals(activeProfileId).toArray();
    return rows.filter((r) => isMathAchievement(r.achievementId));
  };

  const recordNewAchievements = async (progressMap: MathProgressMap): Promise<string[]> => {
    if (!activeProfileId) return [];
    const earnedRows = await db.achievements.where('childId').equals(activeProfileId).toArray();
    const earnedSet = new Set(earnedRows.map((r) => r.achievementId));
    const newIds = evaluateMathAchievements(progressMap, mathTopicRegistry, earnedSet);
    const now = Date.now();
    await Promise.all(
      newIds.map((achievementId) =>
        db.achievements.add({
          id: `${activeProfileId}:${achievementId}`,
          childId: activeProfileId,
          achievementId,
          earnedAt: now,
        }),
      ),
    );
    return newIds;
  };

  return { getEarned, recordNewAchievements };
}
