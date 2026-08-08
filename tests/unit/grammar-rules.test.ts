import { describe, it, expect } from 'vitest';
import {
  RULES,
  RULE_IDS,
  getRule,
  PLURAL_RULE_IDS,
  VERB_RULE_IDS,
} from '@/english/grammar/data/rules';

describe('rule catalog', () => {
  it('has exactly 11 rules', () => {
    expect(RULES).toHaveLength(11);
    expect(RULE_IDS).toHaveLength(11);
  });

  it('has no duplicate ids', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it('gives every rule a non-empty label and example', () => {
    for (const rule of RULES) {
      expect(rule.label.length).toBeGreaterThan(0);
      expect(rule.example.length).toBeGreaterThan(0);
    }
  });

  it('looks up a rule by id', () => {
    expect(getRule('plural.es')?.example).toBe('watch → watches');
  });

  it('returns undefined for an unknown id', () => {
    expect(getRule('plural.nope')).toBeUndefined();
  });

  it('partitions ids into 6 plural rules and 4 verb rules plus letter.bd', () => {
    expect(PLURAL_RULE_IDS).toHaveLength(6);
    expect(VERB_RULE_IDS).toHaveLength(4);
    expect(RULE_IDS).toContain('letter.bd');
  });
});
