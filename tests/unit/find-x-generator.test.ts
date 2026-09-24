import { describe, it, expect } from 'vitest';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { applyOperands, operandsFor, storyKindOf } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXLevel } from '@/math/types/find-x.types';
import { FINDX_RUN_SIZES, FINDX_VALUE_MAX } from '@/math/constants/math-constants';

const LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];

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

  it('falls back rather than looping when a picker starves the composer', () => {
    // Every problem forced to one form still terminates and stays in range.
    const run = composeFindXRun('guided', 7, () => 'x-a=b');
    expect(run.length).toBe(FINDX_RUN_SIZES.guided);
    expect(run.every((p) => p.x <= FINDX_VALUE_MAX)).toBe(true);
  });
});
