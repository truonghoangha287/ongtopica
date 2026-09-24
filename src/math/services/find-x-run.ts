import { deriveSteps, isStepCorrect } from '@/math/services/find-x-steps';
import type {
  FindXLevel,
  FindXProblem,
  FindXStats,
  FindXStep,
  FindXStepKind,
  FindXTrailEntry,
} from '@/math/types/find-x.types';

export type { FindXStats, FindXTrailEntry } from '@/math/types/find-x.types';

/**
 * The play loop for a Find X stage, as pure state plus a reducer.
 *
 * Deliberately NOT `math-quiz-store`: that store holds one selection and one
 * graded flag per question, while a problem here holds several graded
 * sub-answers, a growing trail and per-step statistics. Bending it would
 * complicate the path every hive and lab question already travels.
 *
 * No React import, so every grading rule is testable without rendering.
 */

const KINDS: FindXStepKind[] = ['read', 'role', 'operation', 'operands', 'compute', 'check'];

const zero = (): Record<FindXStepKind, number> =>
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
  /** Values already tried and rejected on the current step. */
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
  firstPass: number;
}

export type FindXAction =
  | { type: 'answer'; value: number }
  | { type: 'next' }
  | { type: 'reveal' };

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
    stats: { asked: zero(), missed: zero(), reveals: 0 },
    requeuedIds: [],
    originalTotal: problems.length,
    mastered: 0,
    firstPass: 0,
  };
}

/** The trail entry for the option just accepted. */
function entryFor(step: FindXStep, value: number): FindXTrailEntry {
  const option = step.input === 'tiles'
    ? step.options.find((o) => o.correct)!
    : step.options[value];
  return {
    kind: step.kind,
    label: option.label,
    labelKey: option.labelKey,
    vars: option.vars,
    whyKey: option.whyKey,
  };
}

function answer(s: FindXRunState, value: number): FindXRunState {
  if (s.done || s.problemComplete) return s;
  const step = s.steps[s.stepIndex];
  if (!step) return s;
  if (s.wrongValues.includes(value)) return s;

  if (!isStepCorrect(step, value)) {
    return {
      ...s,
      wrongValues: [...s.wrongValues, value],
      wrongThisProblem: true,
      stats: { ...s.stats, missed: { ...s.stats.missed, [step.kind]: s.stats.missed[step.kind] + 1 } },
    };
  }

  const stepIndex = s.stepIndex + 1;
  const complete = stepIndex >= s.steps.length;
  const clean = !s.wrongThisProblem && !s.revealed;
  return {
    ...s,
    stepIndex,
    wrongValues: [],
    trail: [...s.trail, entryFor(step, value)],
    problemComplete: complete,
    stats: { ...s.stats, asked: { ...s.stats.asked, [step.kind]: s.stats.asked[step.kind] + 1 } },
    mastered: complete ? s.mastered + 1 : s.mastered,
    firstPass: complete && clean ? s.firstPass + 1 : s.firstPass,
  };
}

/**
 * Move to the next problem, re-asking a missed one once at the end of the run.
 * A second miss does not requeue again, so the queue can never loop — the same
 * guarantee `quiz-scorer.shouldRequeue` gives the lab.
 */
function next(s: FindXRunState): FindXRunState {
  if (s.done || !s.problemComplete) return s;
  const current = s.problems[s.pIndex];
  // `firstPass` and `!requeuedIds.includes` are each independently sufficient to
  // stop a double requeue — deliberately redundant, mirroring
  // `quiz-scorer.shouldRequeue`. `firstPass` holds only because requeued
  // problems are appended past `originalTotal` and `pIndex` only moves forward;
  // `requeuedIds` holds regardless of insertion order. No test can tell them
  // apart, so deleting either looks safe and isn't — re-check `firstPass` if
  // requeued problems are ever inserted anywhere but the end.
  const firstPass = s.pIndex < s.originalTotal;
  const requeue = (s.wrongThisProblem || s.revealed)
    && firstPass
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
 * Open the full chain for the current problem. Costs nothing but the first pass:
 * the goal is that she stops reaching for it, and the run summary reports how
 * often she did.
 */
function reveal(s: FindXRunState): FindXRunState {
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

export function findXReducer(state: FindXRunState, action: FindXAction): FindXRunState {
  switch (action.type) {
    case 'answer':
      return answer(state, action.value);
    case 'next':
      return next(state);
    case 'reveal':
      return reveal(state);
  }
}
