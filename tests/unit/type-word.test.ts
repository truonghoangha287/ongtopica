import { describe, it, expect } from 'vitest';
import {
  initialTypeWordState,
  isTypeable,
  pickTypingWords,
  typeWordReducer,
  type TypeWordState,
} from '@/english/vocab/services/type-word';
import { TYPE_WORD_FREE_MISTAKES } from '@/shared/constants/game-constants';
import type { Word, WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

const word = (over: Partial<Word> & { text: string }): Word => ({
  id: `set.${over.text}`,
  pictureAsset: '/p.webp',
  audioAsset: '/a.mp3',
  wordSetId: 'set',
  blankLetterIndex: 1,
  letterChoices: ['a', 'b', 'c'],
  ...over,
});

/** Type a whole string, threading the state through. */
function typeAll(target: string, keys: string) {
  let state = initialTypeWordState();
  const effects: string[] = [];
  for (const key of keys) {
    const outcome = typeWordReducer(state, { type: 'letter', letter: key }, target);
    state = outcome.state;
    effects.push(outcome.effect);
  }
  return { state, effects };
}

describe('typeWordReducer', () => {
  it('fills the word one correct letter at a time', () => {
    const { state, effects } = typeAll('cat', 'cat');
    expect(state.typed).toBe('cat');
    expect(state.done).toBe(true);
    expect(effects).toEqual(['correct', 'correct', 'complete']);
  });

  it('clears everything typed so far when a letter is wrong', () => {
    // The rule this activity exists for: a slip costs the whole word, not one
    // character, so the child re-spells it from the start.
    const { state, effects } = typeAll('cat', 'cx');
    expect(state.typed).toBe('');
    expect(state.mistakes).toBe(1);
    expect(effects[effects.length - 1]).toBe('cleared');
  });

  it('never places the wrong letter, even briefly', () => {
    const { state } = typeAll('cat', 'x');
    expect(state.typed).toBe('');
  });

  it('makes the first mistake free and the next one costly', () => {
    let state: TypeWordState = initialTypeWordState();
    const effects: string[] = [];
    for (let i = 0; i <= TYPE_WORD_FREE_MISTAKES; i++) {
      const outcome = typeWordReducer(state, { type: 'letter', letter: 'z' }, 'cat');
      state = outcome.state;
      effects.push(outcome.effect);
    }
    expect(effects[0]).toBe('cleared');
    expect(effects[effects.length - 1]).toBe('cleared-costly');
  });

  it('counts mistakes across a retry, so guessing still costs a heart', () => {
    let state = typeAll('cat', 'cx').state; // one mistake, cleared
    const outcome = typeWordReducer(state, { type: 'letter', letter: 'q' }, 'cat');
    expect(outcome.effect).toBe('cleared-costly');
  });

  it('lets backspace undo without counting as a mistake', () => {
    let state = typeAll('cat', 'ca').state;
    const outcome = typeWordReducer(state, { type: 'backspace' }, 'cat');
    expect(outcome.state.typed).toBe('c');
    expect(outcome.state.mistakes).toBe(0);
    expect(outcome.effect).toBe('none');
  });

  it('ignores backspace on an empty word', () => {
    const outcome = typeWordReducer(initialTypeWordState(), { type: 'backspace' }, 'cat');
    expect(outcome.state.typed).toBe('');
  });

  it('accepts a lowercase key for a capitalised word but keeps the real spelling', () => {
    // The keypad is lowercase; `Friday` is examined with its capital.
    const { state } = typeAll('Friday', 'friday');
    expect(state.typed).toBe('Friday');
    expect(state.done).toBe(true);
  });

  it('ignores further keys once the word is done', () => {
    const { state } = typeAll('cat', 'cat');
    const outcome = typeWordReducer(state, { type: 'letter', letter: 'x' }, 'cat');
    expect(outcome.state.typed).toBe('cat');
    expect(outcome.effect).toBe('none');
  });

  it('resets back to an empty word', () => {
    const { state } = typeAll('cat', 'ca');
    const outcome = typeWordReducer(state, { type: 'reset' }, 'cat');
    expect(outcome.state).toEqual(initialTypeWordState());
  });
});

describe('isTypeable', () => {
  it('rejects words with a character the A-Z keypad has no key for', () => {
    expect(isTypeable(word({ text: 'dolphin' }))).toBe(true);
    expect(isTypeable(word({ text: 'Friday' }))).toBe(true);
    expect(isTypeable(word({ text: 'café' }))).toBe(false);
    expect(isTypeable(word({ text: "o'clock" }))).toBe(false);
    expect(isTypeable(word({ text: 'film star' }))).toBe(false);
    expect(isTypeable(word({ text: 'grown-up' }))).toBe(false);
  });
});

describe('pickTypingWords', () => {
  const wordSet: WordSet = {
    id: 'set',
    displayName: 'Set',
    words: [
      word({ text: 'easy' }),
      word({ text: 'hard' }),
      word({ text: 'because', pictorial: false }),
      word({ text: 'café' }),
    ],
  };

  it('never offers a word whose picture is its own spelling', () => {
    const picked = pickTypingWords(wordSet, {}, 10);
    expect(picked.map((w) => w.text)).not.toContain('because');
  });

  it('never offers a word the keypad cannot finish', () => {
    const picked = pickTypingWords(wordSet, {}, 10);
    expect(picked.map((w) => w.text)).not.toContain('café');
  });

  it('puts the words the child struggles with first', () => {
    const progress = {
      'set.hard': { priorityScore: 5 } as WordProgressRow,
      'set.easy': { priorityScore: 0.2 } as WordProgressRow,
    };
    expect(pickTypingWords(wordSet, progress, 2).map((w) => w.text)).toEqual(['hard', 'easy']);
  });

  it('is deterministic when nothing has been practised yet', () => {
    const a = pickTypingWords(wordSet, {}, 10).map((w) => w.id);
    const b = pickTypingWords(wordSet, {}, 10).map((w) => w.id);
    expect(a).toEqual(b);
  });

  it('caps the round at the requested length', () => {
    expect(pickTypingWords(wordSet, {}, 1)).toHaveLength(1);
  });
});
