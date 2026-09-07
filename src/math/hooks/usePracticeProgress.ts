import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { awardEconomy, DEFAULT_ECONOMY } from '@/math/services/math-economy';
import type { MathEconomy } from '@/math/services/math-economy';
import {
  mergeStageResult,
  parsePracticeRow,
  practiceTopicId,
} from '@/math/services/practice-progress';
import type { StageProgress, StageProgressMap } from '@/math/services/practice-progress';
import type { StarRating } from '@/math/types/math.types';

export interface StageResult {
  economy: MathEconomy;
  /** Best stars now held for the stage (after merging this attempt). */
  stars: 0 | StarRating;
}

export interface UsePracticeProgressReturn {
  getStageProgress: () => Promise<StageProgressMap>;
  recordStageCleared: (stageIndex: number, stars: StarRating) => Promise<StageResult>;
}

/**
 * Dexie-backed persistence for Number Lab stages. Rows live in the existing
 * `mathTopicProgress` table under a `numberlab:` prefix, so no schema version
 * bump is needed; the progression maths itself is delegated to the pure
 * `practice-progress` service (Constitution VII).
 */
export function usePracticeProgress(): UsePracticeProgressReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getStageProgress = async (): Promise<StageProgressMap> => {
    if (!activeProfileId) return {};
    const rows = await db.mathTopicProgress.where('childId').equals(activeProfileId).toArray();
    const map: StageProgressMap = {};
    for (const r of rows) {
      const stageIndex = parsePracticeRow(r.topicId);
      if (stageIndex !== undefined) map[stageIndex] = { stars: r.stars, attempt: r.level };
    }
    return map;
  };

  const recordStageCleared = async (stageIndex: number, stars: StarRating): Promise<StageResult> => {
    if (!activeProfileId) return { economy: { ...DEFAULT_ECONOMY }, stars };
    const rowId = `${activeProfileId}:${practiceTopicId(stageIndex)}`;
    const existing = await db.mathTopicProgress.get(rowId);
    const previous: StageProgress | undefined = existing
      ? { stars: existing.stars, attempt: existing.level }
      : undefined;
    const merged = mergeStageResult(previous, stars);
    await db.mathTopicProgress.put({
      id: rowId,
      childId: activeProfileId,
      topicId: practiceTopicId(stageIndex),
      stars: merged.stars,
      level: merged.attempt,
      updatedAt: Date.now(),
    });
    const economy = await awardEconomy(activeProfileId);
    return { economy, stars: merged.stars };
  };

  return { getStageProgress, recordStageCleared };
}
