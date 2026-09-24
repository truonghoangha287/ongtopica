import { describe, it, expect } from 'vitest';
import {
  deriveSteps,
  wholeOf,
  roleOf,
  operandsFor,
  applyOperands,
  equationOf,
  storyKindOf,
  isStepCorrect,
} from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXForm, FindXLevel, FindXProblem } from '@/math/types/find-x.types';

/** A problem of each form, all solvable inside 0..20. */
const BY_FORM: Record<FindXForm, FindXProblem> = {
  'x+a=b': { id: 'p1', form: 'x+a=b', a: 6, b: 14, x: 8 },
  'a+x=b': { id: 'p2', form: 'a+x=b', a: 6, b: 14, x: 8 },
  'x-a=b': { id: 'p3', form: 'x-a=b', a: 8, b: 5, x: 13 },
  'a-x=b': { id: 'p4', form: 'a-x=b', a: 20, b: 12, x: 8 },
};

const ALL_LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];

describe('find-x step derivation', () => {
  it('names the whole correctly for every form', () => {
    expect(wholeOf(BY_FORM['x+a=b'])).toBe(14);
    expect(wholeOf(BY_FORM['a+x=b'])).toBe(14);
    expect(wholeOf(BY_FORM['a-x=b'])).toBe(20);
    // In `x − a = b` the unknown IS the whole.
    expect(wholeOf(BY_FORM['x-a=b'])).toBe(13);
  });

  it('marks x as the whole only in the x-minus form', () => {
    expect(roleOf('x+a=b')).toBe('part');
    expect(roleOf('a+x=b')).toBe('part');
    expect(roleOf('a-x=b')).toBe('part');
    expect(roleOf('x-a=b')).toBe('whole');
  });

  it('derives operands that actually recompute x', () => {
    for (const form of FINDX_FORMS) {
      const p = BY_FORM[form];
      expect(applyOperands(operandsFor(p)), form).toBe(p.x);
    }
  });

  it('puts the larger number first in every subtraction', () => {
    for (const form of FINDX_FORMS) {
      const o = operandsFor(BY_FORM[form]);
      if (o.op === '−') expect(o.left, form).toBeGreaterThanOrEqual(o.right);
    }
  });

  it('uses U+2212 for minus, never a hyphen', () => {
    for (const form of FINDX_FORMS) {
      const p = BY_FORM[form];
      expect(equationOf(p, 'x')).not.toContain('-');
      const o = operandsFor(p);
      expect(o.op === '+' || o.op === '−').toBe(true);
    }
  });

  it('writes the equation back with the answer substituted', () => {
    expect(equationOf(BY_FORM['x+a=b'], '8')).toBe('8 + 6 = 14');
    expect(equationOf(BY_FORM['a+x=b'], '8')).toBe('6 + 8 = 14');
    expect(equationOf(BY_FORM['x-a=b'], '13')).toBe('13 − 8 = 5');
    expect(equationOf(BY_FORM['a-x=b'], '8')).toBe('20 − 8 = 12');
  });

  it('refuses a story for the form whose whole is the unknown', () => {
    expect(storyKindOf('x+a=b')).toBe('plus');
    expect(storyKindOf('a+x=b')).toBe('plus');
    expect(storyKindOf('a-x=b')).toBe('minus');
    expect(storyKindOf('x-a=b')).toBeNull();
  });

  it('gives every level exactly one correct option per step', () => {
    for (const form of FINDX_FORMS) {
      for (const level of ALL_LEVELS) {
        for (const step of deriveSteps(BY_FORM[form], level)) {
          const right = step.options.filter((o) => o.correct);
          expect(right.length, `${form}/${level}/${step.kind}`).toBe(1);
        }
      }
    }
  });

  it('gives every option a reason and at least two options per choice step', () => {
    for (const form of FINDX_FORMS) {
      for (const step of deriveSteps(BY_FORM[form], 'guided')) {
        if (step.input === 'choice') expect(step.options.length, step.kind).toBeGreaterThanOrEqual(2);
        for (const o of step.options) {
          expect(o.whyKey, `${form}/${step.kind}`).toBeTruthy();
          expect(Boolean(o.labelKey) !== Boolean(o.label), `${form}/${step.kind}`).toBe(true);
        }
      }
    }
  });

  it('never repeats an option label inside a step', () => {
    for (const form of FINDX_FORMS) {
      for (const step of deriveSteps(BY_FORM[form], 'guided')) {
        const labels = step.options.map((o) => o.labelKey ?? o.label);
        expect(new Set(labels).size, `${form}/${step.kind}`).toBe(labels.length);
      }
    }
  });

  it('asks the right steps for each level, and always ends with check', () => {
    const p = BY_FORM['x+a=b'];
    expect(deriveSteps(p, 'guided').map((s) => s.kind)).toEqual([
      'role', 'operation', 'operands', 'compute', 'check',
    ]);
    expect(deriveSteps(p, 'short').map((s) => s.kind)).toEqual(['operands', 'compute', 'check']);
    expect(deriveSteps(p, 'solo').map((s) => s.kind)).toEqual(['compute', 'check']);
  });

  it('prepends the read step only on story problems, and only when guided', () => {
    const story: FindXProblem = { ...BY_FORM['x+a=b'], id: 'p5', story: 'birds' };
    expect(deriveSteps(story, 'guided')[0].kind).toBe('read');
    expect(deriveSteps(story, 'short')[0].kind).toBe('operands');
  });

  it('answers the compute step with tiles carrying x as the value', () => {
    const step = deriveSteps(BY_FORM['x-a=b'], 'solo')[0];
    expect(step.input).toBe('tiles');
    expect(step.options[0].value).toBe(13);
    expect(isStepCorrect(step, 13)).toBe(true);
    expect(isStepCorrect(step, 12)).toBe(false);
  });

  it('grades choice steps by option index', () => {
    const step = deriveSteps(BY_FORM['x+a=b'], 'guided')[0];
    const correctIndex = step.options.findIndex((o) => o.correct);
    expect(isStepCorrect(step, correctIndex)).toBe(true);
    expect(isStepCorrect(step, 1 - correctIndex)).toBe(false);
  });

  it('offers the working-restated distractor on the check step', () => {
    const steps = deriveSteps(BY_FORM['x+a=b'], 'guided');
    const check = steps[steps.length - 1];
    const labels = check.options.map((o) => o.label);
    expect(labels).toContain('8 + 6 = 14'); // substituted back into the problem
    expect(labels).toContain('14 − 6 = 8'); // the working, restated — the misconception
  });

  it('does not always put the correct option in the same slot', () => {
    const positions = new Set<number>();
    for (let i = 0; i < 12; i += 1) {
      const p: FindXProblem = { ...BY_FORM['x+a=b'], id: `vary-${i}` };
      positions.add(deriveSteps(p, 'guided')[0].options.findIndex((o) => o.correct));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
