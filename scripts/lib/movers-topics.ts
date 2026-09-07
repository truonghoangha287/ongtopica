/**
 * How the A1 Movers wordlist is grouped into playable topics.
 *
 * Hand-authored: the thematic pages of the Cambridge PDF give a topic for 247
 * of the 399 words, and this file decides everything the source leaves open --
 * which Cambridge topics are worth their own set, where the 152 untopiced words
 * go, and what each set is called and coloured.
 *
 * Two constraints shaped the grouping:
 *
 *   Sets must be playable. Memory Match deals MEMORY_MATCH_PAIRS (6) pairs and
 *   picture-choice needs distractors, so a set of 5 words cannot fill a round.
 *   MIN_SET_SIZE is enforced by the generator, which is why Cambridge's
 *   Clothes (5), Numbers (2) and Toys (1) additions are folded into neighbours
 *   rather than shipped as unplayable sets of their own.
 *
 *   A noun always gets a real topic. Words with no thematic entry fall back to
 *   part-of-speech buckets, but that is right only for verbs, adjectives and
 *   function words -- a concrete noun landing in "Action Words" is a bug, so
 *   the generator hard-fails on an untopiced noun and TOPIC_OVERRIDES below
 *   places each one deliberately.
 */
import type { Pos } from './movers-normalize.ts';

/** Below this a set cannot fill a Memory Match deck or a picture-choice round. */
export const MIN_SET_SIZE = 8;

export interface MoversTopic {
  /** Word-set id. The `movers-` prefix is what carries the level. */
  id: string;
  /** English display name; also the i18n key's expected value. */
  displayName: string;
  /** Home-tile emoji, mirroring WORD_SET_ICONS. */
  icon: string;
  /** Card background for generated pictures, mirroring SET_BACKGROUNDS. */
  background: { r: number; g: number; b: number };
  /** Thematic-list headers that route here, verbatim from the PDF. */
  pdfHeaders: string[];
  /** Set when this is a part-of-speech fallback rather than a real topic. */
  posBucket?: Pos[];
}

