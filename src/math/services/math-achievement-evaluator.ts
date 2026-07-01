import { MATH_ACHIEVEMENT_IDS } from '@/shared/constants/game-constants';
import { isMastered } from '@/math/services/math-scorer';
import type { MathTopic, MathProgressMap } from '@/math/types/math.types';

/**
 * Pure trigger logic for math achievements (KISS — no runtime catalog).
 * Returns the ids newly earned this evaluation, excluding any already in earnedSet.
 *
 *   math_first_steps        — any problem has at least one correct answer
 *   topic_master:<topicId>  — every problem in the topic is mastered
 */
export function evaluateMathAchievements(
  progressMap: MathProgressMap,
  registry: MathTopic[],
  earnedSet: Set<string>,
): string[] {
  const newlyEarned: string[] = [];
  const rows = Object.values(progressMap);

  // First steps: at least one answered correctly at least once.
  const anyCorrect = rows.some((r) => r.consecutiveCorrect > 0 || r.mastered);
  if (anyCorrect && !earnedSet.has(MATH_ACHIEVEMENT_IDS.FIRST_STEPS)) {
    newlyEarned.push(MATH_ACHIEVEMENT_IDS.FIRST_STEPS);
  }

  // Topic master: all problems in the topic mastered.
  for (const topic of registry) {
    if (topic.problems.length === 0) continue;
    const allMastered = topic.problems.every((p) => {
      const row = progressMap[p.id];
      return row != null && isMastered(row);
    });
    const id = `${MATH_ACHIEVEMENT_IDS.TOPIC_MASTER}:${topic.id}`;
    if (allMastered && !earnedSet.has(id)) newlyEarned.push(id);
  }

  return newlyEarned;
}
