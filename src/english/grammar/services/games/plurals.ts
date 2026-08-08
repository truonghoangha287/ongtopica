import { pluralOf, pluralWordsByRule } from '@/english/grammar/data/plural-forms';
import type { PluralRuleId, RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const PLURAL_RULES: RuleId[] = [
  'plural.s',
  'plural.es',
  'plural.ies',
  'plural.irregular',
  'plural.uncountable',
  'plural.tantum',
];

const buckets = pluralWordsByRule();

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (!PLURAL_RULES.includes(rule)) return null;
  const word = pickFrom(buckets[rule as PluralRuleId], rng);
  if (!word) return null;

  const picture = { asset: word.pictureAsset, alt: word.text, repeat: 1 };

  // "some milk" is right; "two milks" is the mistake worth catching.
  if (rule === 'plural.uncountable') {
    const answer = `some ${word.text}`;
    return {
      rule,
      picture,
      options: shuffle([answer, `two ${word.text}s`], rng),
      answer,
    };
  }

  // Always-plural words have no singular: "a jeans" is the mistake.
  if (rule === 'plural.tantum') {
    const answer = `some ${word.text}`;
    return {
      rule,
      picture,
      options: shuffle([answer, `a ${word.text}`], rng),
      answer,
    };
  }

  const entry = pluralOf(word);
  if (!entry || entry.plural === null) return null;
  const plural = entry.plural;

  // sheep → sheep: there is no second form to contrast, so contrast against
  // the mistake the child would actually make ("sheeps").
  if (plural === word.text) {
    return {
      rule,
      picture: { ...picture, repeat: 3 },
      options: shuffle([word.text, `${word.text}s`], rng),
      answer: word.text,
    };
  }

  const wantPlural = rng() < 0.5;
  return {
    rule,
    picture: { ...picture, repeat: wantPlural ? 3 : 1 },
    options: shuffle([word.text, plural], rng),
    answer: wantPlural ? plural : word.text,
  };
}

export const PLURALS_GAME: GrammarGame = {
  id: 'plurals',
  rules: PLURAL_RULES,
  buildItem,
};
