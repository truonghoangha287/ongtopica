/**
 * Content pool for the Word-bank cloze activity (Cambridge Starters R&W Part 4).
 * A child reads a short connected text with 1–2 gaps and taps picture-words
 * from a word bank to fill them.
 *
 * Vocabulary is Cambridge Starters level and child-safe. Each item's sentence is
 * an ordered list of parts: plain text runs (`{ text }`) and gaps (`{ answer }`).
 * The `bank` holds the tappable options — always the correct answers plus 1–3
 * distractors — each carrying an emoji so pre-readers get a picture cue.
 */

/** A run of literal text in the sentence. */
export interface ClozeTextPart {
  text: string;
}

/** A gap the child must fill; `answer` matches a bank option `key`. */
export interface ClozeGapPart {
  answer: string;
}

export type ClozePart = ClozeTextPart | ClozeGapPart;

export const isGap = (part: ClozePart): part is ClozeGapPart =>
  (part as ClozeGapPart).answer !== undefined;

/** A tappable picture-word in the bank. */
export interface ClozeBankOption {
  key: string;
  emoji: string;
  label: string;
}

export interface ClozeItem {
  id: string;
  /** Ordered sentence parts: text runs interleaved with gaps. */
  sentence: ClozePart[];
  /** Bank options: correct answers + distractors, in author order (shuffled at play time). */
  bank: ClozeBankOption[];
  /** Optional decorative emoji shown beside the sentence. */
  emojiHint?: string;
}

const opt = (key: string, emoji: string, label: string): ClozeBankOption => ({ key, emoji, label });

