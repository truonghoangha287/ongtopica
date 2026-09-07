/**
 * Visual state shared by every answer control (option tile, number tile, symbol
 * button). Kept pure and in one place so the three widgets can never drift
 * apart. Correctness is *also* carried in each widget's aria-label, so colour is
 * never the only signal (Constitution II).
 */

export interface AnswerVisual {
  bg: string;
  fg: string;
  shadow: string;
  opacity: number;
}

/** How this control relates to the graded answer. */
export type AnswerRole = 'correct' | 'chosenWrong' | 'other';

const NEUTRAL: AnswerVisual = {
  bg: '#fff',
  fg: 'var(--ink)',
  shadow: '0 6px 18px -12px rgba(80,60,30,.4)',
  opacity: 1,
};

const CORRECT: AnswerVisual = {
  bg: 'oklch(93% 0.09 150)',
  fg: 'oklch(38% 0.12 150)',
  shadow: 'inset 0 0 0 3px var(--success)',
  opacity: 1,
};

const CHOSEN_WRONG: AnswerVisual = {
  bg: 'oklch(94% 0.07 25)',
  fg: 'var(--danger, oklch(60% 0.19 25))',
  shadow: 'inset 0 0 0 3px oklch(60% 0.19 25)',
  opacity: 1,
};

const SELECTED: AnswerVisual = {
  bg: 'var(--ma-soft)',
  fg: 'var(--ma-ink)',
  shadow: 'inset 0 0 0 3px var(--ma)',
  opacity: 1,
};

/** Dimming applied to the untouched controls once an answer has been graded. */
const FADED_OPACITY = 0.5;

/**
 * Colours for one answer control.
 *
 * Before checking: neutral, or the "picked" tint for the current selection.
 * After checking: green on the correct control, red on a wrongly chosen one,
 * and everything else fades back.
 */
export function answerVisualState(role: AnswerRole, isSelected: boolean, checked: boolean): AnswerVisual {
  if (!checked) return isSelected ? SELECTED : NEUTRAL;
  if (role === 'correct') return CORRECT;
  if (role === 'chosenWrong') return CHOSEN_WRONG;
  return { ...NEUTRAL, opacity: FADED_OPACITY };
}

/** Classify a control against the graded answer, for `answerVisualState`. */
export function answerRole(isAnswer: boolean, isSelected: boolean): AnswerRole {
  if (isAnswer) return 'correct';
  return isSelected ? 'chosenWrong' : 'other';
}
