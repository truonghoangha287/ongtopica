import { deriveSteps } from '@/math/services/find-x-steps';
import type {
  FindXLevel,
  FindXProblem,
  FindXStats,
  FindXStep,
  FindXStepKind,
  FindXTrailEntry,
} from '@/math/types/find-x.types';

/**
 * The shape of a Find X run and the value it starts from.
 *
 * The leaf of the three run modules: `find-x-run-grading` (per-step grading and
 * statistics) and `find-x-run-queue` (advancing problems, requeues, reveals)
 * both import this and neither imports the other, so the run is a strict DAG —
 * an earlier split in this feature grew a cycle by letting two halves reach
 * back into each other.
 *
 * Deliberately NOT `math-quiz-store`: that store holds one selection and one
 * graded flag per question, while a problem here holds several graded
 * sub-answers, a growing trail and per-step statistics. Bending it would
 * complicate the path every hive and lab question already travels. No React
 * import, so every grading rule is testable without rendering.
 */

const KINDS: FindXStepKind[] = ['read', 'role', 'operation', 'operands', 'compute', 'check'];

export const zeroPerKind = (): Record<FindXStepKind, number> =>
  KINDS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<FindXStepKind, number>);

export interface FindXRunState {
  level: FindXLevel;
  /** First-pass problems, plus any requeued misses appended to the end. */
  problems: FindXProblem[];
  pIndex: number;
  /** Steps of the current problem — recomputed when `reveal` widens them. */
  steps: FindXStep[];
  stepIndex: number;
  trail: FindXTrailEntry[];
  /**
   * Values already tried and rejected on THIS attempt at the current step. It
   * doubles as the "this attempt is dirty" flag `answer` books `missed` from:
   * it is cleared on every step change, on a reveal and on a new problem, so it
   * is true exactly while the attempt in progress has already been missed.
   */
  wrongValues: number[];
  wrongThisProblem: boolean;
  revealed: boolean;
  /** Every step answered; the view shows "Tiếp tục" rather than auto-advancing. */
  problemComplete: boolean;
  done: boolean;
  stats: FindXStats;
  requeuedIds: string[];
  /** First-pass length — the denominator for stars, so a re-ask cannot dilute them. */
  originalTotal: number;
  mastered: number;
  /**
   * Problems finished with no wrong tap and no reveal — INCLUDING clean re-asks,
   * by design and not by omission. Stars and accuracy are computed from it, which
   * matches the sibling pillar, where `NumberLabQuizPage` scores
   * `correct + recovered`: a child who fixes her mistake on the second look has
   * earned the star. So this is NOT "cleared on the first pass"; do not add a
   * `pIndex < originalTotal` guard, and do not derive recoveries from it —
   * `mastered − masteredClean` is R+D, not R−D. `recovered` below is the counter.
   */
  masteredClean: number;
  /** Missed on the first pass, then finished clean on the re-ask. Counted, not derived. */
  recovered: number;
}

export type FindXAction =
  | { type: 'answer'; value: number }
  | { type: 'next' }
  | { type: 'reveal' }
  | { type: 'load'; problems: FindXProblem[]; level: FindXLevel };

export function initFindXRun(problems: FindXProblem[], level: FindXLevel): FindXRunState {
  return {
    level,
    problems,
    pIndex: 0,
    steps: problems.length > 0 ? deriveSteps(problems[0], level) : [],
    stepIndex: 0,
    trail: [],
    wrongValues: [],
    wrongThisProblem: false,
    revealed: false,
    problemComplete: problems.length === 0,
    done: problems.length === 0,
    stats: { asked: zeroPerKind(), missed: zeroPerKind(), reveals: 0 },
    requeuedIds: [],
    originalTotal: problems.length,
    mastered: 0,
    masteredClean: 0,
    recovered: 0,
  };
}
