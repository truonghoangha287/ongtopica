/**
 * Movers words that are deliberately drawn with the same picture.
 *
 * The Cambridge Movers list carries both halves of several UK/US pairs, and a
 * child is examined on both spellings -- but they name one thing, so they share
 * one picture. Same consequence as the Starters equivalent in
 * `src/data/yle-starters/shared-pictures.ts`: a picture-choice round must never
 * offer two words from one group, because both taps would be right and one
 * would be marked wrong.
 *
 * This list is also what exempts a group from the generator's duplicate-picture
 * check. Anything sharing a picture without being listed here is a mistake, not
 * a synonym, and the build fails.
 */
export const MOVERS_SHARED_PICTURE_GROUPS: readonly (readonly string[])[] = [
  // UK/US pairs, both on the official wordlist.
  ['elevator', 'lift'],
];
