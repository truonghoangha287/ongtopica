import type { FindXOption, FindXProblem, FindXStep, FindXStepKind } from '@/math/types/find-x.types';
import {
  MINUS,
  equationOf,
  knownPartOf,
  operandsFor,
  operandsText,
  roleOf,
  wholeOf,
} from '@/math/services/find-x-algebra';
import type { FindXOperands } from '@/math/services/find-x-algebra';

/**
 * Construction of one step in the Find X chain — how each step's prompt,
 * options and distractors are built from a problem's algebra (`find-x-algebra.ts`).
 */

/**
 * Rotate the options by a hash of the problem and step, so the right answer is
 * not always in the same slot. Deterministic — the same problem always renders
 * the same way, which is what lets a test assert on it.
 */
function order(options: FindXOption[], seed: string): FindXOption[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const shift = Math.abs(h) % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

/** Drop options whose visible label repeats one already kept. */
function dedupe(options: FindXOption[]): FindXOption[] {
  const seen = new Set<string>();
  return options.filter((o) => {
    const key = o.labelKey ?? o.label ?? '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readStep(p: FindXProblem): FindXStep {
  const whole = wholeOf(p);
  const known = knownPartOf(p);
  return {
    kind: 'read',
    promptKey: 'findx.step.read',
    vars: {},
    input: 'choice',
    options: order([
      { label: String(whole), correct: true, whyKey: 'findx.why.readRight', vars: { whole } },
      { label: String(known), correct: false, whyKey: 'findx.why.readWrong', vars: { whole } },
    ], `${p.id}:read`),
  };
}

function roleStep(p: FindXProblem): FindXStep {
  const isWhole = roleOf(p.form) === 'whole';
  const vars = { whole: wholeOf(p), known: knownPartOf(p), a: p.a, b: p.b };
  return {
    kind: 'role',
    promptKey: 'findx.step.role',
    vars,
    input: 'choice',
    options: order([
      {
        labelKey: 'findx.opt.part',
        correct: !isWhole,
        whyKey: isWhole ? 'findx.why.roleWrongWhole' : 'findx.why.rolePart',
        vars,
      },
      {
        labelKey: 'findx.opt.whole',
        correct: isWhole,
        whyKey: isWhole ? 'findx.why.roleWhole' : 'findx.why.roleWrongPart',
        vars,
      },
    ], `${p.id}:role`),
  };
}

function operationStep(p: FindXProblem): FindXStep {
  const needsAdd = roleOf(p.form) === 'whole';
  return {
    kind: 'operation',
    promptKey: needsAdd ? 'findx.step.operationWhole' : 'findx.step.operationPart',
    vars: {},
    input: 'choice',
    options: order([
      {
        labelKey: 'findx.opt.sub',
        correct: !needsAdd,
        whyKey: needsAdd ? 'findx.why.opWrongSub' : 'findx.why.opSub',
      },
      {
        labelKey: 'findx.opt.add',
        correct: needsAdd,
        whyKey: needsAdd ? 'findx.why.opAdd' : 'findx.why.opWrongAdd',
      },
    ], `${p.id}:operation`),
  };
}

function operandsStep(p: FindXProblem): FindXStep {
  const right = operandsFor(p);
  const swapped: FindXOperands = { op: right.op, left: right.right, right: right.left };
  const flipped: FindXOperands = { op: right.op === '+' ? MINUS : '+', left: right.left, right: right.right };
  return {
    kind: 'operands',
    promptKey: 'findx.step.operands',
    vars: {},
    input: 'choice',
    options: order(dedupe([
      {
        label: operandsText(right),
        correct: true,
        whyKey: 'findx.why.operandsRight',
        vars: { left: right.left, op: right.op, right: right.right },
      },
      { label: operandsText(swapped), correct: false, whyKey: 'findx.why.operandsSwapped' },
      { label: operandsText(flipped), correct: false, whyKey: 'findx.why.operandsWrongOp' },
    ]), `${p.id}:operands`),
  };
}

function computeStep(p: FindXProblem): FindXStep {
  return {
    kind: 'compute',
    promptKey: 'findx.step.compute',
    vars: { expr: operandsText(operandsFor(p)) },
    input: 'tiles',
    options: [
      { label: String(p.x), correct: true, whyKey: 'findx.why.computeRight', vars: { x: p.x }, value: p.x },
    ],
  };
}

/**
 * The check step's distractor is the child's own WORKING restated
 * (`14 − 6 = 8`), not a false sum. It is arithmetically true, which is exactly
 * why it is worth teaching against: checking means substituting back into the
 * problem, not re-reading the step that produced the answer.
 */
function checkStep(p: FindXProblem): FindXStep {
  const working = operandsFor(p);
  return {
    kind: 'check',
    promptKey: 'findx.step.check',
    vars: { x: p.x },
    input: 'choice',
    options: order(dedupe([
      { label: equationOf(p, String(p.x)), correct: true, whyKey: 'findx.why.checkRight' },
      { label: `${operandsText(working)} = ${p.x}`, correct: false, whyKey: 'findx.why.checkWorking' },
    ]), `${p.id}:check`),
  };
}

export const BUILDERS: Record<FindXStepKind, (p: FindXProblem) => FindXStep> = {
  read: readStep,
  role: roleStep,
  operation: operationStep,
  operands: operandsStep,
  compute: computeStep,
  check: checkStep,
};
