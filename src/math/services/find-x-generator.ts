import { FINDX_FORMS } from '@/math/types/find-x.types';
import type { FindXForm, FindXLevel, FindXProblem, FindXStoryTheme } from '@/math/types/find-x.types';
import { storyKindOf } from '@/math/services/find-x-steps';
import {
  FINDX_MAX_REDRAWS,
  FINDX_RUN_SIZES,
  FINDX_STORY_RATIO,
  FINDX_VALUE_MAX,
} from '@/math/constants/math-constants';

/**
 * Composing one run of Find X problems.
 *
 * Seeded and pure: the same `(level, attempt)` always yields the same run, so a
 * replay is fresh practice rather than a shuffle, and a test can assert on it.
 * No JSON bank — a problem is four integers and the space inside 0..20 is small
 * enough to draw from directly. The quiz banks exist because hand-tuned
 * distractors need review; these are computed (see `find-x-steps.ts`).
 */

/** Seeded PRNG. Local rather than shared: nothing else in Math World needs one. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const randInt = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

/**
 * Chooses the form of the next problem.
 *
 * This is the seam adaptive weighting will replace (see the design doc, §11
 * gap 2): a scheduler weighted by which form the child actually misses drops in
 * here without `deriveSteps` or the run reducer changing at all.
 */
export type PickForm = (index: number, rng: () => number) => FindXForm;

/** The default: straight round-robin, so every run covers all four forms. */
export const roundRobinForms: PickForm = (index) => FINDX_FORMS[index % FINDX_FORMS.length];

const THEMES: FindXStoryTheme[] = ['birds', 'sweets', 'marbles'];

/** Identity of a problem, ignoring its generated id. */
function shapeOf(p: FindXProblem): string {
  return `${p.form}|${p.a}|${p.b}`;
}

/**
 * The problem a form makes of two visible numbers, or `null` when it breaks a
 * rule.
 *
 * `x` may not be 0 (the answer is free), nor equal `a` or `b` — she could reach
 * it by copying a number off the screen rather than working it out.
 */
function build(form: FindXForm, a: number, b: number): FindXProblem | null {
  let x: number;
  switch (form) {
    case 'x+a=b':
    case 'a+x=b':
      x = b - a;
      break;
    case 'x-a=b':
      x = a + b;
      break;
    case 'a-x=b':
      x = a - b;
      break;
  }
  if ([a, b, x].some((n) => n < 1 || n > FINDX_VALUE_MAX)) return null;
  if (x === a || x === b) return null;
  return { id: '', form, a, b, x };
}

/** A guaranteed-valid problem per form — the last resort, never normally hit. */
const FALLBACK: Record<FindXForm, Omit<FindXProblem, 'id'>> = {
  'x+a=b': { form: 'x+a=b', a: 6, b: 14, x: 8 },
  'a+x=b': { form: 'a+x=b', a: 6, b: 14, x: 8 },
  'x-a=b': { form: 'x-a=b', a: 8, b: 5, x: 13 },
  'a-x=b': { form: 'a-x=b', a: 20, b: 12, x: 8 },
};

/** Random draws, rejecting rule-breakers and shapes this run already used. */
function drawUnused(form: FindXForm, rng: () => number, used: Set<string>): FindXProblem | null {
  for (let tries = 0; tries < FINDX_MAX_REDRAWS; tries += 1) {
    const p = build(form, randInt(rng, 1, FINDX_VALUE_MAX), randInt(rng, 1, FINDX_VALUE_MAX));
    if (p && !used.has(shapeOf(p))) return p;
  }
  return null;
}

/**
 * Deterministic sweep for the first unused valid shape of a form. Reached only
 * when `FINDX_MAX_REDRAWS` random draws all collided or broke a rule — which a
 * picker forced onto one starved form can do. Bounded by construction, so the
 * composer can never spin.
 */
function firstUnused(form: FindXForm, used: Set<string>): FindXProblem {
  for (let a = 1; a <= FINDX_VALUE_MAX; a += 1) {
    for (let b = 1; b <= FINDX_VALUE_MAX; b += 1) {
      const p = build(form, a, b);
      if (p && !used.has(shapeOf(p))) return p;
    }
  }
  return { ...FALLBACK[form], id: '' };
}

/**
 * One run for a stage. `attempt` comes from the child's stored stage progress,
 * so every replay is a different set.
 */
export function composeFindXRun(
  level: FindXLevel,
  attempt: number,
  pickForm: PickForm = roundRobinForms,
): FindXProblem[] {
  const rng = mulberry32(hashSeed(`findx:${level}:${attempt}`));
  const size = FINDX_RUN_SIZES[level];
  const out: FindXProblem[] = [];
  const used = new Set<string>();

  for (let i = 0; i < size; i += 1) {
    const form = pickForm(i, rng);
    const problem = drawUnused(form, rng, used) ?? firstUnused(form, used);
    used.add(shapeOf(problem));
    out.push({
      ...problem,
      id: `findx-${level}-${attempt}-${i}`,
      ...storyFor(problem.form, rng),
    });
  }
  return out;
}

/** Dress roughly `FINDX_STORY_RATIO` of the eligible problems as word problems. */
function storyFor(form: FindXForm, rng: () => number): Pick<FindXProblem, 'story'> {
  if (storyKindOf(form) === null) return {};
  if (rng() >= FINDX_STORY_RATIO) return {};
  return { story: THEMES[randInt(rng, 0, THEMES.length - 1)] };
}