export const MOVERS_TOPICS: readonly MoversTopic[] = [
  {
    id: 'movers-animals',
    displayName: 'Animals',
    icon: '🦋',
    background: { r: 200, g: 230, b: 255 },
    pdfHeaders: ['Animals'],
  },
  {
    id: 'movers-body',
    // Cambridge adds only 5 clothes words at Movers, too few to play. They sit
    // naturally with the appearance words (beard, curly, blond, fat, thin)
    // this set already holds: together they are "how a person looks".
    displayName: 'Body & Clothes',
    icon: '✋',
    background: { r: 255, g: 220, b: 210 },
    pdfHeaders: ['The body and the face', 'Clothes'],
  },
  {
    id: 'movers-family',
    displayName: 'Family & Friends',
    icon: '👨‍👩‍👧',
    background: { r: 255, g: 225, b: 200 },
    pdfHeaders: ['Family & friends'],
  },
  {
    id: 'movers-food',
    displayName: 'Food & Drink',
    icon: '🍎',
    background: { r: 220, g: 250, b: 215 },
    pdfHeaders: ['Food & drink'],
  },
  {
    id: 'movers-health',
    displayName: 'Health',
    icon: '🩹',
    background: { r: 255, g: 235, b: 235 },
    pdfHeaders: ['Health'],
  },
  {
    id: 'movers-home',
    displayName: 'Home',
    icon: '🏠',
    background: { r: 255, g: 235, b: 200 },
    pdfHeaders: ['The home'],
  },
  {
    id: 'movers-names',
    displayName: 'Names',
    icon: '🙋',
    background: { r: 255, g: 215, b: 230 },
    pdfHeaders: ['Names'],
  },
  {
    id: 'movers-nature',
    displayName: 'World & Nature',
    icon: '🌍',
    background: { r: 214, g: 240, b: 200 },
    pdfHeaders: ['The world around us'],
  },
  {
    id: 'movers-places',
    displayName: 'Places & Directions',
    icon: '🏙️',
    background: { r: 200, g: 240, b: 230 },
    pdfHeaders: ['Places & directions'],
  },
  {
    id: 'movers-school',
    // Absorbs Cambridge's two Movers Numbers words (hundred, pair), which
    // cannot stand as a set and are school-maths vocabulary anyway.
    displayName: 'School',
    icon: '🏫',
    background: { r: 215, g: 235, b: 255 },
    pdfHeaders: ['School', 'Numbers'],
  },
  {
    id: 'movers-sports',
    // Absorbs Toys, whose sole Movers addition is `model`.
    displayName: 'Sports & Leisure',
    icon: '⚽',
    background: { r: 210, g: 255, b: 220 },
    pdfHeaders: ['Sports & leisure', 'Toys'],
  },
  {
    id: 'movers-time',
    displayName: 'Time',
    icon: '🕐',
    background: { r: 255, g: 240, b: 215 },
    pdfHeaders: ['Time'],
  },
  {
    id: 'movers-transport',
    displayName: 'Transport',
    icon: '🚂',
    background: { r: 200, g: 220, b: 245 },
    pdfHeaders: ['Transport'],
  },
  {
    id: 'movers-weather',
    displayName: 'Weather',
    icon: '⛈️',
    background: { r: 230, g: 245, b: 255 },
    pdfHeaders: ['Weather'],
  },
  {
    id: 'movers-work',
    displayName: 'Work & Jobs',
    icon: '👷',
    background: { r: 240, g: 230, b: 255 },
    pdfHeaders: ['Work'],
  },

  // ---- Part-of-speech fallbacks, for words the thematic list never places ----
  {
    id: 'movers-verbs',
    displayName: 'Action Words',
    icon: '🏃',
    background: { r: 255, g: 228, b: 205 },
    pdfHeaders: [],
    posBucket: ['v'],
  },
  {
    id: 'movers-adjectives',
    displayName: 'Describing Words',
    icon: '🌈',
    background: { r: 245, g: 225, b: 250 },
    pdfHeaders: [],
    posBucket: ['adj'],
  },
  {
    id: 'movers-words',
    // Function words plus the handful of abstract nouns with no thematic home
    // (idea, difference, kind). "More Words" is deliberately vague: what these
    // share is that none of them is a thing you can point at.
    displayName: 'More Words',
    icon: '🔤',
    background: { r: 235, g: 235, b: 240 },
    pdfHeaders: [],
    posBucket: ['adv', 'prep', 'det', 'pron', 'conj', 'excl', 'int', 'dis', 'poss', 'num'],
  },
] as const;

/**
 * Where a word goes when the thematic list does not place it, keyed by slug.
 *
 * Every entry here is a noun: the generator refuses to bucket a noun by
 * part-of-speech, so this list is exactly the set of nouns Cambridge's thematic
 * pages omit. Regenerate the stubs with `npm run gen:movers -- --stub`.
 */
export const TOPIC_OVERRIDES: Readonly<Record<string, string>> = {
  age: 'movers-family',
  app: 'movers-school',
  bottom: 'movers-places',
  difference: 'movers-words',
  'e-book': 'movers-school',
  idea: 'movers-words',
  inside: 'movers-places',
  jungle: 'movers-nature',
  kind: 'movers-words',
  laptop: 'movers-school',
  laugh: 'movers-words',
  machine: 'movers-home',
  noise: 'movers-words',
  outside: 'movers-places',
  shape: 'movers-school',
  shopping: 'movers-sports',
  top: 'movers-places',
  treasure: 'movers-sports',
};

const BY_HEADER = new Map<string, string>(
  MOVERS_TOPICS.flatMap((topic) => topic.pdfHeaders.map((header) => [header, topic.id])),
);

export const topicForPdfHeader = (header: string): string | undefined =>
  BY_HEADER.get(header);

export const topicForPos = (pos: Pos): string | undefined =>
  MOVERS_TOPICS.find((topic) => topic.posBucket?.includes(pos))?.id;

export const getTopic = (id: string): MoversTopic | undefined =>
  MOVERS_TOPICS.find((topic) => topic.id === id);
