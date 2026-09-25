import { describe, it, expect } from 'vitest';
import { composeFindXRun, firstUnused } from '@/math/services/find-x-generator';
import { applyOperands, operandsFor, storyKindOf } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXForm, FindXLevel } from '@/math/types/find-x.types';
import { FINDX_RUN_SIZES, FINDX_VALUE_MAX } from '@/math/constants/math-constants';

const LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];

/** Same key format `find-x-generator.ts`'s private `shapeOf` uses. */
const shapeKey = (form: FindXForm, a: number, b: number) => `${form}|${a}|${b}`;

/**
 * `x` for a given form — the same arithmetic as the generator's private
 * `build`, recomputed independently here (rather than by calling into the
 * generator) so this enumeration is real ground truth a broken `firstUnused`
 * can be checked against, not a reflection of whatever `firstUnused` already
 * does.
 */
function xFor(form: FindXForm, a: number, b: number): number {
  switch (form) {
    case 'x+a=b':
    case 'a+x=b':
      return b - a;
    case 'x-a=b':
      return a + b;
    case 'a-x=b':
      return a - b;
  }
}

/** Same rule-check as `build`: values in range, and `x` isn't a copy of `a`/`b`. */
function isValidShape(form: FindXForm, a: number, b: number): boolean {
  const x = xFor(form, a, b);
  if ([a, b, x].some((n) => n < 1 || n > FINDX_VALUE_MAX)) return false;
  return x !== a && x !== b;
}

/**
 * Every valid `(a, b)` shape for a form, in the same `a`-outer/`b`-inner sweep
 * order `firstUnused` scans in.
 */
function enumerateValidShapes(form: FindXForm): string[] {
  const shapes: string[] = [];
  for (let a = 1; a <= FINDX_VALUE_MAX; a += 1) {
    for (let b = 1; b <= FINDX_VALUE_MAX; b += 1) {
      if (isValidShape(form, a, b)) shapes.push(shapeKey(form, a, b));
    }
  }
  return shapes;
}

/** The static fallback `firstUnused` returns once a form's sweep is exhausted. */
const KNOWN_FALLBACKS: Record<FindXForm, { a: number; b: number; x: number }> = {
  'x+a=b': { a: 6, b: 14, x: 8 },
  'a+x=b': { a: 6, b: 14, x: 8 },
  'x-a=b': { a: 8, b: 5, x: 13 },
  'a-x=b': { a: 20, b: 12, x: 8 },
};

describe('find-x generator', () => {
  it('serves the run size its stage calls for', () => {
    for (const level of LEVELS) {
      expect(composeFindXRun(level, 1).length, level).toBe(FINDX_RUN_SIZES[level]);
    }
  });

  it('is deterministic for a level and attempt', () => {
    expect(composeFindXRun('guided', 3)).toEqual(composeFindXRun('guided', 3));
  });

  it('serves a different run on the next attempt', () => {
    const first = composeFindXRun('guided', 1).map((p) => p.id);
    const second = composeFindXRun('guided', 2).map((p) => p.id);
    expect(first).not.toEqual(second);
  });

  it('keeps every value inside 0..FINDX_VALUE_MAX', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        for (const n of [p.a, p.b, p.x]) {
          expect(n, `${level}/${p.id}`).toBeGreaterThanOrEqual(0);
          expect(n, `${level}/${p.id}`).toBeLessThanOrEqual(FINDX_VALUE_MAX);
        }
      }
    }
  });

  it('produces problems whose operands recompute x', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        expect(applyOperands(operandsFor(p)), p.id).toBe(p.x);
      }
    }
  });

  it('never lets x be 0 or a copy of a visible number', () => {
    for (const level of LEVELS) {
      for (const p of composeFindXRun(level, 1)) {
        expect(p.x, p.id).not.toBe(0);
        expect(p.x, p.id).not.toBe(p.a);
        expect(p.x, p.id).not.toBe(p.b);
      }
    }
  });

  it('covers all four forms in every run', () => {
    for (const level of LEVELS) {
      const forms = new Set(composeFindXRun(level, 1).map((p) => p.form));
      expect(forms.size, level).toBe(FINDX_FORMS.length);
    }
  });

  it('gives every problem a distinct id and equation within a run', () => {
    for (const level of LEVELS) {
      const run = composeFindXRun(level, 1);
      expect(new Set(run.map((p) => p.id)).size, level).toBe(run.length);
      const shapes = run.map((p) => `${p.form}|${p.a}|${p.b}`);
      expect(new Set(shapes).size, level).toBe(run.length);
    }
  });

  it('never dresses the x-minus form as a story', () => {
    for (const level of LEVELS) {
      for (let attempt = 1; attempt <= 12; attempt += 1) {
        for (const p of composeFindXRun(level, attempt)) {
          if (p.story) expect(storyKindOf(p.form), p.id).not.toBeNull();
        }
      }
    }
  });

  it('mixes some stories in over a run', () => {
    const runs = [1, 2, 3, 4].flatMap((a) => composeFindXRun('guided', a));
    const stories = runs.filter((p) => p.story).length;
    expect(stories).toBeGreaterThan(0);
    expect(stories).toBeLessThan(runs.length);
  });

  it('honours an injected form picker, which is the seam adaptivity will use', () => {
    const run = composeFindXRun('solo', 1, () => 'a-x=b');
    expect(run.every((p) => p.form === 'a-x=b')).toBe(true);
  });

  it('stays a full, in-range run when a picker forces a single form throughout', () => {
    // With plenty of headroom left in the (a, b) space, drawUnused succeeds on
    // every draw here — this pins that a forced single-form run still
    // terminates with the right size and in-range values, not that the
    // firstUnused fallback sweep ran. That sweep is covered directly in the
    // 'find-x fallback sweep' block below.
    const run = composeFindXRun('guided', 7, () => 'x-a=b');
    expect(run.length).toBe(FINDX_RUN_SIZES.guided);
    expect(run.every((p) => p.x <= FINDX_VALUE_MAX)).toBe(true);
  });
});

