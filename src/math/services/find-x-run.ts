import { answerStep } from '@/math/services/find-x-run-grading';
import { nextProblem, revealChain } from '@/math/services/find-x-run-queue';
import { initFindXRun } from '@/math/services/find-x-run-state';
import type { FindXAction, FindXRunState } from '@/math/services/find-x-run-state';

/**
 * The play loop for a Find X stage, as pure state plus a reducer.
 *
 * This module is the seam every consumer imports: the state shape lives in
 * `find-x-run-state`, grading a tap in `find-x-run-grading`, and advancing the
 * queue in `find-x-run-queue`. Both halves depend on the state module and on
 * nothing else of the run, so the import graph stays a DAG.
 */

export { initFindXRun };
export type { FindXRunState, FindXAction };
export type { FindXStats, FindXTrailEntry } from '@/math/types/find-x.types';

export function findXReducer(state: FindXRunState, action: FindXAction): FindXRunState {
  switch (action.type) {
    case 'answer':
      return answerStep(state, action.value);
    case 'next':
      return nextProblem(state);
    case 'reveal':
      return revealChain(state);
    case 'load':
      return initFindXRun(action.problems, action.level);
  }
}
