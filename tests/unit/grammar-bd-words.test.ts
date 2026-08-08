import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { flipBd, bdCandidates } from '@/english/grammar/data/bd-words';

describe('flipBd', () => {
  it('flips the first b to d', () => {
    expect(flipBd('bear')).toBe('dear');
  });

  it('flips the first d to b', () => {
    expect(flipBd('dog')).toBe('bog');
  });

  it('flips only the first occurrence when both letters appear', () => {
    expect(flipBd('bed')).toBe('ded');
  });

  it('returns null when the word has no b or d', () => {
    expect(flipBd('cat')).toBeNull();
  });
});

describe('bdCandidates', () => {
  const candidates = bdCandidates();
  const realWords = new Set(
    wordSetRegistry.flatMap((ws) => ws.words).map((w) => w.text),
  );

  it('finds a workable number of candidates', () => {
    expect(candidates.length).toBeGreaterThanOrEqual(20);
  });

  it('never offers a distractor that is itself a real vocabulary word', () => {
    for (const c of candidates) {
      expect(realWords.has(c.distractor), `${c.word.text} → ${c.distractor}`).toBe(false);
    }
  });

  it('always differs from the real word by exactly one letter', () => {
    for (const c of candidates) {
      expect(c.distractor).toHaveLength(c.word.text.length);
      const diffs = [...c.word.text].filter((ch, i) => ch !== c.distractor[i]);
      expect(diffs).toHaveLength(1);
    }
  });

  it('only differs on a b/d swap', () => {
    for (const c of candidates) {
      const i = [...c.word.text].findIndex((ch, idx) => ch !== c.distractor[idx]);
      expect(['b', 'd']).toContain(c.word.text[i]);
      expect(['b', 'd']).toContain(c.distractor[i]);
    }
  });
});
