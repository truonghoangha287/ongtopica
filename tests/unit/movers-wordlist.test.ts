import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { moversWordSetRegistry } from '@/data/yle-movers/index';
import { MOVERS_WORD_SET_ICONS } from '@/data/yle-movers/icons';
import { MOVERS_SHARED_PICTURE_GROUPS } from '@/data/yle-movers/shared-pictures';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { allWordSets } from '@/data/word-sets';
import { levelOfWordSet } from '@/english/vocab/data/levels';
import { isPictorial } from '@/english/vocab/services/pictorial';
import { isTypeable } from '@/english/vocab/services/type-word';
import { slug } from '@/shared/utils/slug';
import { MEMORY_MATCH_PAIRS } from '@/shared/constants/game-constants';
import en from '@/locales/en/vocab.json';

const allWords = moversWordSetRegistry.flatMap((set) => set.words);
const rawWordlist = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/data/movers-wordlist.raw.json'), 'utf-8'),
) as { azEntries: unknown[] };

/**
 * What the image generator actually drew for each word.
 *
 * Asserting against this rather than against the generator's input is the
 * point: the input says what was *intended*, and the failure worth catching is
 * when the two diverge -- a word marked as having a picture whose picture came
 * out as text because an image model was unavailable.
 */
const renderManifest: Record<string, string> = (() => {
  const path = join(process.cwd(), 'public/assets/images/movers/.render-manifest.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : {};
})();

const startersTexts = new Set(
  wordSetRegistry.flatMap((set) => set.words.map((word) => slug(word.text))),
);

/** A word reusing a Starters asset points outside the level's own directory. */
const reusesStartersAsset = (asset: string) => !asset.startsWith('/assets/images/movers/');

describe('movers word set registry', () => {
  it('carries every word from the official A-Z wordlist', () => {
    // The whole point of "all 399 ship": if the generator ever starts dropping
    // words -- a curation gap, a parser change -- it must be a test failure
    // rather than a quietly shorter vocabulary.
    expect(allWords).toHaveLength(rawWordlist.azEntries.length);
  });

  it('gives every set an icon and a display name', () => {
    for (const set of moversWordSetRegistry) {
      expect(MOVERS_WORD_SET_ICONS[set.id], `${set.id} has no icon`).toBeTruthy();
      const label = (en.wordSets as Record<string, string>)[set.id];
      expect(label, `${set.id} has no i18n name`).toBe(set.displayName);
    }
  });

  it('namespaces every set under the movers level', () => {
    const startersIds = new Set(wordSetRegistry.map((set) => set.id));
    for (const set of moversWordSetRegistry) {
      expect(set.id.startsWith('movers-'), `${set.id} is not prefixed`).toBe(true);
      expect(levelOfWordSet(set.id)).toBe('movers');
      expect(startersIds.has(set.id), `${set.id} collides with a Starters set`).toBe(false);
    }
  });

  it('keeps every set big enough to fill a round', () => {
    // Memory Match deals 6 pairs and picture-choice needs distractors, so a set
    // below this cannot actually be played.
    for (const set of moversWordSetRegistry) {
      // Memory Match deals MEMORY_MATCH_PAIRS pairs, so anything smaller
      // cannot fill a deck.
      expect(set.words.length, `${set.id} is too small`).toBeGreaterThanOrEqual(
        MEMORY_MATCH_PAIRS,
      );
    }
  });

  it('gives every word a globally unique id', () => {
    // This is the invariant that lets Movers ship with no Dexie migration:
    // wordProgress rows are keyed `${childId}:${wordId}`, so a Movers word
    // sharing an id with a Starters one would silently share its progress.
    const ids = allWordSets.flatMap((set) => set.words.map((word) => word.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('follows the id and asset naming conventions', () => {
    for (const set of moversWordSetRegistry) {
      for (const word of set.words) {
        expect(word.wordSetId).toBe(set.id);
        expect(word.id).toBe(`${set.id}.${slug(word.text)}`);

        // A word the app already teaches at Starters may reuse that flat
        // asset; everything else lives under the level's own directory.
        const dir = reusesStartersAsset(word.pictureAsset) ? '' : '/movers';
        expect(word.pictureAsset).toBe(`/assets/images${dir}/${slug(word.text)}.webp`);
        expect(word.audioAsset).toBe(`/assets/audio${dir}/${slug(word.text)}.mp3`);
        // ...and it may only do so when that Starters word actually exists.
        if (dir === '') {
          expect(startersTexts.has(slug(word.text)), `${word.text} reuses a missing asset`).toBe(
            true,
          );
        }
      }
    }
  });

  it('blanks a letter that is offered as a choice, in the same case', () => {
    // Case-sensitively: FillInBlankActivity compares with ===, and the Starters
    // `TV` bug was exactly a lowercase choice against an uppercase blank.
    for (const word of allWords) {
      const blanked = word.text[word.blankLetterIndex];
      expect(blanked, `${word.text} blanks out of range`).toBeDefined();
      // Never the initial letter: it is the strongest cue the child has.
      expect(word.blankLetterIndex, `${word.text} blanks its first letter`).toBeGreaterThan(0);
      expect(/^[A-Za-z]$/.test(blanked), `${word.text} blanks "${blanked}"`).toBe(true);
      expect(word.letterChoices).toHaveLength(3);
      expect(new Set(word.letterChoices).size).toBe(3);
      expect(word.letterChoices, `${word.text} omits its own letter`).toContain(blanked);
    }
  });

  it('has a generated image and audio file for every word', () => {
    const missing = allWords.flatMap((word) => [
      ...(existsSync(join(process.cwd(), 'public', word.pictureAsset)) ? [] : [word.pictureAsset]),
      ...(existsSync(join(process.cwd(), 'public', word.audioAsset)) ? [] : [word.audioAsset]),
    ]);
    expect(missing).toEqual([]);
  });

  it('puts every word in exactly one set', () => {
    const slugs = allWords.map((word) => slug(word.text));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('movers pictures', () => {
  it('agrees with the render manifest about which words have a picture', () => {
    // The dangerous failure this catches: a word marked as pictorial whose
    // picture was actually drawn as a word card, which would then appear in a
    // picture-choice round with the answer written on it.
    const disagreements = allWords
      .filter((word) => renderManifest[word.text] !== undefined)
      .filter((word) => isPictorial(word) !== (renderManifest[word.text] !== 'word-card'))
      .map((word) => `${word.text}: drawn as ${renderManifest[word.text]}`);
    expect(disagreements).toEqual([]);
  });

  it('records a render for every word that does not reuse a Starters picture', () => {
    // A word missing from the manifest was never drawn by this pipeline, so the
    // check above would silently skip it.
    const unrecorded = allWords
      .filter((word) => !reusesStartersAsset(word.pictureAsset))
      .filter((word) => renderManifest[word.text] === undefined)
      .map((word) => word.text);
    expect(unrecorded).toEqual([]);
  });

  it('never draws two words in one set with the same picture', () => {
    // Two identical pictures are two right answers to the same round, and
    // `selectDistractors` cannot tell them apart.
    const declared = MOVERS_SHARED_PICTURE_GROUPS.map((group) => new Set(group));
    for (const set of moversWordSetRegistry) {
      const byAsset = new Map<string, string[]>();
      for (const word of set.words) {
        if (!isPictorial(word)) continue; // word cards legitimately look alike
        byAsset.set(word.pictureAsset, [...(byAsset.get(word.pictureAsset) ?? []), word.text]);
      }
      for (const [asset, words] of byAsset) {
        if (words.length === 1) continue;
        const intended = declared.some((group) => words.every((word) => group.has(word)));
        expect(intended, `${set.id}: ${words.join(', ')} all use ${asset}`).toBe(true);
      }
    }
  });

  it('keeps every declared shared-picture group pointing at real Movers words', () => {
    const texts = new Set(allWords.map((word) => word.text));
    for (const group of MOVERS_SHARED_PICTURE_GROUPS) {
      expect(group.length, 'a group of one shares nothing').toBeGreaterThan(1);
      for (const word of group) {
        expect(texts.has(word), `${word} is not a Movers word`).toBe(true);
      }
    }
  });
});

describe('type-the-word eligibility', () => {
  it('offers only words a child can finish on an A-Z keypad', () => {
    // `café` and `o'clock` are real Movers words the keypad has no key for.
    for (const word of allWords) {
      if (!isTypeable(word)) {
        expect(/^[a-zA-Z]+$/.test(word.text)).toBe(false);
      }
    }
    expect(allWords.filter(isTypeable).length).toBeGreaterThan(0);
  });

  it('leaves enough typeable, pictorial words to run a round in most topics', () => {
    const playable = moversWordSetRegistry.filter(
      (set) => set.words.filter((word) => isPictorial(word) && isTypeable(word)).length >= 5,
    );
    // Names and the function-word bucket are all word cards by design, so they
    // are legitimately unplayable here; the rest must not be.
    expect(playable.length).toBeGreaterThanOrEqual(moversWordSetRegistry.length - 4);
  });
});