describe('find-x fallback sweep', () => {
  it('finds the one remaining shape for every form', () => {
    for (const form of FINDX_FORMS) {
      const shapes = enumerateValidShapes(form);
      expect(shapes.length, form).toBeGreaterThan(0);

      // Leave out one shape at a time — first, middle, and last in sweep
      // order — and confirm the sweep lands exactly on it every time. Covering
      // all three positions (not just the middle) means a boundary bug in the
      // sweep, such as the loop starting at the wrong index, can't hide.
      const indices = new Set([0, Math.floor(shapes.length / 2), shapes.length - 1]);
      for (const targetIndex of indices) {
        const target = shapes[targetIndex];
        const used = new Set(shapes.filter((_, i) => i !== targetIndex));

        const result = firstUnused(form, used);
        expect(shapeKey(result.form, result.a, result.b), `${form}[${targetIndex}]`).toBe(target);

        // The same invariants the rest of the suite pins for every problem.
        for (const n of [result.a, result.b, result.x]) {
          expect(n, form).toBeGreaterThanOrEqual(1);
          expect(n, form).toBeLessThanOrEqual(FINDX_VALUE_MAX);
        }
        expect(result.x, form).not.toBe(result.a);
        expect(result.x, form).not.toBe(result.b);
        expect(applyOperands(operandsFor(result)), form).toBe(result.x);
      }
    }
  });

  it('returns the static FALLBACK entry once every valid shape is used — and it duplicates an already-used shape', () => {
    for (const form of FINDX_FORMS) {
      const shapes = enumerateValidShapes(form);
      const used = new Set(shapes);

      const result = firstUnused(form, used);

      // firstUnused has no unused shape left to offer, so it returns its
      // static per-form FALLBACK entry.
      expect(result.a, form).toBe(KNOWN_FALLBACKS[form].a);
      expect(result.b, form).toBe(KNOWN_FALLBACKS[form].b);
      expect(result.x, form).toBe(KNOWN_FALLBACKS[form].x);

      // That FALLBACK entry is itself one of the shapes already in `used`
      // (it was discovered during the exhaustive sweep above, since it is a
      // valid shape) — so, currently, an exhausted sweep returns a
      // *duplicate* of a shape this run already served, rather than a
      // guaranteed-fresh one. This is a latent defect (Minor): unreachable
      // today because a form's ~180-190 valid shapes vastly outnumber a
      // run's problem count, but real if that ever changes.
      expect(used.has(shapeKey(result.form, result.a, result.b)), form).toBe(true);
    }
  });
});
