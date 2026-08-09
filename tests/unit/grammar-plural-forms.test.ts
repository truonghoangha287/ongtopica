import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { pluralOf, pluralWordsByRule } from '@/english/grammar/data/plural-forms';
import type { Word } from '@/shared/types';

const findWord = (id: string): Word => {
  const w = wordSetRegistry.flatMap((ws) => ws.words).find((x) => x.id === id);
  if (!w) throw new Error(`fixture word missing: ${id}`);
  return w;
};

describe('pluralOf', () => {
  it('defaults to +s for a regular noun', () => {
    expect(pluralOf(findWord('animals.cat'))).toEqual({
      plural: 'cats',
      rule: 'plural.s',
    });
  });

  it('uses the exception table for -es words', () => {
    expect(pluralOf(findWord('home.box'))).toEqual({
      plural: 'boxes',
      rule: 'plural.es',
    });
  });

  it('handles -o words that take -es, not the generic +s', () => {
    expect(pluralOf(findWord('food.potato'))).toEqual({
      plural: 'potatoes',
      rule: 'plural.es',
    });
  });

  it('handles consonant + y', () => {
    expect(pluralOf(findWord('family.baby'))).toEqual({
      plural: 'babies',
      rule: 'plural.ies',
    });
  });

  it('handles irregulars', () => {
    expect(pluralOf(findWord('body.foot'))).toEqual({
      plural: 'feet',
      rule: 'plural.irregular',
    });
  });

  it('treats zero-plural words as irregular with an unchanged form', () => {
    expect(pluralOf(findWord('animals.sheep'))).toEqual({
      plural: 'sheep',
      rule: 'plural.irregular',
    });
  });

  it('gives uncountables a null plural', () => {
    expect(pluralOf(findWord('food.water'))).toEqual({
      plural: null,
      rule: 'plural.uncountable',
    });
  });

  it('marks always-plural words as tantum with an unchanged form', () => {
    expect(pluralOf(findWord('clothes.jeans'))).toEqual({
      plural: 'jeans',
      rule: 'plural.tantum',
    });
  });

  it('excludes adjectives by wordId, not by text', () => {
    expect(pluralOf(findWord('colors.orange'))).toBeNull();
    expect(pluralOf(findWord('food.orange'))).toEqual({
      plural: 'oranges',
      rule: 'plural.s',
    });
  });
});

describe('pluralWordsByRule', () => {
  const byRule = pluralWordsByRule();

  it('gives every plural rule at least 4 usable words', () => {
    for (const [rule, words] of Object.entries(byRule)) {
      expect(words.length, `rule ${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
  });

  it('never places an excluded word in a bucket', () => {
    const all = Object.values(byRule).flat();
    expect(all.some((w) => w.id === 'colors.blue')).toBe(false);
  });
});
