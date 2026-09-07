import type { PracticeStage, StarRating } from '@/math/types/math.types';
import { PRACTICE_TOPIC_PREFIX, PRACTICE_WINDOWS } from '@/math/constants/math-constants';

/**
 * Pure progression rules for the Number Lab (Constitution III + VII).
 *
 * Every stage is always open: the ladder is teaching order, not a gate. A child
 * who needs the "hidden in a minus" form should not have to earn her way to it.
 *
 * Stage results share the `mathTopicProgress` table with the Skills Hive, under
 * a `numberlab:` prefix. That avoids a schema migration, but it means anything
 * reading the table as hive progress must filter — see `isMathTopicId`.
 */

/** Best stars ever earned on a stage, plus how many times it has been played. */
export interface StageProgress {
  stars: 0 | StarRating;
  /** 1-based attempt cursor; also selects the rotating question window. */
  attempt: number;
}

/** Map of stage index → progress, as loaded for the active child. */
export type StageProgressMap = Record<number, StageProgress>;

/** The `mathTopicProgress.topicId` a stage's row is stored under. */
export function practiceTopicId(stageIndex: number): string {
  return `${PRACTICE_TOPIC_PREFIX}:${stageIndex}`;
}

/** The stage index a stored row belongs to, or undefined if it is not ours. */
export function parsePracticeRow(topicId: string): number | undefined {
  const prefix = `${PRACTICE_TOPIC_PREFIX}:`;
  if (!topicId.startsWith(prefix)) return undefined;
  const index = Number(topicId.slice(prefix.length));
  return Number.isInteger(index) && index > 0 ? index : undefined;
}

/** Which rotating question window an attempt plays (attempts are 1-based). */
export function windowForAttempt(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 1) return 0;
  return (Math.floor(attempt) - 1) % PRACTICE_WINDOWS;
}

/**
 * Merge a freshly-earned rating into a stage's progress: keep the best-ever
 * stars (a weaker replay never lowers a rating) and advance the attempt cursor
 * so the next run gets a different question window.
 */
export function mergeStageResult(existing: StageProgress | undefined, stars: StarRating): StageProgress {
  return {
    stars: Math.max(existing?.stars ?? 0, stars) as 0 | StarRating,
    attempt: (existing?.attempt ?? 1) + 1,
  };
}

/** How many stages are cleared, for the pillar header. */
export function labSummary(stages: PracticeStage[], progress: StageProgressMap) {
  return {
    cleared: stages.filter((s) => (progress[s.index]?.stars ?? 0) > 0).length,
    total: stages.length,
  };
}
