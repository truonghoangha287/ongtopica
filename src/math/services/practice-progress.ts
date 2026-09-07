import type { PracticeStage, StarRating } from '@/math/types/math.types';
import {
  PRACTICE_TOPIC_PREFIX,
  PRACTICE_UNLOCK_STARS,
  PRACTICE_WINDOWS,
} from '@/math/constants/math-constants';
import { isUnlockAll } from '@/shared/config/feature-unlock';

/**
 * Pure progression rules for the Number Lab (Constitution III + VII).
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
 * A stage opens once the previous one has earned at least
 * `PRACTICE_UNLOCK_STARS`. The first stage is always open, and the global
 * "unlock everything" config flag skips the ladder so a grown-up can jump
 * straight to the stage their child actually needs.
 *
 * A stage the child has already cleared stays open for good — including one
 * reached through the config flag. Re-locking practice she has done would take
 * away the one she most wants to repeat.
 */
export function isStageUnlocked(stage: PracticeStage, progress: StageProgressMap): boolean {
  if (stage.index <= 1) return true;
  if ((progress[stage.index]?.stars ?? 0) > 0) return true;
  if (unlockAllEnabled()) return true;
  return (progress[stage.index - 1]?.stars ?? 0) >= PRACTICE_UNLOCK_STARS;
}

/** Private browsing can throw on localStorage reads; treat that as "not set". */
function unlockAllEnabled(): boolean {
  try {
    return isUnlockAll();
  } catch {
    return false;
  }
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
