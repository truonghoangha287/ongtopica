import type { QuizQuestion } from '@/math/types/math.types';

/**
 * Turning a generated question into the pieces the Number Lab draws: the
 * equation split around its blank, and the two counter groups behind the
 * "show me with dots" scaffold.
 *
 * Kept pure and separate from the view so the arithmetic that decides *what*
 * the dots stand for is testable on its own.
 */

/** The placeholder the generated bank uses for the number a child must find. */
export const BLANK = '▢';

/** One token of a rendered equation. `blank` is the box she has to fill. */
export interface EquationPart {
  text: string;
  blank: boolean;
}

/**
 * The full statement a question is asking about, with `BLANK` standing in for
 * the answer.
 *
 * Most bands already ship the blank inside `expr` (`5 + ▢ = 7`). Bands that
 * ask for the result of a visible sum (`4 + 5`) get the `= ▢` tail added here.
 * A bare number carries no equation at all — its prompt does the asking ("One
 * more than 8") — so only the box is drawn.
 */
export function equationText(question: QuizQuestion): string {
  const expr = (question.expr ?? '').trim();
  if (expr === '') return BLANK;
  if (expr.includes(BLANK)) return expr;
  return /[+−\-×÷]/.test(expr) ? `${expr} = ${BLANK}` : BLANK;
}

/**
 * The equation split into drawable tokens, with `filled` shown inside the box.
 * Pass the tapped value while she is choosing and the answer once graded, so
 * the box always reads back what the equation currently says.
 */
export function equationParts(question: QuizQuestion, filled: string): EquationPart[] {
  return equationText(question)
    .split(/\s+/)
    .map((token) => (token === BLANK
      ? { text: filled, blank: true }
      : { text: token, blank: false }));
}

/** Every integer in a string, in the order it appears. */
function numbersIn(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}

/**
 * The two piles of counters that make the question true — the concrete thing
 * behind the symbols, for a child who cannot yet do it in her head.
 *
 * For a sum they are the two parts; for a take-away, what is left and what was
 * taken; for a comparison, the two numbers being weighed. Returns `null` when
 * the question has no two numbers to lay out, or when they would not fit.
 */
export function counterGroups(question: QuizQuestion): [number, number] | null {
  const answer = question.input === 'symbols'
    ? undefined
    : question.answerValue ?? Number(question.options[question.answer]);

  const expr = (question.expr ?? '').trim();
  const resolved = answer === undefined
    ? expr
    : equationText(question).replace(BLANK, String(answer));
  const found = numbersIn(resolved);
  const start = numbersIn(expr)[0];
  let groups: [number, number] | null = null;

  if (found.length >= 2) {
    groups = expr.includes('−')
      // `total − taken = left` → lay out what is left, then what was taken.
      ? [found[2] ?? found[1], found[1]]
      // `part + part = total`, or the two sides of a comparison.
      : [found[0], found[1]];
  } else if (answer !== undefined && start !== undefined) {
    // A bare number ("one more than 8") states its step only in the prompt, so
    // the second pile is the distance from it to the answer.
    groups = [start, Math.abs(answer - start)];
  }

  if (!groups || groups.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return groups[0] + groups[1] > MAX_COUNTERS ? null : groups;
}

/** Beyond this the dots stop being countable at a glance and start being clutter. */
const MAX_COUNTERS = 20;
