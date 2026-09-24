import { FINDX_FORMS } from '@/math/types/find-x.types';
import type {
  FindXForm,
  FindXLevel,
  FindXOption,
  FindXProblem,
  FindXStep,
  FindXStepKind,
  FindXStoryKind,
} from '@/math/types/find-x.types';

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

/** U+2212. The bank and `equation-parts.ts` both use it; a hyphen breaks matching. */
const MINUS = '−' as const;

export type FindXOp = '+' | typeof MINUS;
export interface FindXOperands { op: FindXOp; left: number; right: number }

/** The total the two parts add up to. In `x − a = b` that total is x itself. */
export function wholeOf(p: FindXProblem): number {
  switch (p.form) {
    case 'x+a=b':
    case 'a+x=b':
      return p.b;
    case 'a-x=b':
      return p.a;
    case 'x-a=b':
      return p.x;
  }
}

/** The visible part — the one that is not x and not the whole. */
export function knownPartOf(p: FindXProblem): number {
  return p.form === 'a-x=b' ? p.b : p.a;
}

/** Whether the unknown is a part or the whole. Only the x-minus form hides the whole. */
export function roleOf(form: FindXForm): 'part' | 'whole' {
  return form === 'x-a=b' ? 'whole' : 'part';
}

/**
 * The two numbers, in the order they must be written. Order is the whole point:
 * a child who knows to subtract still writes `6 − 14` half the time.
 */
export function operandsFor(p: FindXProblem): FindXOperands {
  switch (p.form) {
    case 'x+a=b':
    case 'a+x=b':
      return { op: MINUS, left: p.b, right: p.a };
    case 'x-a=b':
      return { op: '+', left: p.b, right: p.a };
    case 'a-x=b':
      return { op: MINUS, left: p.a, right: p.b };
  }
}

export function applyOperands(o: FindXOperands): number {
  return o.op === '+' ? o.left + o.right : o.left - o.right;
}

/** `left op right`, as it is shown inside a prompt or on an option. */
export function operandsText(o: FindXOperands): string {
  return `${o.left} ${o.op} ${o.right}`;
}

/** The problem's own equation, with `xLabel` standing where the unknown is. */
export function equationOf(p: FindXProblem, xLabel: string): string {
  switch (p.form) {
    case 'x+a=b':
      return `${xLabel} + ${p.a} = ${p.b}`;
    case 'a+x=b':
      return `${p.a} + ${xLabel} = ${p.b}`;
    case 'x-a=b':
      return `${xLabel} ${MINUS} ${p.a} = ${p.b}`;
    case 'a-x=b':
      return `${p.a} ${MINUS} ${xLabel} = ${p.b}`;
  }
}

/**
 * Which story flavour a form can wear, or `null` when it can wear none.
 *
 * `x − a = b` hides the whole, so "đâu là cả tổng?" would have no tappable
 * answer in the sentence. The generator refuses that combination.
 */
export function storyKindOf(form: FindXForm): FindXStoryKind | null {
  switch (form) {
    case 'x+a=b':
    case 'a+x=b':
      return 'plus';
    case 'a-x=b':
      return 'minus';
    case 'x-a=b':
      return null;
  }
}

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

const BUILDERS: Record<FindXStepKind, (p: FindXProblem) => FindXStep> = {
  read: readStep,
  role: roleStep,
  operation: operationStep,
  operands: operandsStep,
  compute: computeStep,
  check: checkStep,
};

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

export { FINDX_FORMS, MINUS };
