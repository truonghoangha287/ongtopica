import { findXReducer } from '@/math/services/find-x-run';
import type { FindXRunState } from '@/math/services/find-x-run';
import type { FindXProblem } from '@/math/types/find-x.types';

/**
 * Fixtures and the play helpers shared by the two reducer suites —
 * `unit/find-x-run.test.ts` (the queue: advancing, requeueing, revealing) and
 * `unit/find-x-stats.test.ts` (the counters the parent's line is built from).
 * Shared rather than copied, so a change to how a problem is played cannot make
 * the two suites disagree about what "playing it" means.
 */

export const P1: FindXProblem = { id: 'r1', form: 'x+a=b', a: 6, b: 14, x: 8 };
export const P2: FindXProblem = { id: 'r2', form: 'a-x=b', a: 20, b: 12, x: 8 };

/** A full guided-length run, for the counters that only diverge across a re-ask. */
export const SIX: FindXProblem[] = [
  { id: 'q1', form: 'x+a=b', a: 6, b: 14, x: 8 },
  { id: 'q2', form: 'x+a=b', a: 5, b: 12, x: 7 },
  { id: 'q3', form: 'a+x=b', a: 4, b: 11, x: 7 },
  { id: 'q4', form: 'a-x=b', a: 20, b: 12, x: 8 },
  { id: 'q5', form: 'a-x=b', a: 18, b: 11, x: 7 },
  { id: 'q6', form: 'x-a=b', a: 8, b: 5, x: 13 },
];

/** Index of the correct option on the current step (or x, on a tile step). */
export function rightValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value!;
  return step.options.findIndex((o) => o.correct);
}

/** Index of a wrong option on the current step. */
export function wrongValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value! + 1;
  return step.options.findIndex((o) => !o.correct);
}

/** Answer every remaining step of the current problem correctly. */
export function solveProblem(start: FindXRunState): FindXRunState {
  let s = start;
  while (!s.problemComplete && !s.done) {
    s = findXReducer(s, { type: 'answer', value: rightValue(s) });
  }
  return s;
}

/** Play the current problem to the end and advance, optionally missing once first. */
export function play(s: FindXRunState, miss: boolean): FindXRunState {
  const started = miss ? findXReducer(s, { type: 'answer', value: wrongValue(s) }) : s;
  return findXReducer(solveProblem(started), { type: 'next' });
}
