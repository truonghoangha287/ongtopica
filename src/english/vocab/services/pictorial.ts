import type { Word } from '@/shared/types';

/**
 * Whether a word has a real picture, as opposed to a card showing the word
 * itself.
 *
 * The distinction matters wherever the picture would give the answer away: a
 * picture-choice round, Type-the-Word, Unscramble and Fill-in-the-Blank all
 * show `pictureAsset` beside the answer, so a word card there hands the child
 * the spelling. Listening activities are unaffected -- hearing "because" and
 * seeing the written word is a perfectly good pairing.
 */
export const isPictorial = (word: Word): boolean => word.pictorial !== false;

export const pictorialOnly = <T extends Word>(words: readonly T[]): T[] =>
  words.filter(isPictorial);
