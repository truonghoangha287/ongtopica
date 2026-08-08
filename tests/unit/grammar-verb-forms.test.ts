import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import {
  VERB_ENTRIES,
  verbEntriesByRule,
  subjectFormsFor,
} from '@/english/grammar/data/verb-forms';

const wordIds = new Set(wordSetRegistry.flatMap((ws) => ws.words).map((w) => w.id));

describe('VERB_ENTRIES', () => {
  it('references only real words', () => {
    for (const entry of VERB_ENTRIES) {
      expect(wordIds.has(entry.subjectWordId), `missing ${entry.subjectWordId}`).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = VERB_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never has base equal to third person', () => {
    for (const entry of VERB_ENTRIES) {
      expect(entry.base).not.toBe(entry.third);
    }
  });
});

describe('verbEntriesByRule', () => {
  const byRule = verbEntriesByRule();

  it('gives verb.s, verb.es and verb.ies at least 4 entries each', () => {
    expect(byRule['verb.s'].length).toBeGreaterThanOrEqual(4);
    expect(byRule['verb.es'].length).toBeGreaterThanOrEqual(4);
    expect(byRule['verb.ies'].length).toBeGreaterThanOrEqual(4);
  });

  it('makes every entry available to verb.base', () => {
    expect(byRule['verb.base'].length).toBe(VERB_ENTRIES.length);
  });
});

describe('subjectFormsFor', () => {
  it('returns singular and plural subject text', () => {
    const teacher = VERB_ENTRIES.find((e) => e.subjectWordId === 'work.teacher');
    expect(teacher).toBeDefined();
    const forms = subjectFormsFor(teacher!);
    expect(forms).toEqual({
      singular: 'the teacher',
      plural: 'the teachers',
      asset: expect.stringContaining('teacher'),
    });
  });

  it('returns null when the subject word has no plural', () => {
    const fake = { ...VERB_ENTRIES[0], subjectWordId: 'colors.blue' };
    expect(subjectFormsFor(fake)).toBeNull();
  });
});
