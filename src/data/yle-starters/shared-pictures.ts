/**
 * Groups of words that are drawn with the same picture.
 *
 * Two kinds of pair end up here:
 *
 *  - **Synonyms.** The Cambridge Starters list carries both halves of
 *    `dad`/`father`, `mum`/`mother`, `grandpa`/`grandfather`,
 *    `grandma`/`grandmother`, `child`/`kid`, `man`/`person`, and the UK/US pair
 *    `rubber`/`eraser`. A child is examined on both spellings, so both are
 *    taught — but they name one thing, so they share one picture.
 *
 *  - **Objects we cannot draw apart.** `tennis` and `tennis racket`,
 *    `skateboard` and `skateboarding`, `cap` and `baseball cap`, plus the
 *    pre-existing `dress`/`skirt`, `jeans`/`trousers`, `ball`/`volleyball`,
 *    `chair`/`table` and `giraffe`/`zoo`.
 *
 * Either way the consequence is the same and it is the reason this file exists:
 * a picture-choice question must never offer two words from the same group,
 * because both taps would be correct and the wrong one would be marked wrong.
 *
 * `tests/unit/shared-pictures.test.ts` fails if a new duplicate emoji is
 * introduced in `scripts/lib/emoji-map.ts` without being listed here.
 */
export const SHARED_PICTURE_GROUPS: readonly (readonly string[])[] = [
  // Synonyms — both forms are on the official wordlist.
  ['dad', 'father'],
  ['mum', 'mother', 'woman'],
  ['grandpa', 'grandfather'],
  ['grandma', 'grandmother'],
  ['child', 'kid'],
  ['man', 'person'],
  ['eraser', 'rubber'],
  ['football', 'soccer'],
  ['shop', 'store'],
  ['chips', 'fries'],
  ['flat', 'apartment'],
  ['television', 'TV'],
  ['house', 'home'],
  ['music', 'song'],
  // Same object under two names, or an object and the sport played with it.
  ['cap', 'baseball cap'],
  ['tennis', 'tennis racket'],
  ['skateboard', 'skateboarding'],
  ['dress', 'skirt'],
  ['jeans', 'trousers'],
  ['ball', 'volleyball'],
  ['chair', 'table'],
  ['giraffe', 'zoo'],
];

/** word text -> every other word text drawn with the same picture. */
const TWINS: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of SHARED_PICTURE_GROUPS) {
    for (const word of group) {
      const twins = map.get(word) ?? new Set<string>();
      for (const other of group) if (other !== word) twins.add(other);
      map.set(word, twins);
    }
  }
  return map;
})();

/** True when the two words are drawn with the same picture. */
export function sharesPicture(a: string, b: string): boolean {
  return TWINS.get(a)?.has(b) ?? false;
}

/**
 * Drop any candidate that is drawn with the same picture as `target`, so a
 * picture-choice round never has two right answers.
 */
export function withoutPictureTwins<T extends { text: string }>(
  target: string,
  candidates: readonly T[],
): T[] {
  const twins = TWINS.get(target);
  if (!twins) return [...candidates];
  return candidates.filter((c) => !twins.has(c.text));
}
