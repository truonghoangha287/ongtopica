import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { RULE_IDS } from '@/english/grammar/data/rules';
import {
  PLURAL_EXCEPTIONS,
  PLURAL_EXCLUDED_IDS,
  pluralOf,
  pluralWordsByRule,
} from '@/english/grammar/data/plural-forms';
import { VERB_ENTRIES, verbEntriesByRule } from '@/english/grammar/data/verb-forms';

const allWords = wordSetRegistry.flatMap((ws) => ws.words);

describe('grammar data integrity', () => {
  it('references only rule ids from the catalog', () => {
    for (const entry of Object.values(PLURAL_EXCEPTIONS)) {
      expect(RULE_IDS).toContain(entry.rule);
    }
    for (const entry of VERB_ENTRIES) {
      expect(RULE_IDS).toContain(entry.rule);
    }
  });

  it('excludes only wordIds that actually exist', () => {
    const ids = new Set(allWords.map((w) => w.id));
    for (const id of PLURAL_EXCLUDED_IDS) {
      expect(ids.has(id), `stale exclusion: ${id}`).toBe(true);
    }
  });

  // This is the guard that makes the "+s by default" shortcut safe.
  it('never lets a tricky ending fall through to the +s default', () => {
    // `f`/`fe` earn a place here the hard way: the furniture topic arrived with
    // `shelf`, which the +s default happily turned into "shelfs".
    const tricky = /(ch|sh|ss|s|x|z|o|f|fe)$|[^aeiou]y$/;
    for (const word of allWords) {
      if (PLURAL_EXCLUDED_IDS.has(word.id)) continue;
      if (!tricky.test(word.text)) continue;
      expect(
        PLURAL_EXCEPTIONS[word.text],
        `"${word.text}" needs an explicit entry in PLURAL_EXCEPTIONS`,
      ).toBeDefined();
    }
  });

  it('gives a non-empty plural to everything except uncountables', () => {
    for (const word of allWords) {
      const entry = pluralOf(word);
      if (!entry) continue;
      if (entry.rule === 'plural.uncountable') {
        expect(entry.plural).toBeNull();
      } else {
        expect(entry.plural, `"${word.text}" has an empty plural`).toBeTruthy();
      }
    }
  });

  it('gives every rule that a game draws on at least 4 items', () => {
    const plural = pluralWordsByRule();
    for (const [rule, words] of Object.entries(plural)) {
      expect(words.length, `${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
    const verbs = verbEntriesByRule();
    for (const [rule, entries] of Object.entries(verbs)) {
      expect(entries.length, `${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
  });
});
