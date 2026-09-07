import { describe, it, expect } from 'vitest';
import { normalizeEntry, normalizeThematic } from '../../scripts/lib/movers-normalize';

/**
 * Table-driven over the exact strings the Cambridge PDF actually contains.
 *
 * Every case here is a line that was found in the real extraction, not an
 * invented one -- the parenthetical, slash and multi-tag shapes are the whole
 * reason this module exists, and a rule that only works on tidy input would
 * pass a test built from tidy input.
 */
describe('normalizeEntry', () => {
  const cases: Array<{
    raw: string;
    text: string;
    variants?: string[];
    note?: string;
    pluralForm?: string;
    primaryPos: string;
    pos?: string[];
  }> = [
    { raw: 'dolphin n', text: 'dolphin', primaryPos: 'n', pos: ['n'] },
    // Several tags at once; the most concrete one wins.
    {
      raw: 'all adj + adv + det + pron',
      text: 'all',
      primaryPos: 'adj',
      pos: ['adj', 'adv', 'det', 'pron'],
    },
    { raw: 'cook n + v', text: 'cook', primaryPos: 'n', pos: ['n', 'v'] },
    // Cambridge appends a qualifier to some tags.
    { raw: 'at prep of time', text: 'at', primaryPos: 'prep', pos: ['prep'] },
    // Regional pair, trailing.
    { raw: 'centre (US center) n', text: 'centre', variants: ['center'], primaryPos: 'n' },
    { raw: 'lift (US elevator) n', text: 'lift', variants: ['elevator'], primaryPos: 'n' },
    // Regional pair, infix: the variant swaps the annotated token only, so this
    // is "movie star" and never "film movie star".
    { raw: 'film (US movie) star n', text: 'film star', variants: ['movie star'], primaryPos: 'n' },
    // Slash resolved before the parenthetical, or the variant keeps the slash.
    {
      raw: 'city/town centre (US center) n',
      text: 'city centre',
      variants: ['town centre', 'city center'],
      primaryPos: 'n',
    },
    // Singular/plural pair is one card, not two.
    { raw: 'leaf/leaves n', text: 'leaf', variants: ['leaves'], pluralForm: 'leaves', primaryPos: 'n' },
    { raw: 'tooth/teeth n', text: 'tooth', variants: ['teeth'], pluralForm: 'teeth', primaryPos: 'n' },
    // Inflection marker written inside the word.
    { raw: 'blond(e) adj', text: 'blond', variants: ['blonde'], primaryPos: 'adj' },
    { raw: 'stair(s) n', text: 'stair', variants: ['stairs'], primaryPos: 'n' },
    // An optional particle makes a second real phrase...
    { raw: 'wake (up) v', text: 'wake', variants: ['wake up'], primaryPos: 'v' },
    { raw: 'have (got) to v', text: 'have to', variants: ['have got to'], primaryPos: 'v' },
    // ...but a sense gloss is a footnote, not a phrase. Guards the regression
    // where any lowercase word was treated as optional and `band (music)`
    // produced the variant "band music".
    { raw: 'band (music) n', text: 'band', note: 'music', primaryPos: 'n' },
    { raw: 'catch (e.g. a bus) v', text: 'catch', note: 'e.g. a bus', primaryPos: 'v' },
    { raw: 'floor (e.g. ground, 1st, etc.) n', text: 'floor', note: 'e.g. ground, 1st, etc.', primaryPos: 'n' },
    // Capitalisation is preserved: the child is examined on these spellings.
    { raw: 'Friday n', text: 'Friday', primaryPos: 'n' },
    { raw: 'CD n', text: 'CD', primaryPos: 'n' },
    // Accented letters survive; slug() folds them for the filename separately.
    { raw: 'café n', text: 'café', primaryPos: 'n' },
    { raw: "o'clock adv", text: "o'clock", primaryPos: 'adv' },
  ];

  for (const testCase of cases) {
    it(`normalizes ${JSON.stringify(testCase.raw)}`, () => {
      const result = normalizeEntry(testCase.raw);
      expect(result.needsReview, result.reviewReason).toBe(false);
      expect(result.text).toBe(testCase.text);
      expect(result.variants).toEqual(testCase.variants ?? []);
      expect(result.primaryPos).toBe(testCase.primaryPos);
      if (testCase.pos) expect(result.pos).toEqual(testCase.pos);
      if (testCase.note) expect(result.note).toBe(testCase.note);
      if (testCase.pluralForm) expect(result.pluralForm).toBe(testCase.pluralForm);
      else expect(result.pluralForm).toBeUndefined();
    });
  }

  it('never lets a slash, bracket or tag reach the text a child types', () => {
    for (const testCase of cases) {
      expect(normalizeEntry(testCase.raw).text).toMatch(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]*$/);
    }
  });

  it('flags an unrecognised line instead of guessing at it', () => {
    const result = normalizeEntry('something with no tag at the end!');
    expect(result.needsReview).toBe(true);
    expect(result.reviewReason).toBeTruthy();
  });
});

describe('normalizeThematic', () => {
  it('matches the surface form the A-Z pass produces, so topics attach', () => {
    expect(normalizeThematic('centre (US center)')).toBe('centre');
    expect(normalizeThematic('floor (e.g. ground, 1st, etc.)')).toBe('floor');
    expect(normalizeThematic('leaf/leaves')).toBe('leaf');
    expect(normalizeThematic('stair(s)')).toBe('stair');
  });

  it('rejects the entries that are not words at all', () => {
    // The Numbers row lists ranges rather than vocabulary.
    expect(normalizeThematic('21–100')).toBeNull();
    expect(normalizeThematic('1st–20th')).toBeNull();
  });
});
