/**
 * Every word set the app can teach, across levels.
 *
 * The per-level registries stay exactly as they are -- `yle-starters/index.ts`
 * is hand-authored and `yle-movers/index.ts` is generated -- and this module is
 * the only place that knows both exist. Consumers that resolve a topic by id or
 * list the topics import from here rather than reaching into a level.
 */
import type { WordSet } from '@/shared/types';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { WORD_SET_ICONS } from '@/data/yle-starters/icons';
import { moversWordSetRegistry } from '@/data/yle-movers/index';
import { MOVERS_WORD_SET_ICONS } from '@/data/yle-movers/icons';
import { levelOfWordSet, type LevelId } from '@/english/vocab/data/levels';

export const allWordSets: WordSet[] = [...wordSetRegistry, ...moversWordSetRegistry];

export function wordSetsForLevel(level: LevelId): WordSet[] {
  return allWordSets.filter((ws) => levelOfWordSet(ws.id) === level);
}

export function getWordSet(id: string): WordSet | undefined {
  return allWordSets.find((ws) => ws.id === id);
}

const ICONS: Record<string, string> = { ...WORD_SET_ICONS, ...MOVERS_WORD_SET_ICONS };

export const wordSetIcon = (id: string): string => ICONS[id] ?? '⭐';
