import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import {
  SHARED_PICTURE_GROUPS,
  sharesPicture,
  withoutPictureTwins,
} from '@/data/yle-starters/shared-pictures';
import { selectDistractors } from '@/english/vocab/services/session-composer';
import { pickMemoryWords } from '@/english/vocab/services/memory-match';
import { EMOJI_MAP, AI_FALLBACK } from '../../scripts/lib/emoji-map';

const allWords = wordSetRegistry.flatMap((ws) => ws.words);
const wordTexts = new Set(allWords.map((w) => w.text));

describe('shared pictures', () => {
  it('names only words that are actually in the registry', () => {
    for (const group of SHARED_PICTURE_GROUPS) {
      for (const text of group) {
        expect(wordTexts.has(text), `stale shared-picture entry: ${text}`).toBe(true);
      }
    }
  });

  // The guard that keeps this file honest: adding a word to emoji-map.ts with an
  // emoji another word already uses is exactly how a double-correct picture
  // round gets shipped, and it is invisible until a child is marked wrong.
  it('covers every pair of words that render from the same emoji', () => {
    const byEmoji = new Map<string, string[]>();
    for (const [word, entry] of Object.entries(EMOJI_MAP)) {
      if (entry === AI_FALLBACK || !wordTexts.has(word)) continue;
      byEmoji.set(entry, [...(byEmoji.get(entry) ?? []), word]);
    }

    const uncovered: string[] = [];
    for (const [emoji, words] of byEmoji) {
      if (words.length < 2) continue;
      for (const a of words) {
        for (const b of words) {
          if (a !== b && !sharesPicture(a, b)) uncovered.push(`${a}/${b} (both ${emoji})`);
        }
      }
    }
    expect(uncovered).toEqual([]);
  });

  it('is symmetric and never marks a word as its own twin', () => {
    for (const group of SHARED_PICTURE_GROUPS) {
      for (const a of group) {
        expect(sharesPicture(a, a)).toBe(false);
        for (const b of group) {
          if (a !== b) expect(sharesPicture(a, b) && sharesPicture(b, a)).toBe(true);
        }
      }
    }
  });

  it('keeps unrelated words as eligible distractors', () => {
    const pool = [{ text: 'cat' }, { text: 'dad' }, { text: 'bus' }];
    expect(withoutPictureTwins('father', pool).map((w) => w.text)).toEqual(['cat', 'bus']);
    expect(withoutPictureTwins('cat', pool)).toHaveLength(3);
  });
});

describe('picture-choice rounds never offer two correct answers', () => {
  it('excludes synonyms from Listen & Match distractors', () => {
    const family = wordSetRegistry.find((ws) => ws.id === 'family')!;
    const father = family.words.find((w) => w.text === 'father')!;

    // Random shuffle inside — run it enough times to catch an intermittent leak.
    for (let i = 0; i < 200; i++) {
      const distractors = selectDistractors(father.id, family, 5);
      expect(distractors.map((d) => d.text)).not.toContain('dad');
      expect(distractors.map((d) => d.id)).not.toContain(father.id);
    }
  });

  it('never deals two cards showing the same picture in Memory Match', () => {
    for (const wordSet of wordSetRegistry) {
      const picked = pickMemoryWords(wordSet, {}, 6);
      const clashes = picked.flatMap((a, i) =>
        picked.slice(i + 1).filter((b) => sharesPicture(a.text, b.text)).map((b) => `${a.text}/${b.text}`),
      );
      expect(clashes, `${wordSet.id} deals a duplicate picture`).toEqual([]);
    }
  });

  it('still fills a full Memory Match deck for every set that is big enough', () => {
    for (const wordSet of wordSetRegistry) {
      const picked = pickMemoryWords(wordSet, {}, 6);
      const expected = Math.min(6, wordSet.words.length);
      expect(picked.length, `${wordSet.id} deals only ${picked.length} pairs`).toBe(expected);
    }
  });
});
