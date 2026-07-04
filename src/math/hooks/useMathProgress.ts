import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { mergeHiveResult, nextStreak } from '@/math/services/hive-progress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { HONEY_PER_HIVE, MS_PER_DAY } from '@/math/constants/math-constants';
import type { MathTopicId, OlympiadTrack, StarRating } from '@/math/types/math.types';

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

/** Per-level best stars for one topic, keyed by level (1-based). */
export type LevelResults = Record<number, StarRating>;

export interface OlympiadResult {
  economy: MathEconomy;
  /** Best puzzles ever solved in one daily challenge for this track. */
  solved: number;
}

export interface UseMathProgressReturn {
  getEconomy: () => Promise<MathEconomy>;
  getTopicProgress: () => Promise<ProgressMap>;
  getLevelResults: (topicId: MathTopicId) => Promise<LevelResults>;
  recordHiveCleared: (topicId: MathTopicId, stars: StarRating) => Promise<HiveResult>;
  getOlympiadSolved: (track: OlympiadTrack) => Promise<number>;
  recordOlympiadCleared: (track: OlympiadTrack, solved: number) => Promise<OlympiadResult>;
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

  const getLevelResults = async (topicId: MathTopicId): Promise<LevelResults> => {
    if (!activeProfileId) return {};
    const rows = await db.mathLevelResults
      .where('[childId+topicId]')
      .equals([activeProfileId, topicId])
      .toArray();
    const map: LevelResults = {};
    for (const r of rows) map[r.level] = r.stars;
    return map;
  };

  /**
   * Award honey and advance the daily streak/goal counter. Shared by hive and
   * Olympiad completions so the economy rules live in exactly one place.
   */
  const awardEconomy = async (): Promise<MathEconomy> => {
    const econRow = await db.mathProfileState.get(activeProfileId!);
    const today = todayIndex();
    const honey = (econRow?.honey ?? 0) + HONEY_PER_HIVE;
    const streak = nextStreak(econRow?.streak ?? 0, econRow?.lastActiveDay ?? 0, today);
    // Reset the daily-goal counter when the day rolls over, else increment it.
    const hivesToday = econRow && econRow.lastActiveDay === today ? econRow.hivesToday + 1 : 1;
    await db.mathProfileState.put({
      id: activeProfileId!,
      childId: activeProfileId!,
      honey,
      streak,
      lastActiveDay: today,
      hivesToday,
    });
    return { honey, streak, hivesToday };
  };

  const recordHiveCleared = async (topicId: MathTopicId, stars: StarRating): Promise<HiveResult> => {
    if (!activeProfileId) return { economy: { ...DEFAULT_ECONOMY }, stars };
    const now = Date.now();

    // --- Topic mastery: keep best-ever stars, advance the level cursor. ---
    const topicRowId = `${activeProfileId}:${topicId}`;
    const existingTopic = await db.mathTopicProgress.get(topicRowId);
    const playedLevel = existingTopic?.level ?? 1;
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

    // --- Per-level result: keep the best stars earned on the level just played. ---
    const levelRowId = `${activeProfileId}:${topicId}:${playedLevel}`;
    const existingLevel = await db.mathLevelResults.get(levelRowId);
    await db.mathLevelResults.put({
      id: levelRowId,
      childId: activeProfileId,
      topicId,
      level: playedLevel,
      stars: (Math.max(existingLevel?.stars ?? 0, stars) as StarRating),
      updatedAt: now,
    });

    const economy = await awardEconomy();
    return { economy, stars: merged.stars };
  };

  const getOlympiadSolved = async (track: OlympiadTrack): Promise<number> => {
    if (!activeProfileId) return 0;
    const row = await db.mathOlympiadState.get(`${activeProfileId}:${track}`);
    return row?.solved ?? 0;
  };

  const recordOlympiadCleared = async (track: OlympiadTrack, solved: number): Promise<OlympiadResult> => {
    if (!activeProfileId) return { economy: { ...DEFAULT_ECONOMY }, solved };
    const rowId = `${activeProfileId}:${track}`;
    const existing = await db.mathOlympiadState.get(rowId);
    const best = Math.max(existing?.solved ?? 0, solved);
    await db.mathOlympiadState.put({
      id: rowId,
      childId: activeProfileId,
      track,
      solved: best,
      lastDay: todayIndex(),
      updatedAt: Date.now(),
    });
    const economy = await awardEconomy();
    return { economy, solved: best };
  };

  return {
    getEconomy,
    getTopicProgress,
    getLevelResults,
    recordHiveCleared,
    getOlympiadSolved,
    recordOlympiadCleared,
  };
}
