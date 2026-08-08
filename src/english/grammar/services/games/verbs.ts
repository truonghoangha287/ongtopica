import { verbEntriesByRule, subjectFormsFor } from '@/english/grammar/data/verb-forms';
import type { VerbRuleId, RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const VERB_RULES: RuleId[] = ['verb.base', 'verb.s', 'verb.es', 'verb.ies'];

/** "the teacher ___ English." — no double spaces when the object is empty. */
function sentenceFor(subject: string, object: string): string {
  return `${subject} ___${object ? ` ${object}` : ''}.`;
}

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (!VERB_RULES.includes(rule)) return null;

  const entry = pickFrom(verbEntriesByRule()[rule as VerbRuleId], rng);
  if (!entry) return null;

  const forms = subjectFormsFor(entry);
  if (!forms) return null;

  // A plural subject takes the bare form; a singular one takes the ending.
  const isBase = rule === 'verb.base';
  const subject = isBase ? forms.plural : forms.singular;

  return {
    rule,
    picture: {
      asset: forms.asset,
      alt: subject,
      // Two pictures make "the teachers" visibly plural.
      repeat: isBase ? 2 : 1,
    },
    sentence: sentenceFor(subject, entry.object),
    options: shuffle([entry.base, entry.third], rng),
    answer: isBase ? entry.base : entry.third,
  };
}

export const VERBS_GAME: GrammarGame = {
  id: 'verbs',
  rules: VERB_RULES,
  buildItem,
};
