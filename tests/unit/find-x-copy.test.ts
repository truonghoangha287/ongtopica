import { describe, it, expect } from 'vitest';
import en from '@/locales/en/math.json';
import { deriveSteps } from '@/math/services/find-x-steps';
import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXLevel, FindXProblem, FindXStoryTheme } from '@/math/types/find-x.types';

/**
 * Resolve a dotted i18n key against the math namespace — same helper
 * `math-number-lab-data.test.ts` uses against the generated bank.
 *
 * This matters more here than there: Find X keys are BUILT AT RUNTIME from a
 * form and a role rather than written into a JSON file a test can walk, so a
 * typo in a rare branch would ship as a raw `findx.why.…` string on screen.
 */
function resolveKey(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) return (node as Record<string, unknown>)[part];
    return undefined;
  }, en);
}

const LEVELS: FindXLevel[] = ['guided', 'short', 'solo'];
const THEMES: FindXStoryTheme[] = ['birds', 'sweets', 'marbles'];

/** One problem per form, plus a story variant wherever a story is allowed. */
function everyProblem(): FindXProblem[] {
  const base: FindXProblem[] = [
    { id: 'c1', form: 'x+a=b', a: 6, b: 14, x: 8 },
    { id: 'c2', form: 'a+x=b', a: 6, b: 14, x: 8 },
    { id: 'c3', form: 'x-a=b', a: 8, b: 5, x: 13 },
    { id: 'c4', form: 'a-x=b', a: 20, b: 12, x: 8 },
  ];
  const stories = base
    .filter((p) => p.form !== 'x-a=b')
    .flatMap((p) => THEMES.map((story, i) => ({ ...p, id: `${p.id}-s${i}`, story })));
  return [...base, ...stories];
}

describe('find-x copy', () => {
  it('covers every form', () => {
    expect(new Set(everyProblem().map((p) => p.form)).size).toBe(FINDX_FORMS.length);
  });

  it('resolves every prompt and reason key it can emit', () => {
    for (const p of everyProblem()) {
      for (const level of LEVELS) {
        for (const step of deriveSteps(p, level)) {
          expect(typeof resolveKey(step.promptKey), step.promptKey).toBe('string');
          for (const o of step.options) {
            expect(typeof resolveKey(o.whyKey), o.whyKey).toBe('string');
            if (o.labelKey) expect(typeof resolveKey(o.labelKey), o.labelKey).toBe('string');
          }
        }
      }
    }
  });

  it('resolves every story template', () => {
    for (const kind of ['plus', 'minus']) {
      for (const theme of THEMES) {
        expect(typeof resolveKey(`findx.story.${kind}.${theme}`), `${kind}.${theme}`).toBe('string');
      }
    }
  });

  it('resolves the stage names and the screen chrome', () => {
    for (const key of [
      'lab.stages.findxGuided', 'lab.stages.findxShort', 'lab.stages.findxSolo',
      'findx.barAria', 'findx.trailAria', 'findx.reveal', 'findx.continue',
      'findx.finish', 'findx.exitAria', 'findx.questionOf', 'findx.rightCount',
      'findx.problemLabel', 'findx.storyLabel', 'findx.secondLook',
      'findx.kind.operation', 'findx.kind.operands', 'findx.kind.compute',
    ]) {
      expect(typeof resolveKey(key), key).toBe('string');
    }
  });
});
