/**
 * Domain types for the Find X practice stages. Kept free of React, Dexie and
 * i18next imports so the pure services can depend on them without dragging in
 * UI or storage concerns — same rule as `math.types.ts`.
 */

/**
 * Where the unknown sits. The string IS the shape of the equation, so a reader
 * never has to look up what `form` means.
 */
export type FindXForm = 'x+a=b' | 'a+x=b' | 'x-a=b' | 'a-x=b';

/** All four forms, in the order the default round-robin serves them. */
export const FINDX_FORMS: readonly FindXForm[] = ['x+a=b', 'a+x=b', 'x-a=b', 'a-x=b'];

/** How much scaffolding a stage shows. Maps 1:1 onto the three stage cards. */
export type FindXLevel = 'guided' | 'short' | 'solo';

/**
 * One decision in the chain.
 * - `read`    — which number in the story is the whole (story problems only)
 * - `role`    — is x a part, or the whole?
 * - `operation` — add or subtract?
 * - `operands` — which two numbers, in which order?
 * - `compute` — do the arithmetic
 * - `check`   — substitute the answer back into the original equation
 */
export type FindXStepKind = 'read' | 'role' | 'operation' | 'operands' | 'compute' | 'check';

/** Story flavours. `plus` hides a part of an addition, `minus` of a subtraction. */
export type FindXStoryKind = 'plus' | 'minus';

/** Which worded scenario a story problem is dressed in. */
export type FindXStoryTheme = 'birds' | 'sweets' | 'marbles';

/** One problem. `x` is stored rather than recomputed so tests can assert both agree. */
export interface FindXProblem {
  id: string;
  form: FindXForm;
  a: number;
  b: number;
  x: number;
  /** Present on story problems; absent on bare equations. */
  story?: FindXStoryTheme;
}

/**
 * One answer control.
 *
 * `labelKey` carries worded options through i18n; `label` is a literal for
 * equations and numerals, which need no translation. Exactly one of the two is
 * set. `whyKey` is present on EVERY option, right or wrong — the trail shows the
 * reason for a correct choice too, which is where the teaching happens.
 */
export interface FindXOption {
  labelKey?: string;
  label?: string;
  vars?: Record<string, string | number>;
  correct: boolean;
  whyKey: string;
  /** `input: 'tiles'` only — the number this option stands for. */
  value?: number;
}

/** One step of the chain, ready to render. */
export interface FindXStep {
  kind: FindXStepKind;
  promptKey: string;
  vars: Record<string, string | number>;
  /** `'choice'` is the option list; `'tiles'` the 0–20 number strip. */
  input: 'choice' | 'tiles';
  options: FindXOption[];
}
