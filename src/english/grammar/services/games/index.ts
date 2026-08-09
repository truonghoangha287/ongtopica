import type { GrammarGame } from '@/english/grammar/types';
import { PLURALS_GAME } from './plurals';
import { VERBS_GAME } from './verbs';
import { BD_GAME } from './bd';

export { PLURALS_GAME, VERBS_GAME, BD_GAME };

/** Order matters: this is the order the hub lists the games in. */
export const GRAMMAR_GAMES: GrammarGame[] = [PLURALS_GAME, VERBS_GAME, BD_GAME];

export function getGame(id: string): GrammarGame | undefined {
  return GRAMMAR_GAMES.find((g) => g.id === id);
}
