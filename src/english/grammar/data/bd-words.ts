import { wordSetRegistry } from '@/data/yle-starters/index';
import type { Word } from '@/shared/types';

/**
 * b/d discrimination items, derived rather than authored: every word containing
 * a b or a d generates its own distractor by flipping that letter. A wrong tap
 * is then unambiguously a b/d error and nothing else.
 */

export interface BdCandidate {
  word: Word;
  /** The same word with its first b/d flipped, e.g. dog → bog. */
  distractor: string;
}

/** Words whose flip reads badly enough to skip. */
export const BD_EXCLUDED_IDS: ReadonlySet<string> = new Set<string>([
  // "bad" is a value judgement to put next to a picture of a parent.
  'family.dad',
]);

/** Flip the first b/d in a word, or null if it contains neither. */
export function flipBd(text: string): string | null {
  const index = [...text].findIndex((ch) => ch === 'b' || ch === 'd');
  if (index === -1) return null;
  const flipped = text[index] === 'b' ? 'd' : 'b';
  return text.slice(0, index) + flipped + text.slice(index + 1);
}

/**
 * All usable b/d items. A candidate is dropped when its distractor is itself a
 * real vocabulary word — the picture would still disambiguate, but two known
 * words side by side tests reading comprehension rather than letter shape.
 */
export function bdCandidates(): BdCandidate[] {
  const allWords = wordSetRegistry.flatMap((ws) => ws.words);
  const realWords = new Set(allWords.map((w) => w.text));

  const out: BdCandidate[] = [];
  const seen = new Set<string>();
  for (const word of allWords) {
    if (BD_EXCLUDED_IDS.has(word.id)) continue;
    if (seen.has(word.text)) continue;
    const distractor = flipBd(word.text);
    if (!distractor) continue;
    if (realWords.has(distractor)) continue;
    seen.add(word.text);
    out.push({ word, distractor });
  }
  return out;
}
