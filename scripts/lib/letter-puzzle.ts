/**
 * Derive the Fill-in-the-Blank puzzle for a word: which letter to hide, and the
 * three choices offered in its place.
 *
 * The Starters corpus was authored by hand; this reproduces the shape of those
 * 336 puzzles from a seed so ~400 more can be generated without a human picking
 * each one. Measured against the hand-authored set, which is where the rules
 * below come from: 323/336 blanks are vowels, 70% sit at index 1 and 27% at
 * index 2, and index 0 is blanked exactly twice.
 *
 * One hard invariant, learned from a real bug. `src/data/yle-starters/home.json`
 * blanks the uppercase `V` of `TV` and offers `["v","b","c"]`, but
 * FillInBlankActivity compares `letter === correctLetter` case-sensitively, so
 * the word is unwinnable -- the child spends every retry and gets a reveal.
 * The fix is not to avoid uppercase letters but to keep the choices in the same
 * case as the letter they replace, so `CD` blanks `D` and offers `D/B/P`. That
 * makes the broken state unreachable by construction while still giving every
 * acronym and proper name a real puzzle.
 */
import { rngFor, shuffle, type Rng } from './seeded-rng.ts';

export interface LetterPuzzle {
  blankLetterIndex: number;
  letterChoices: [string, string, string];
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
/** Index 0 is the strongest retrieval cue, so it is never hidden. */
const FIRST_BLANKABLE_INDEX = 1;
/** Blanks cluster at the front of the word in the hand-authored corpus. */
const PREFERRED_MAX_INDEX = 2;
const CHOICE_COUNT = 3;

/**
 * Letters a young child actually confuses, most-confusable first: vowels with
 * each other, and the classic reversal and shape pairs (b/d/p/q, m/n/w).
 * Picking distractors from here makes the choice a real discrimination rather
 * than an obvious throwaway.
 */
const CONFUSABLE: Readonly<Record<string, readonly string[]>> = {
  a: ['e', 'o', 'u', 'i'], e: ['a', 'i', 'o', 'u'], i: ['e', 'a', 'o', 'u'],
  o: ['a', 'u', 'e', 'i'], u: ['o', 'a', 'e', 'i'],
  b: ['d', 'p', 'h'], d: ['b', 'p', 'q'], p: ['b', 'q', 'd'], q: ['p', 'g', 'b'],
  m: ['n', 'w', 'h'], n: ['m', 'r', 'h'], w: ['v', 'm', 'u'], v: ['w', 'u', 'y'],
  f: ['t', 'l', 'k'], t: ['f', 'l', 'r'], g: ['j', 'q', 'y'], j: ['g', 'y', 'i'],
  s: ['z', 'c', 'x'], z: ['s', 'x', 'c'], c: ['k', 's', 'o'], k: ['c', 'x', 'h'],
  l: ['i', 't', 'h'], r: ['n', 'h', 'k'], h: ['n', 'b', 'k'], x: ['k', 'z', 's'],
  y: ['v', 'g', 'j'],
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * Choose the index to blank.
 *
 * Only unaccented ASCII letters are eligible, which rules out spaces, hyphens,
 * apostrophes and accents -- everything the on-screen choices cannot represent.
 */
function chooseIndex(text: string, rng: Rng): number | null {
  const candidates = [...text]
    .map((char, index) => ({ char: char.toLowerCase(), index }))
    .filter(({ char, index }) => index >= FIRST_BLANKABLE_INDEX && /^[a-z]$/.test(char));
  if (candidates.length === 0) return null;

  const vowels = candidates.filter(({ char }) => VOWELS.has(char));
  const pool = vowels.length > 0 ? vowels : candidates;

  const early = pool.filter(({ index }) => index <= PREFERRED_MAX_INDEX);
  if (early.length > 0) return early[Math.floor(rng() * early.length)].index;
  return pool[0].index;
}

/**
 * Pick two wrong letters.
 *
 * A distractor is rejected when substituting it spells another word the child
 * is being taught: without that check `b_t` offers bat/bet/bit and has three
 * defensible answers.
 */
function chooseDistractors(
  text: string,
  index: number,
  rng: Rng,
  corpus: ReadonlySet<string>,
): string[] {
  const correct = text[index];
  const lower = correct.toLowerCase();
  // A distractor replaces the blanked letter on screen, so it has to look like
  // it belongs: uppercase letter, uppercase choices.
  const matchCase = (letter: string) =>
    correct === correct.toUpperCase() ? letter.toUpperCase() : letter;
  const ambiguous = (letter: string) =>
    corpus.has((text.slice(0, index) + letter + text.slice(index + 1)).toLowerCase());

  const preferred = shuffle(rng, CONFUSABLE[lower] ?? []);
  const fallback = shuffle(rng, ALPHABET);

  const chosen: string[] = [];
  for (const letter of [...preferred, ...fallback]) {
    if (chosen.length === CHOICE_COUNT - 1) break;
    if (letter === lower || chosen.includes(matchCase(letter))) continue;
    if (ambiguous(letter)) continue;
    chosen.push(matchCase(letter));
  }
  return chosen;
}

/**
 * @param text    the word as the child sees it
 * @param seedKey stable per-word key (the word id), so a word's puzzle never
 *                changes when a neighbouring word is added or removed
 * @param corpus  every taught word, lowercased, for the ambiguity check
 * @returns null when the word has no blankable ASCII letter after index 0
 */
export function deriveLetterPuzzle(
  text: string,
  seedKey: string,
  corpus: ReadonlySet<string>,
): LetterPuzzle | null {
  const rng = rngFor(seedKey);
  const blankLetterIndex = chooseIndex(text, rng);
  if (blankLetterIndex === null) return null;

  const correct = text[blankLetterIndex];
  const distractors = chooseDistractors(text, blankLetterIndex, rng, corpus);
  if (distractors.length < CHOICE_COUNT - 1) return null;

  const letterChoices: [string, string, string] = [correct, distractors[0], distractors[1]];

  // The activity reads text[blankLetterIndex] and compares it against a choice
  // with ===, so these must hold exactly, not case-insensitively.
  if (new Set(letterChoices).size !== CHOICE_COUNT) {
    throw new Error(`duplicate letterChoices for "${text}": ${letterChoices.join(',')}`);
  }
  if (!letterChoices.includes(text[blankLetterIndex])) {
    throw new Error(`letterChoices for "${text}" omit the blanked letter`);
  }
  return { blankLetterIndex, letterChoices };
}
