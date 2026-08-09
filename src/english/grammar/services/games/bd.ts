import { bdCandidates } from '@/english/grammar/data/bd-words';
import type { RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const candidates = bdCandidates();

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (rule !== 'letter.bd') return null;
  const candidate = pickFrom(candidates, rng);
  if (!candidate) return null;

  return {
    rule,
    picture: {
      asset: candidate.word.pictureAsset,
      alt: candidate.word.text,
      repeat: 1,
    },
    options: shuffle([candidate.word.text, candidate.distractor], rng),
    answer: candidate.word.text,
    hint: 'bed-anchor',
  };
}

export const BD_GAME: GrammarGame = {
  id: 'bd',
  rules: ['letter.bd'],
  buildItem,
};