/** ~14 varied items across animals, food, home, family and weather themes. */
export const CLOZE_ITEMS: ClozeItem[] = [
  {
    id: 'food-apple',
    sentence: [
      { text: 'I come from a ' },
      { answer: 'tree' },
      { text: '. I am a green ' },
      { answer: 'fruit' },
      { text: ' to eat.' },
    ],
    bank: [
      opt('tree', '🌳', 'tree'),
      opt('fruit', '🍏', 'fruit'),
      opt('bag', '👜', 'bag'),
      opt('kitchen', '🍳', 'kitchen'),
    ],
    emojiHint: '🍏',
  },
  {
    id: 'animals-cat',
    sentence: [
      { text: 'The ' },
      { answer: 'cat' },
      { text: ' likes to drink ' },
      { answer: 'milk' },
      { text: '.' },
    ],
    bank: [opt('cat', '🐱', 'cat'), opt('milk', '🥛', 'milk'), opt('car', '🚗', 'car'), opt('ball', '⚽', 'ball')],
    emojiHint: '🐱',
  },
  {
    id: 'animals-dog',
    sentence: [
      { text: 'My ' },
      { answer: 'dog' },
      { text: ' runs in the ' },
      { answer: 'garden' },
      { text: '.' },
    ],
    bank: [opt('dog', '🐶', 'dog'), opt('garden', '🌷', 'garden'), opt('boat', '⛵', 'boat'), opt('cup', '☕', 'cup')],
    emojiHint: '🐶',
  },
  {
    id: 'weather-sun',
    sentence: [
      { text: 'The ' },
      { answer: 'sun' },
      { text: ' is hot and the ' },
      { answer: 'sky' },
      { text: ' is blue.' },
    ],
    bank: [opt('sun', '☀️', 'sun'), opt('sky', '🌤️', 'sky'), opt('rain', '🌧️', 'rain'), opt('snow', '❄️', 'snow')],
    emojiHint: '☀️',
  },
  {
    id: 'weather-rain',
    sentence: [
      { text: 'When it is ' },
      { answer: 'rain' },
      { text: ', I take my ' },
      { answer: 'umbrella' },
      { text: '.' },
    ],
    bank: [
      opt('rain', '🌧️', 'rain'),
      opt('umbrella', '☂️', 'umbrella'),
      opt('hat', '🎩', 'hat'),
      opt('kite', '🪁', 'kite'),
    ],
    emojiHint: '🌧️',
  },
  {
    id: 'family-mum',
    sentence: [
      { text: 'My ' },
      { answer: 'mother' },
      { text: ' reads me a ' },
      { answer: 'book' },
      { text: ' at night.' },
    ],
    bank: [
      opt('mother', '👩', 'mother'),
      opt('book', '📖', 'book'),
      opt('clock', '🕐', 'clock'),
      opt('shoe', '👟', 'shoe'),
    ],
    emojiHint: '👩',
  },
  {
    id: 'family-baby',
    sentence: [
      { text: 'The ' },
      { answer: 'baby' },
      { text: ' sleeps in a small ' },
      { answer: 'bed' },
      { text: '.' },
    ],
    bank: [opt('baby', '👶', 'baby'), opt('bed', '🛏️', 'bed'), opt('bike', '🚲', 'bike'), opt('duck', '🦆', 'duck')],
    emojiHint: '👶',
  },
  {
    id: 'home-kitchen',
    sentence: [
      { text: 'We make ' },
      { answer: 'cake' },
      { text: ' in the ' },
      { answer: 'kitchen' },
      { text: '.' },
    ],
    bank: [
      opt('cake', '🎂', 'cake'),
      opt('kitchen', '🍳', 'kitchen'),
      opt('bath', '🛁', 'bath'),
      opt('door', '🚪', 'door'),
    ],
    emojiHint: '🎂',
  },
  {
    id: 'animals-fish',
    sentence: [
      { text: 'The ' },
      { answer: 'fish' },
      { text: ' swims in the ' },
      { answer: 'water' },
      { text: '.' },
    ],
    bank: [opt('fish', '🐟', 'fish'), opt('water', '💧', 'water'), opt('tree', '🌳', 'tree'), opt('bird', '🐦', 'bird')],
    emojiHint: '🐟',
  },
  {
    id: 'animals-bird',
    sentence: [
      { text: 'A little ' },
      { answer: 'bird' },
      { text: ' can ' },
      { answer: 'fly' },
      { text: ' high.' },
    ],
    bank: [opt('bird', '🐦', 'bird'), opt('fly', '🕊️', 'fly'), opt('run', '🏃', 'run'), opt('frog', '🐸', 'frog')],
    emojiHint: '🐦',
  },
  {
    id: 'food-banana',
    sentence: [
      { text: 'The ' },
      { answer: 'monkey' },
      { text: ' eats a yellow ' },
      { answer: 'banana' },
      { text: '.' },
    ],
    bank: [
      opt('monkey', '🐵', 'monkey'),
      opt('banana', '🍌', 'banana'),
      opt('lemon', '🍋', 'lemon'),
      opt('pig', '🐷', 'pig'),
    ],
    emojiHint: '🍌',
  },
  {
    id: 'home-window',
    sentence: [
      { text: 'I look through the ' },
      { answer: 'window' },
      { text: ' and see a ' },
      { answer: 'star' },
      { text: '.' },
    ],
    bank: [
      opt('window', '🪟', 'window'),
      opt('star', '⭐', 'star'),
      opt('chair', '🪑', 'chair'),
      opt('lamp', '💡', 'lamp'),
    ],
    emojiHint: '⭐',
  },
  {
    id: 'weather-snow',
    sentence: [
      { text: 'The ' },
      { answer: 'snow' },
      { text: ' is white and very ' },
      { answer: 'cold' },
      { text: '.' },
    ],
    bank: [opt('snow', '❄️', 'snow'), opt('cold', '🥶', 'cold'), opt('fire', '🔥', 'fire'), opt('leaf', '🍃', 'leaf')],
    emojiHint: '❄️',
  },
  {
    id: 'food-egg',
    sentence: [
      { text: 'The ' },
      { answer: 'hen' },
      { text: ' gives us an ' },
      { answer: 'egg' },
      { text: '.' },
    ],
    bank: [opt('hen', '🐔', 'hen'), opt('egg', '🥚', 'egg'), opt('cow', '🐮', 'cow'), opt('bread', '🍞', 'bread')],
    emojiHint: '🥚',
  },
];

/** Pick `count` random distinct items for one play. */
export function pickClozeItems(count: number, pool: ClozeItem[] = CLOZE_ITEMS): ClozeItem[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}
