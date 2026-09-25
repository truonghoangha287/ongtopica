import { deriveSteps } from '@/math/services/find-x-steps';
import type { FindXRunState } from '@/math/services/find-x-run-state';

/**
 * Moving the run forward: which problem comes next, which missed one comes back,
 * and swapping in the full chain when she asks to be shown how. Nothing here
 * grades a tap — see `find-x-run-grading`, which this module never imports.
 */

/**
 * Move to the next problem, re-asking a missed one once at the end of the run. A
 * second miss does not requeue again, so the queue can never loop — the same guarantee
 * `quiz-scorer.shouldRequeue` gives the lab.
 */
export function nextProblem(s: FindXRunState): FindXRunState {
  if (s.done || !s.problemComplete) return s;
  const current = s.problems[s.pIndex];
  // `onFirstPass` and `!requeuedIds.includes` are each independently sufficient to stop a
  // double requeue — deliberately redundant, mirroring `quiz-scorer.shouldRequeue`.
  // `onFirstPass` holds only because requeued problems are appended past `originalTotal`
  // and `pIndex` only moves forward; `requeuedIds` holds regardless of insertion order.
  // No test can tell them apart, so deleting either looks safe and isn't — re-check
  // `onFirstPass` if requeued problems are ever inserted anywhere but the end.
  const onFirstPass = s.pIndex < s.originalTotal;
  const requeue = (s.wrongThisProblem || s.revealed)
    && onFirstPass
    && !s.requeuedIds.includes(current.id);

  const problems = requeue ? [...s.problems, current] : s.problems;
  const requeuedIds = requeue ? [...s.requeuedIds, current.id] : s.requeuedIds;
  const pIndex = s.pIndex + 1;

  if (pIndex >= problems.length) {
    return { ...s, problems, requeuedIds, pIndex, done: true, steps: [], trail: [] };
  }
  return {
    ...s,
    problems,
    requeuedIds,
    pIndex,
    steps: deriveSteps(problems[pIndex], s.level),
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    wrongThisProblem: false,
    revealed: false,
    problemComplete: false,
  };
}

/**
 * Open the full chain for the current problem. Costs nothing but the first pass: the
 * goal is that she stops reaching for it, and the run summary reports how often she did.
 *
 * Clearing `wrongValues` abandons the attempt in progress — which is exactly why
 * `find-x-run-grading` books a miss only when a step completes. Anything booked
 * here would have no completion to be measured against.
 */
export function revealChain(s: FindXRunState): FindXRunState {
  if (s.done || s.revealed || s.problemComplete) return s;
  return {
    ...s,
    revealed: true,
    steps: deriveSteps(s.problems[s.pIndex], 'guided'),
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    stats: { ...s.stats, reveals: s.stats.reveals + 1 },
  };
}
