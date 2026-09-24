import type { FindXForm, FindXProblem, FindXStoryKind } from '@/math/types/find-x.types';

/**
 * The algebra of one Find X problem — the leaf module. It depends on nothing
 * but types, so nothing it exports can ever be undefined at import time.
 */

/** U+2212. The bank and `equation-parts.ts` both use it; a hyphen breaks matching. */
export const MINUS = '−' as const;

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
