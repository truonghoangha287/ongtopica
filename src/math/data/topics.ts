import type { MathTopic, MathTopicId } from '@/math/types/math.types';
import { LOGIC_UNLOCK_STARS } from '@/math/constants/math-constants';

/**
 * The eight Skills-Hive cells. Order follows the Constitution's math ladder
 * (counting → addition/subtraction → multiply → fractions → shapes →
 * time/money → patterns → logic); the `left`/`top` fields place each hex in
 * the 354×327 honeycomb frame exactly as the design specifies.
 */
export const MATH_TOPICS: MathTopic[] = [
  { id: 'counting', icon: '🔢', nameKey: 'topics.counting', hue: 85, left: 0, top: 0 },
  { id: 'multiply', icon: '✖️', nameKey: 'topics.multiply', hue: 240, left: 118, top: 0 },
  { id: 'shapes', icon: '🔷', nameKey: 'topics.shapes', hue: 300, left: 236, top: 0 },
  { id: 'addsub', icon: '➕', nameKey: 'topics.addsub', hue: 66, left: 59, top: 98 },
  { id: 'fractions', icon: '🍕', nameKey: 'topics.fractions', hue: 35, left: 177, top: 98 },
  { id: 'timemoney', icon: '⏰', nameKey: 'topics.timemoney', hue: 195, left: 0, top: 196 },
  { id: 'patterns', icon: '🧩', nameKey: 'topics.patterns', hue: 70, left: 118, top: 196, olympiad: true },
  {
    id: 'logic',
    icon: '🔒',
    nameKey: 'topics.logic',
    hue: 90,
    left: 236,
    top: 196,
    locked: true,
    unlockStars: LOGIC_UNLOCK_STARS,
  },
];

const TOPIC_BY_ID = new Map(MATH_TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): MathTopic | undefined {
  return TOPIC_BY_ID.get(id as MathTopicId);
}
