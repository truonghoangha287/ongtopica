import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { GRAMMAR_GAMES, getGame } from '@/english/grammar/services/games';
import { RULE_IDS } from '@/english/grammar/data/rules';

describe('game registry', () => {
  it('registers exactly three games', () => {
    expect(GRAMMAR_GAMES.map((g) => g.id)).toEqual(['plurals', 'verbs', 'bd']);
  });

  it('looks a game up by id', () => {
    expect(getGame('bd')?.rules).toEqual(['letter.bd']);
  });

  it('returns undefined for an unknown game', () => {
    expect(getGame('nope')).toBeUndefined();
  });

  it('only claims rules that exist in the catalog', () => {
    for (const game of GRAMMAR_GAMES) {
      for (const rule of game.rules) expect(RULE_IDS).toContain(rule);
    }
  });

  it('covers all 11 rules exactly once across the three games', () => {
    const claimed = GRAMMAR_GAMES.flatMap((g) => g.rules);
    expect([...claimed].sort()).toEqual([...RULE_IDS].sort());
  });

  it('builds a usable item for every rule it claims', () => {
    for (const game of GRAMMAR_GAMES) {
      for (const rule of game.rules) {
        const item = game.buildItem(rule, makeRng(1));
        expect(item, `${game.id} could not build ${rule}`).not.toBeNull();
        expect(item!.rule).toBe(rule);
        expect(item!.options.length).toBeGreaterThanOrEqual(2);
        expect(item!.options).toContain(item!.answer);
        expect(new Set(item!.options).size).toBe(item!.options.length);
        expect(item!.picture.asset.length).toBeGreaterThan(0);
        expect(item!.picture.alt.length).toBeGreaterThan(0);
        expect(item!.picture.repeat).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = getGame('plurals')!.buildItem('plural.s', makeRng(7));
    const b = getGame('plurals')!.buildItem('plural.s', makeRng(7));
    expect(a).toEqual(b);
  });
});

describe('plurals game', () => {
  const game = getGame('plurals')!;

  it('offers "some X" vs "two Xs" for uncountables', () => {
    const item = game.buildItem('plural.uncountable', makeRng(3))!;
    expect(item.answer.startsWith('some ')).toBe(true);
    expect(item.picture.repeat).toBe(1);
  });

  it('offers "a X" vs "some X" for always-plural words', () => {
    const item = game.buildItem('plural.tantum', makeRng(4))!;
    expect(item.answer.startsWith('some ')).toBe(true);
    expect(item.options.some((o) => o.startsWith('a '))).toBe(true);
  });

  it('never offers two identical options for zero-plural words', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('plural.irregular', makeRng(seed))!;
      expect(new Set(item.options).size).toBe(item.options.length);
    }
  });

  it('shows one picture for a singular answer and three for a plural one', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('plural.s', makeRng(seed))!;
      const isPluralAnswer = item.answer.endsWith('s');
      expect(item.picture.repeat).toBe(isPluralAnswer ? 3 : 1);
    }
  });
});

describe('verbs game', () => {
  const game = getGame('verbs')!;

  it('uses a singular subject and the -es form for verb.es', () => {
    const item = game.buildItem('verb.es', makeRng(5))!;
    expect(item.sentence).toMatch(/^the \w+ ___/);
    expect(item.picture.repeat).toBe(1);
    expect(item.answer.endsWith('es')).toBe(true);
  });

  it('uses a plural subject and the bare form for verb.base', () => {
    const item = game.buildItem('verb.base', makeRng(6))!;
    expect(item.picture.repeat).toBe(2);
    expect(item.rule).toBe('verb.base');
  });

  it('always ends the sentence with a full stop', () => {
    for (let seed = 0; seed < 20; seed++) {
      const item = game.buildItem('verb.s', makeRng(seed))!;
      expect(item.sentence?.endsWith('.')).toBe(true);
    }
  });

  it('never leaves a double space when the object is empty', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('verb.s', makeRng(seed))!;
      expect(item.sentence).not.toMatch(/ {2}/);
      expect(item.sentence).not.toMatch(/ \./);
    }
  });
});

describe('bd game', () => {
  const game = getGame('bd')!;

  it('always attaches the bed-anchor hint', () => {
    const item = game.buildItem('letter.bd', makeRng(8))!;
    expect(item.hint).toBe('bed-anchor');
  });

  it('answers with the real word, not the flipped one', () => {
    for (let seed = 0; seed < 20; seed++) {
      const item = game.buildItem('letter.bd', makeRng(seed))!;
      expect(item.options).toHaveLength(2);
      expect(item.answer).toBe(item.picture.alt);
    }
  });

  it('returns null for a rule it does not own', () => {
    expect(game.buildItem('plural.s', makeRng(1))).toBeNull();
  });
});
