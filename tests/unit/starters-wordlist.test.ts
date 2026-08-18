import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { wordSetRegistry, getWordSet } from '@/data/yle-starters/index';
import { WORD_SET_ICONS } from '@/data/yle-starters/icons';
import vocabEn from '@/locales/en/vocab.json';

const allWords = wordSetRegistry.flatMap((ws) => ws.words);

/** Asset filenames are slugged, so multi-word entries stay URL-safe. */
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

describe('word set registry', () => {
  it('gives every set an icon and a translated display name', () => {
    for (const wordSet of wordSetRegistry) {
      expect(WORD_SET_ICONS[wordSet.id], `${wordSet.id} has no icon`).toBeDefined();
      expect(
        (vocabEn.wordSets as Record<string, string>)[wordSet.id],
        `${wordSet.id} has no display name`,
      ).toBe(wordSet.displayName);
    }
  });

  it('scopes every word id to its set and slugs its assets', () => {
    for (const wordSet of wordSetRegistry) {
      for (const word of wordSet.words) {
        expect(word.wordSetId).toBe(wordSet.id);
        expect(word.id).toBe(`${wordSet.id}.${slug(word.text)}`);
        expect(word.pictureAsset).toBe(`/assets/images/${slug(word.text)}.webp`);
        expect(word.audioAsset).toBe(`/assets/audio/${slug(word.text)}.mp3`);
      }
    }
  });

  it('blanks a letter that is actually offered as a choice', () => {
    for (const word of allWords) {
      const blanked = word.text[word.blankLetterIndex];
      expect(blanked, `${word.text} blanks out of range`).toBeDefined();
      expect(blanked, `${word.text} blanks a space`).not.toBe(' ');
      expect(word.letterChoices).toHaveLength(3);
      expect(new Set(word.letterChoices).size).toBe(3);
      expect(word.letterChoices, `${word.text} omits its own letter`).toContain(
        blanked.toLowerCase(),
      );
    }
  });

  it('has a generated image and audio file for every word', () => {
    const missing = allWords.flatMap((word) => [
      ...(existsSync(join(process.cwd(), 'public', word.pictureAsset)) ? [] : [word.pictureAsset]),
      ...(existsSync(join(process.cwd(), 'public', word.audioAsset)) ? [] : [word.audioAsset]),
    ]);
    expect(missing).toEqual([]);
  });
});

// The two topics added by the 2026 Cambridge wordlist audit. Both cover
// Starters areas the app previously had no words for at all.
describe('nature and time word sets', () => {
  it('registers Nature with the five outdoor Starters nouns', () => {
    const nature = getWordSet('nature');
    expect(nature?.displayName).toBe('Nature');
    expect(nature?.words.map((w) => w.text)).toEqual(['sea', 'sand', 'shell', 'tree', 'flower']);
  });

  it('registers Time with the six Starters time words', () => {
    const time = getWordSet('time');
    expect(time?.displayName).toBe('Time');
    expect(time?.words.map((w) => w.text)).toEqual([
      'morning',
      'afternoon',
      'evening',
      'night',
      'day',
      'birthday',
    ]);
  });
});
