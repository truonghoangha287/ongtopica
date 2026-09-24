import { describe, it, expect } from 'vitest';
import { deriveSteps } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import { FINDX_VALUE_MAX } from '@/math/constants/math-constants';
import type { FindXForm, FindXProblem } from '@/math/types/find-x.types';

/**
 * The options of the `operands` step — "vậy lấy số nào với số nào?", the decision
 * the child is weakest at and the only one whose distractors are computed from
 * the problem rather than fixed.
 */

/** A problem of each form, matching `find-x-steps.test.ts`. */
const BY_FORM: Record<FindXForm, FindXProblem> = {
  'x+a=b': { id: 'p1', form: 'x+a=b', a: 6, b: 14, x: 8 },
  'a+x=b': { id: 'p2', form: 'a+x=b', a: 6, b: 14, x: 8 },
  'x-a=b': { id: 'p3', form: 'x-a=b', a: 8, b: 5, x: 13 },
  'a-x=b': { id: 'p4', form: 'a-x=b', a: 20, b: 12, x: 8 },
};

/** What a rendered option computes to — parsed from the label the child taps. */
function evaluateLabel(label: string): number {
  const [left, op, right] = label.split(' ');
  return op === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
}

const RANGE = Array.from({ length: FINDX_VALUE_MAX }, (_, i) => i + 1);

/**
 * Every problem the generator can build, so the sweep is exhaustive rather than a
 * sample — `find-x-generator.build`'s rules: a, b and x all inside 1..MAX, and x
 * never equal to a number already on screen.
 */
function everyProblem(): FindXProblem[] {
  return FINDX_FORMS.flatMap((form) => RANGE.flatMap((a) => RANGE.flatMap((b) => {
    const x = form === 'x-a=b' ? a + b : form === 'a-x=b' ? a - b : b - a;
    const ok = x >= 1 && x <= FINDX_VALUE_MAX && x !== a && x !== b;
    return ok ? [{ id: `sweep-${form}-${a}-${b}`, form, a, b, x }] : [];
  })));
}

/** The `short` level opens on `operands`, so this is that step for any problem. */
const operandsStep = (p: FindXProblem) => deriveSteps(p, 'short')[0];

describe('find-x operands options', () => {
  /**
   * THE invariant, not three named labels: an option that computes to x IS a
   * correct answer, whatever reason it carries. `x − a = b` resolves to an
   * ADDITION, where the swapped pair is the same sum — tapping `8 + 5` on
   * `x − 8 = 5` used to buzz and tell her she had subtracted backwards.
   */
  it('never offers a wrong option that computes to x', () => {
    for (const p of everyProblem()) {
      const step = operandsStep(p);
      expect(step.kind, p.id).toBe('operands');
      expect(step.options.length, p.id).toBeGreaterThanOrEqual(2);
      for (const o of step.options) {
        if (o.correct) continue;
        expect(evaluateLabel(o.label!), `${p.id}: "${o.label}" = x = ${p.x}`).not.toBe(p.x);
      }
    }
  });

  it('keeps the swapped distractor wherever transposing really is wrong', () => {
    // Subtraction does not commute, so `6 − 14` stays — dropping the twins must
    // not be mistaken for dropping the distractor.
    const labels = (f: FindXForm) => operandsStep(BY_FORM[f]).options.map((o) => o.label);
    expect(labels('x+a=b')).toContain('6 − 14');
    expect(labels('a+x=b')).toContain('6 − 14');
    expect(labels('a-x=b')).toContain('12 − 20');
    // `x − a = b` is the commuting one: the twin goes, the wrong-op option stays.
    expect(labels('x-a=b')).toEqual(expect.not.arrayContaining(['8 + 5']));
    expect(labels('x-a=b').sort()).toEqual(['5 + 8', '5 − 8']);
  });
});
