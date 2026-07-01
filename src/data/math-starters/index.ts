import type { MathTopic, MathProblem } from '@/math/types/math.types';
import numbersData from './numbers.json';
import countingData from './counting.json';
import additionData from './addition.json';
import subtractionData from './subtraction.json';
import patternsData from './patterns.json';
import shapesData from './shapes.json';
import logicData from './logic.json';

/**
 * Fixed topic order = the difficulty ladder mandated by Constitution III:
 * number recognition → counting → addition → subtraction → patterns → shapes → logic.
 * The array index IS the ladder position used for unlock gating.
 */
export const mathTopicRegistry: MathTopic[] = [
  { id: 'numbers', problems: numbersData as MathProblem[] },
  { id: 'counting', problems: countingData as MathProblem[] },
  { id: 'addition', problems: additionData as MathProblem[] },
  { id: 'subtraction', problems: subtractionData as MathProblem[] },
  { id: 'patterns', problems: patternsData as MathProblem[] },
  { id: 'shapes', problems: shapesData as MathProblem[] },
  { id: 'logic', problems: logicData as MathProblem[] },
];

export function getMathTopic(id: string): MathTopic | undefined {
  return mathTopicRegistry.find((tp) => tp.id === id);
}

/** Ladder position of a topic (-1 if unknown). */
export function topicIndex(id: string): number {
  return mathTopicRegistry.findIndex((tp) => tp.id === id);
}
