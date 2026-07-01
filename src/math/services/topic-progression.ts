import { MATH_TOPIC_UNLOCK_THRESHOLD } from '@/shared/constants/game-constants';
import { isMastered } from '@/math/services/math-scorer';
import type { MathTopic, MathProgressMap } from '@/math/types/math.types';

/**
 * Fraction (0..1) of a topic's problems the child has mastered.
 * A topic with no problems returns 0 (cannot gate progression on emptiness).
 */
export function topicMasteryFraction(topic: MathTopic, progressMap: MathProgressMap): number {
  const total = topic.problems.length;
  if (total === 0) return 0;
  const mastered = topic.problems.filter((p) => {
    const row = progressMap[p.id];
    return row != null && isMastered(row);
  }).length;
  return mastered / total;
}

/**
 * Topic-unlock gate (Constitution III — no skipping levels).
 *
 * - The first topic in the ladder is always unlocked.
 * - Topic N unlocks only when topic N-1 has mastered at least
 *   MATH_TOPIC_UNLOCK_THRESHOLD of its problems.
 */
export function isTopicUnlocked(
  index: number,
  registry: MathTopic[],
  progressMap: MathProgressMap,
): boolean {
  if (index <= 0) return true;
  const prev = registry[index - 1];
  if (!prev) return false;
  return topicMasteryFraction(prev, progressMap) >= MATH_TOPIC_UNLOCK_THRESHOLD;
}

/** Count of mastered problems in a topic (for progress bars / labels). */
export function masteredCount(topic: MathTopic, progressMap: MathProgressMap): number {
  return topic.problems.filter((p) => {
    const row = progressMap[p.id];
    return row != null && isMastered(row);
  }).length;
}
