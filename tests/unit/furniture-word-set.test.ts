import { describe, it, expect } from 'vitest';
import { wordSetRegistry, getWordSet } from '@/data/yle-starters/index';
import { WORD_SET_ICONS } from '@/data/yle-starters/icons';
import vocabEn from '@/locales/en/vocab.json';

const EXPECTED_WORDS = [
  'wardrobe', 'shelf', 'bookcase', 'drawer', 'carpet',
  'curtain', 'cushion', 'blanket', 'fridge', 'stool',
  'bin', 'plant', 'basket', 'candle', 'vase',
];

describe('furniture word set', () => {
  const furniture = getWordSet('furniture');

  it('is registered with the expected display name', () => {
    expect(furniture).toBeDefined();
    expect(furniture!.displayName).toBe('Furniture');
  });

  it('contains exactly the 15 designed words', () => {
    expect(furniture!.words.map((w) => w.text)).toEqual(EXPECTED_WORDS);
  });

  it('gives every word a furniture-scoped id and set id', () => {
    for (const word of furniture!.words) {
      expect(word.wordSetId).toBe('furniture');
      expect(word.id).toBe(`furniture.${word.text}`);
    }
  });

  it('points every word at text-keyed image and audio assets', () => {
    for (const word of furniture!.words) {
      expect(word.pictureAsset).toBe(`/assets/images/${word.text}.webp`);
      expect(word.audioAsset).toBe(`/assets/audio/${word.text}.mp3`);
    }
  });

  it('blanks a letter that is actually offered as a choice', () => {
    for (const word of furniture!.words) {
      expect(word.blankLetterIndex).toBeGreaterThanOrEqual(0);
      expect(word.blankLetterIndex).toBeLessThan(word.text.length);
      expect(word.letterChoices).toHaveLength(3);
      expect(word.letterChoices).toContain(word.text[word.blankLetterIndex]);
      expect(new Set(word.letterChoices).size).toBe(3);
    }
  });

  // Guards the core design decision. Deliberately scoped to furniture: the
  // registry already contains three intentional dual-category duplicates
  // (chicken, fish, orange), so a registry-wide uniqueness check would fail.
  it('shares no word with any other topic', () => {
    const others = new Map<string, string>();
    for (const set of wordSetRegistry) {
      if (set.id === 'furniture') continue;
      for (const word of set.words) others.set(word.text, set.id);
    }
    const collisions = furniture!.words
      .filter((w) => others.has(w.text))
      .map((w) => `${w.text} (already in ${others.get(w.text)})`);
    expect(collisions).toEqual([]);
  });

  it('has an icon and a translated display name', () => {
    expect(WORD_SET_ICONS.furniture).toBe('🛋️');
    // Cast: the key does not exist in the JSON yet, and this test is written
    // before Step 6 adds it. Without the cast `pnpm typecheck` would fail on
    // the intermediate state.
    expect((vocabEn.wordSets as Record<string, string>).furniture).toBe('Furniture');
  });
});
