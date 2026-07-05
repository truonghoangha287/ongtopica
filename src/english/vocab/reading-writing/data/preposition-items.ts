/**
 * Content pool for the "Where Is It?" preposition picker (Cambridge Starters
 * grammar: in / on / under). Each item shows a child-safe object posed at the
 * position named by `answer`, so the picture itself asks the question. The three
 * chips are always in / on / under; the page shuffles their order.
 */
export type Preposition = 'in' | 'on' | 'under';

export interface PrepositionItem {
  id: string;
  /** The object word, dropped into "The {{object}} is ___ the box." */
  object: string;
  /** Emoji rendered in the scene at the `answer` position. */
  emoji: string;
  answer: Preposition;
}

export const PREPOSITION_ITEMS: PrepositionItem[] = [
  { id: 'ball', object: 'ball', emoji: '⚽', answer: 'on' },
  { id: 'cat', object: 'cat', emoji: '🐱', answer: 'in' },
  { id: 'apple', object: 'apple', emoji: '🍎', answer: 'under' },
  { id: 'bird', object: 'bird', emoji: '🐦', answer: 'on' },
  { id: 'hat', object: 'hat', emoji: '🎩', answer: 'in' },
  { id: 'dog', object: 'dog', emoji: '🐶', answer: 'under' },
  { id: 'star', object: 'star', emoji: '⭐', answer: 'on' },
  { id: 'fish', object: 'fish', emoji: '🐟', answer: 'in' },
  { id: 'frog', object: 'frog', emoji: '🐸', answer: 'under' },
  { id: 'flower', object: 'flower', emoji: '🌼', answer: 'on' },
  { id: 'mouse', object: 'mouse', emoji: '🐭', answer: 'in' },
  { id: 'bear', object: 'bear', emoji: '🧸', answer: 'under' },
];
