import { FINDX_FORMS } from '@/math/types/find-x.types';
import type {
  FindXLevel,
  FindXProblem,
  FindXStep,
  FindXStepKind,
} from '@/math/types/find-x.types';
import { BUILDERS } from '@/math/services/find-x-step-builders';
import {
  MINUS,
  applyOperands,
  equationOf,
  knownPartOf,
  operandsFor,
  operandsText,
  roleOf,
  storyKindOf,
  wholeOf,
} from '@/math/services/find-x-algebra';
import type { FindXOp, FindXOperands } from '@/math/services/find-x-algebra';

/**
 * Which decisions each stage asks for. `check` survives every level: it is the
 * transferable skill, and a stage that dropped it would teach that checking is
 * optional scaffolding rather than part of solving.
 */
const KINDS_BY_LEVEL: Record<FindXLevel, FindXStepKind[]> = {
  guided: ['read', 'role', 'operation', 'operands', 'compute', 'check'],
  short: ['operands', 'compute', 'check'],
  solo: ['compute', 'check'],
};

/**
 * Turning one problem into the chain of decisions a child walks to solve it.
 *
 * Steps are DERIVED, never authored. A bank of hand-written steps cannot be
 * verified by construction; this can — `applyOperands(operandsFor(p)) === p.x`
 * is an invariant a test pins down for every form, so an inconsistent step is
 * not representable.
 *
 * Pure: no React, no i18next. Copy is referenced by key and resolved by the view.
 */
export function deriveSteps(p: FindXProblem, level: FindXLevel): FindXStep[] {
  return KINDS_BY_LEVEL[level]
    .filter((kind) => kind !== 'read' || p.story !== undefined)
    .map((kind) => BUILDERS[kind](p));
}

/**
 * Whether a tapped value answers a step. Mirrors `quiz-scorer.isCorrect`: the
 * value is the tapped NUMBER for tile steps and an index into `options` for
 * every other step.
 */
export function isStepCorrect(step: FindXStep, value: number): boolean {
  if (step.input === 'tiles') return step.options.some((o) => o.correct && o.value === value);
  return step.options[value]?.correct === true;
}

/**
 * Which reason explains a wrong tap on a `tiles` step: the reverse-operation
 * result, one away from the answer, or — for anything else, including a
 * non-tile step — the generic miss. `reverse` lives on the compute step's own
 * `vars` (see `find-x-step-builders.ts`), so this stays a pure lookup.
 */
export function computeMissKey(step: FindXStep, value: number): string {
  if (step.input !== 'tiles') return 'findx.why.computeGeneric';
  if (value === step.vars.reverse) return 'findx.why.computeReverse';
  const correct = step.options[0]?.value;
  if (correct !== undefined && Math.abs(value - correct) === 1) return 'findx.why.computeOffByOne';
  return 'findx.why.computeGeneric';
}

export {
  FINDX_FORMS,
  MINUS,
  applyOperands,
  equationOf,
  knownPartOf,
  operandsFor,
  operandsText,
  roleOf,
  storyKindOf,
  wholeOf,
};
export type { FindXOp, FindXOperands };
