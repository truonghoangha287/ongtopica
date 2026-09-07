/**
 * Type-the-Word: see a picture, hear the word, spell it letter by letter.
 *
 * All the rules live here as a pure reducer so they can be tested without
 * rendering anything. The component owns only what is genuinely visual --
 * sounds, animation and hearts.
 *
 * The wrong-letter rule is the point of the activity: a wrong letter clears
 * every letter typed so far, so the child re-types the word from the start
 * rather than nudging one character. That is deliberate practice of the whole
 * spelling, not of the correction.
 */
import { TYPE_WORD_FREE_MISTAKES } from '@/shared/constants/game-constants';
import { pictorialOnly } from '@/english/vocab/services/pictorial';
import type { Word, WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

/** Letters the on-screen keypad offers, and the only ones a word may need. */
export const KEYPAD_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * Whether a word can be typed on an A-Z keypad at all.
 *
 * `café` and `o'clock` are real Movers words, but the keypad has no key for
 * `é` or `'`, so they would be unfinishable. Derived rather than stored: it is
 * a property of the keypad, and a keypad that grows should not need a data
 * migration.
 */
export const isTypeable = (word: Word): boolean => /^[a-zA-Z]+$/.test(word.text);

/**
 * Words worth drilling, hardest first.
 *
 * Only pictorial words: the prompt *is* the picture, so a word whose picture is
 * a card showing its own spelling would hand over the answer. Ordered by the
 * same priority score the rest of the app uses, so the words a child keeps
 * getting wrong come round sooner.
 */
export function pickTypingWords(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  count: number,
): Word[] {
  return pictorialOnly(wordSet.words)
    .filter(isTypeable)
    .slice()
    .sort((a, b) => {
      const priority = (w: Word) => progressMap[w.id]?.priorityScore ?? 1;
      const diff = priority(b) - priority(a);
      // Ties break on id so a set with no progress yet is still deterministic.
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    })
    .slice(0, count);
}

export interface TypeWordState {
  /** Letters entered so far, always a correct prefix of the target. */
  typed: string;
  /** Wrong letters on the current word. */
  mistakes: number;
  /** True once the whole word is spelled. */
  done: boolean;
}

export const initialTypeWordState = (): TypeWordState => ({
  typed: '',
  mistakes: 0,
  done: false,
});

export type TypeWordAction =
  | { type: 'letter'; letter: string }
  | { type: 'backspace' }
  | { type: 'reset' };

export interface TypeWordOutcome {
  state: TypeWordState;
  /** What the component should react to; nothing else infers it. */
  effect: 'none' | 'correct' | 'cleared' | 'cleared-costly' | 'complete';
}

/**
 * Apply one keystroke.
 *
 * Comparison is case-insensitive so `Friday` can be typed on a lowercase
 * keypad, but `typed` keeps the word's own capitalisation -- the child should
 * read back the correct spelling, not what they pressed.
 */
export function typeWordReducer(
  state: TypeWordState,
  action: TypeWordAction,
  target: string,
): TypeWordOutcome {
  if (action.type === 'reset') {
    return { state: initialTypeWordState(), effect: 'none' };
  }
  if (state.done) return { state, effect: 'none' };

  if (action.type === 'backspace') {
    // Undoing is free: it is a correction, not a guess.
    return {
      state: { ...state, typed: state.typed.slice(0, -1) },
      effect: 'none',
    };
  }

  const expected = target[state.typed.length];
  if (expected === undefined) return { state, effect: 'none' };

  if (action.letter.toLowerCase() !== expected.toLowerCase()) {
    const mistakes = state.mistakes + 1;
    return {
      state: { typed: '', mistakes, done: false },
      effect: mistakes > TYPE_WORD_FREE_MISTAKES ? 'cleared-costly' : 'cleared',
    };
  }

  // Keep the word's own casing rather than the key that was pressed.
  const typed = state.typed + expected;
  const done = typed.length === target.length;
  return { state: { ...state, typed, done }, effect: done ? 'complete' : 'correct' };
}
