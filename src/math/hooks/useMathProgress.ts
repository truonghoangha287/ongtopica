import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { mergeHiveResult, nextStreak } from '@/math/services/hive-progress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { HONEY_PER_HIVE, MS_PER_DAY } from '@/math/constants/math-constants';
import type { MathTopicId, StarRating } from '@/math/types/math.types';

/** Honey wallet + streak + daily-goal counter shown across the Math World UI. */
export interface MathEconomy {
  honey: number;
  streak: number;
  hivesToday: number;
}

export interface HiveResult {
  economy: MathEconomy;
  /** Best stars now held for the topic (after merging this attempt). */
  stars: 0 | StarRating;
}

export interface UseMathProgressReturn {
  getEconomy: () => Promise<MathEconomy>;
  getTopicProgress: () => Promise<ProgressMap>;
  recordHiveCleared: (topicId: MathTopicId, stars: StarRating) => Promise<HiveResult>;
}

const DEFAULT_ECONOMY: MathEconomy = { honey: 0, streak: 0, hivesToday: 0 };

/** Whole-day index of "now", for streak continuity maths. */
function todayIndex(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}

/**
 * Dexie-backed persistence for the Math World economy and per-topic mastery.
 * All state is local to the device and scoped to the active child profile
 * (Constitution IV). Progression maths is delegated to the pure `hive-progress`
 * service so it stays unit-tested (Constitution VII).
 */
export function useMathProgress(): UseMathProgressReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getEconomy = async (): Promise<MathEconomy> => {
    if (!activeProfileId) return { ...DEFAULT_ECONOMY };
    const row = await db.mathProfileState.get(activeProfileId);
    return row
      ? { honey: row.honey, streak: row.streak, hivesToday: row.hivesToday }
      : { ...DEFAULT_ECONOMY };
  };

  const getTopicProgress = async (): Promise<ProgressMap> => {
    if (!activeProfileId) return {};
    const rows = await db.mathTopicProgress.where('childId').equals(activeProfileId).toArray();
    const map: ProgressMap = {};
    for (const r of rows) {
      map[r.topicId as MathTopicId] = { stars: r.stars, level: r.level };
    }
    return map;
  };

  const recordHiveCleared = async (topicId: MathTopicId, stars: StarRating): Promise<HiveResult> => {
    if (!activeProfileId) return { economy: { ...DEFAULT_ECONOMY }, stars };
    const now = Date.now();

    // --- Topic mastery: keep best-ever stars, advance the level cursor. ---
    const topicRowId = `${activeProfileId}:${topicId}`;
    const existingTopic = await db.mathTopicProgress.get(topicRowId);
    const merged = mergeHiveResult(
      existingTopic ? { stars: existingTopic.stars, level: existingTopic.level } : undefined,
      stars,
    );
    await db.mathTopicProgress.put({
      id: topicRowId,
      childId: activeProfileId,
      topicId,
      stars: merged.stars,
      level: merged.level,
      updatedAt: now,
    });

    // --- Economy: award honey and update the daily streak. ---
    const econRow = await db.mathProfileState.get(activeProfileId);
    const today = todayIndex();
    const honey = (econRow?.honey ?? 0) + HONEY_PER_HIVE;
    const streak = nextStreak(econRow?.streak ?? 0, econRow?.lastActiveDay ?? 0, today);
    // Reset the daily-goal counter when the day rolls over, else increment it.
    const hivesToday = econRow && econRow.lastActiveDay === today ? econRow.hivesToday + 1 : 1;
    await db.mathProfileState.put({
      id: activeProfileId,
      childId: activeProfileId,
      honey,
      streak,
      lastActiveDay: today,
      hivesToday,
    });

    return { economy: { honey, streak, hivesToday }, stars: merged.stars };
  };

  return { getEconomy, getTopicProgress, recordHiveCleared };
}
