/**
 * Picture-twin lookup across every level.
 *
 * Each level declares its own groups -- Starters has `dad`/`father` and a dozen
 * more, Movers has the UK/US pair `elevator`/`lift` -- and this module is what
 * activities use, so a session that ever mixes levels still cannot offer two
 * words drawn with the same picture as alternatives to each other.
 */
import { SHARED_PICTURE_GROUPS } from '@/data/yle-starters/shared-pictures';
import { MOVERS_SHARED_PICTURE_GROUPS } from '@/data/yle-movers/shared-pictures';

export const ALL_SHARED_PICTURE_GROUPS: readonly (readonly string[])[] = [
  ...SHARED_PICTURE_GROUPS,
  ...MOVERS_SHARED_PICTURE_GROUPS,
];

/** word text -> every other word text drawn with the same picture. */
const TWINS: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of ALL_SHARED_PICTURE_GROUPS) {
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
 * Drop any candidate drawn with the same picture as `target`, so a
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
