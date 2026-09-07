/**
 * Cambridge exam levels.
 *
 * The level is carried by the word-set id: Starters sets are `animals`,
 * `food`, ...; Movers sets are `movers-animals`, `movers-food`. That one
 * decision is why adding a level needed no database change -- `wordProgress.id`
 * is `${childId}:${wordId}` and a word id embeds its set id, so Movers progress
 * can never collide with the Starters row for the same word. It also means the
 * existing `/skill/:skillId/:topicId` routes already carry the level.
 */
export type LevelId = 'starters' | 'movers' | 'flyers';

export interface Level {
  id: LevelId;
  title: string;
  /** Prefix on this level's word-set ids. Empty for Starters, the original set. */
  prefix: string;
  /** Flyers is listed so the ladder is visible, but has no content yet. */
  locked: boolean;
}

export const LEVELS: readonly Level[] = [
  { id: 'starters', title: 'Starters', prefix: '', locked: false },
  { id: 'movers', title: 'Movers', prefix: 'movers-', locked: false },
  { id: 'flyers', title: 'Flyers', prefix: 'flyers-', locked: true },
];

export const DEFAULT_LEVEL: LevelId = 'starters';

/** Which level a word set belongs to. Unprefixed ids are Starters. */
export function levelOfWordSet(wordSetId: string): LevelId {
  const prefixed = LEVELS.find((level) => level.prefix && wordSetId.startsWith(level.prefix));
  return prefixed?.id ?? 'starters';
}

export const getLevel = (id: string): Level | undefined =>
  LEVELS.find((level) => level.id === id);
