import type { MathTopic, MathTopicId, StarRating, TopicProgress } from '@/math/types/math.types';

/** Map of topic id → persisted mastery, as loaded for the active child. */
export type ProgressMap = Partial<Record<MathTopicId, TopicProgress>>;

/** Sum of best stars earned across every topic — drives unlock gates. */
export function totalStars(progress: ProgressMap): number {
  return Object.values(progress).reduce((sum, p) => sum + (p?.stars ?? 0), 0);
}

/**
 * A locked topic (Logic) opens once the child's total stars reach its
 * `unlockStars` threshold. Non-locked topics are always available.
 */
export function isTopicUnlocked(topic: MathTopic, progress: ProgressMap): boolean {
  if (!topic.locked) return true;
  return totalStars(progress) >= (topic.unlockStars ?? Infinity);
}

/**
 * Hub header summary: how many of the hive's cells have been fully mastered
 * (3★) out of the total number of cells.
 */
export function hubSummary(topics: MathTopic[], progress: ProgressMap): { mastered: number; total: number } {
  const mastered = topics.filter((t) => (progress[t.id]?.stars ?? 0) >= 3).length;
  return { mastered, total: topics.length };
}

/**
 * The "current" topic the bee hovers over: the earliest unlocked, not-yet-
 * mastered cell in ladder order. Returns undefined when everything is mastered.
 */
export function currentTopic(topics: MathTopic[], progress: ProgressMap): MathTopic | undefined {
  return topics.find((t) => isTopicUnlocked(t, progress) && (progress[t.id]?.stars ?? 0) < 3);
}

/**
 * Merge a freshly-earned star rating into existing topic progress, keeping the
 * best-ever stars (a weaker replay never lowers a child's rating) and advancing
 * the level cursor by one.
 */
export function mergeHiveResult(existing: TopicProgress | undefined, stars: StarRating): TopicProgress {
  const prevStars = existing?.stars ?? 0;
  const prevLevel = existing?.level ?? 1;
  return {
    stars: (Math.max(prevStars, stars) as 0 | StarRating),
    level: prevLevel + 1,
  };
}

/**
 * Streak update on completing a hive. A same-day replay keeps the streak; the
 * next consecutive day increments it; any longer gap resets to 1. Days are
 * whole-day indices (e.g. `Math.floor(Date.now() / MS_PER_DAY)`).
 */
export function nextStreak(prevStreak: number, lastActiveDay: number, today: number): number {
  if (today === lastActiveDay) return Math.max(1, prevStreak);
  if (today === lastActiveDay + 1) return prevStreak + 1;
  return 1;
}
