import { MATH_SESSION_SIZE } from '@/shared/constants/game-constants';
import { isMastered } from '@/math/services/math-scorer';
import type { MathTopic, MathProblem, MathProgressMap } from '@/math/types/math.types';

/**
 * Compose a practice session for one topic. See
 * specs/004-math-foundations/contracts/math-session-composer.contract.md.
 *
 * Selection priority (review struggles first, then learn new, then top up):
 *   1. unmastered problems with prior misses   (totalIncorrect > 0)
 *   2. unmastered problems never missed         (new or in-progress)
 *   3. already-mastered problems                (only to fill a small topic)
 *
 * Membership is deterministic given the inputs; only the final order is shuffled
 * so there is no positional bias. Never pads with another topic's content.
 */
export function composeMathSession(
  topic: MathTopic,
  progressMap: MathProgressMap,
  options: { sessionSize?: number } = {},
): MathProblem[] {
  const limit = options.sessionSize ?? MATH_SESSION_SIZE;

  const missed: MathProblem[] = [];
  const fresh: MathProblem[] = [];
  const mastered: MathProblem[] = [];

  for (const problem of topic.problems) {
    const row = progressMap[problem.id];
    if (row && isMastered(row)) {
      mastered.push(problem);
    } else if (row && row.totalIncorrect > 0) {
      missed.push(problem);
    } else {
      fresh.push(problem);
    }
  }

  const ordered = [...missed, ...fresh, ...mastered].slice(0, limit);
  return shuffle(ordered);
}

/** Fisher–Yates shuffle (order only — does not change which problems are chosen). */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
