import type { FindXProblem, FindXStep, FindXStepKind } from '@/math/types/find-x.types';
import {
  MINUS,
  applyOperands,
  equationOf,
  knownPartOf,
  operandsFor,
  operandsText,
  roleOf,
  wholeOf,
} from '@/math/services/find-x-algebra';
import type { FindXOperands } from '@/math/services/find-x-algebra';
import { dedupe, order } from '@/math/services/find-x-option-list';

/**
 * Construction of one step in the Find X chain — how each step's prompt,
 * options and distractors are built from a problem's algebra (`find-x-algebra.ts`).
 */

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

/**
 * Distractors are deduped by what they EVALUATE to, not by how they read.
 *
 * `x − a = b` resolves to an addition (`operandsFor`), and addition commutes, so
 * the swapped pair is the same sum: `5 + 8` and `8 + 5` both give x. Serving the
 * second as wrong buzzed a correct answer and told the child she had subtracted
 * backwards — on the form printed on the stage card, so nearly every session.
 * Comparing values drops any such twin, whatever a future form makes of it.
 *
 * Losing that twin left `x − a = b` with ONE distractor, and `b − a` is negative
 * whenever a > b — a quarter of those problems, where the only wrong answer was an
 * expression she cannot evaluate, so "which two numbers?" became a coin flip. When
 * fewer than two distractors survive, `bothWrong` is synthesised: the flipped
 * operator on the TRANSPOSED pair (`8 − 5` for `x − 8 = 5`). The right two numbers,
 * the operation the equation seems to show, the wrong way round — a real
 * misconception, and on this form it can only equal x if b is 0, which the
 * generator forbids. The other three forms keep both their distractors, so their
 * options are untouched.
 *
 * So at least two options always survive: `flipped` swaps `+`/`−` on the SAME
 * pair, which changes the result unless the right operand is 0. The trailing
 * `dedupe` is for the a === b problems (`x − 5 = 5`), where the synthesised
 * option reads exactly like `flipped`.
 */
function operandsStep(p: FindXProblem): FindXStep {
  const right = operandsFor(p);
  const x = applyOperands(right);
  const otherOp = right.op === '+' ? MINUS : '+';
  const swapped: FindXOperands = { op: right.op, left: right.right, right: right.left };
  const flipped: FindXOperands = { op: otherOp, left: right.left, right: right.right };
  const bothWrong: FindXOperands = { op: otherOp, left: right.right, right: right.left };
  const distractors: [FindXOperands, string][] = ([
    [swapped, 'findx.why.operandsSwapped'],
    [flipped, 'findx.why.operandsWrongOp'],
  ] as [FindXOperands, string][]).filter(([o]) => applyOperands(o) !== x);
  if (distractors.length < 2 && applyOperands(bothWrong) !== x) {
    distractors.push([bothWrong, 'findx.why.operandsWrongOp']);
  }
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
      ...distractors.map(([o, whyKey]) => ({ label: operandsText(o), correct: false, whyKey })),
    ]), `${p.id}:operands`),
  };
}

/**
 * `reverse` is the answer a child gets by running the RIGHT numbers through
 * the WRONG operation — flip `operandsFor`'s `op` and apply it to the same
 * two operands. It can never equal `p.x`: that would need an operand of 0,
 * which the generator forbids, so `computeMissKey`'s two branches never
 * collide. It may land past the tile strip's ceiling — fine, that branch
 * simply never fires for that problem.
 */
function computeStep(p: FindXProblem): FindXStep {
  const operands = operandsFor(p);
  const flipped = operands.op === '+' ? MINUS : '+';
  const reverse = applyOperands({ op: flipped, left: operands.left, right: operands.right });
  return {
    kind: 'compute',
    promptKey: 'findx.step.compute',
    vars: { expr: operandsText(operands), reverse },
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
