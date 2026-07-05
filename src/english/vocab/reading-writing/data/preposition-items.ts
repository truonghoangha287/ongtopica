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
  // School & toys
  { id: 'book', object: 'book', emoji: '📖', answer: 'on' },
  { id: 'crayon', object: 'crayon', emoji: '🖍️', answer: 'in' },
  { id: 'drum', object: 'drum', emoji: '🥁', answer: 'under' },
  { id: 'kite', object: 'kite', emoji: '🪁', answer: 'on' },
  { id: 'doll', object: 'doll', emoji: '🪆', answer: 'in' },
  // Home & food
  { id: 'cup', object: 'cup', emoji: '☕', answer: 'on' },
  { id: 'key', object: 'key', emoji: '🔑', answer: 'in' },
  { id: 'clock', object: 'clock', emoji: '🕐', answer: 'on' },
  { id: 'lemon', object: 'lemon', emoji: '🍋', answer: 'in' },
  { id: 'egg', object: 'egg', emoji: '🥚', answer: 'under' },
  // Clothes, transport & more animals
  { id: 'sock', object: 'sock', emoji: '🧦', answer: 'in' },
  { id: 'shoe', object: 'shoe', emoji: '👟', answer: 'under' },
  { id: 'boat', object: 'boat', emoji: '⛵', answer: 'on' },
  { id: 'car', object: 'car', emoji: '🚗', answer: 'under' },
  { id: 'snake', object: 'snake', emoji: '🐍', answer: 'under' },
  { id: 'spider', object: 'spider', emoji: '🕷️', answer: 'on' },
  { id: 'bee', object: 'bee', emoji: '🐝', answer: 'on' },
  { id: 'duck', object: 'duck', emoji: '🦆', answer: 'in' },
  // Food
  { id: 'banana', object: 'banana', emoji: '🍌', answer: 'on' },
  { id: 'cake', object: 'cake', emoji: '🎂', answer: 'on' },
  { id: 'pear', object: 'pear', emoji: '🍐', answer: 'in' },
  { id: 'grape', object: 'grape', emoji: '🍇', answer: 'in' },
  { id: 'mango', object: 'mango', emoji: '🥭', answer: 'under' },
  { id: 'cheese', object: 'cheese', emoji: '🧀', answer: 'under' },
  { id: 'bread', object: 'bread', emoji: '🍞', answer: 'in' },
  // Objects, school & toys
  { id: 'pen', object: 'pen', emoji: '🖊️', answer: 'on' },
  { id: 'phone', object: 'phone', emoji: '📱', answer: 'on' },
  { id: 'ruler', object: 'ruler', emoji: '📏', answer: 'under' },
  { id: 'robot', object: 'robot', emoji: '🤖', answer: 'in' },
  { id: 'guitar', object: 'guitar', emoji: '🎸', answer: 'under' },
  { id: 'watch', object: 'watch', emoji: '⌚', answer: 'in' },
  // Animals & transport
  { id: 'hen', object: 'hen', emoji: '🐔', answer: 'on' },
  { id: 'rabbit', object: 'rabbit', emoji: '🐰', answer: 'under' },
  { id: 'plane', object: 'plane', emoji: '✈️', answer: 'on' },
  { id: 'umbrella', object: 'umbrella', emoji: '☂️', answer: 'under' },
];
