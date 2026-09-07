/**
 * Turn the extracted Cambridge wordlist plus the hand-authored curation files
 * into the app's Movers word sets.
 *
 * Pure: no filesystem, no network, no clock, no `Math.random`. Everything it
 * needs arrives in `BuildInput` and everything it decides comes back in
 * `BuildResult`, so `generate-movers-data.ts` can write the output and the unit
 * tests can assert on it without either duplicating the logic.
 *
 * The level lives in the word-set id. Movers sets are `movers-*` and their word
 * ids `movers-animals.bat`, which keeps `wordProgress.id`
 * (`${childId}:${wordId}`) from ever colliding with a Starters row -- that is
 * what lets Movers ship with no Dexie migration and no risk to existing stars.
 */
import { normalizeEntry, normalizeThematic, type NormalizedEntry } from './movers-normalize.ts';
import { deriveLetterPuzzle } from './letter-puzzle.ts';
import {
  MIN_SET_SIZE,
  MOVERS_TOPICS,
  TOPIC_OVERRIDES,
  topicForPdfHeader,
  topicForPos,
} from './movers-topics.ts';
import type { PictureSpec } from './movers-pictures.ts';
import { MOVERS_SHARED_PICTURE_GROUPS } from '../../src/data/yle-movers/shared-pictures.ts';
import { slug } from './word-loader.ts';

export interface RawWordlist {
  source: { url: string; sha256: string; extractedAt: string; extractor: string };
  azEntries: Array<{ raw: string; page: number; order: number }>;
  thematicEntries: Array<{ raw: string; topicRaw: string; page: number; y: number }>;
  unparsed: Array<{ raw: string; page: number; pass: string }>;
}

/** One generated word. Mirrors `Word` in `src/shared/types`, plus provenance. */
export interface MoversWord {
  id: string;
  text: string;
  pictureAsset: string;
  audioAsset: string;
  wordSetId: string;
  blankLetterIndex: number;
  letterChoices: [string, string, string];
  /** Omitted when true, so the Starters data stays byte-identical in shape. */
  pictorial?: false;
}

export interface MoversWordSet {
  id: string;
  displayName: string;
  words: MoversWord[];
}

export interface BuildInput {
  raw: RawWordlist;
  pictures: Readonly<Record<string, PictureSpec>>;
  /** Per-word-id hand tuning, merged last. */
  overrides: Readonly<Record<string, Partial<MoversWord>>>;
  /** Every Starters word text, lowercased -- for the letter-puzzle ambiguity check. */
  startersTexts: ReadonlySet<string>;
  /** Starters slugs, so shared words reuse the assets that already exist. */
  startersSlugs: ReadonlySet<string>;
  /**
   * Whether `{ kind: 'ai' }` words can actually be rendered, i.e. whether a
   * FAL_KEY is available. When false they fall back to word cards and become
   * non-pictorial, which is the honest outcome: a word with no picture must not
   * appear in a round whose answer is its spelling. Passed in rather than read
   * from the environment so this function stays pure and the tests can pin it.
   */
  aiRenderable: boolean;
}

export interface BuildResult {
  sets: MoversWordSet[];
  /** Words whose assets are reused from the Starters set. */
  reusedAssets: string[];
  warnings: string[];
  /** Non-empty means the caller must not write anything. */
  errors: string[];
  /** Paste-ready lines for whatever curation is missing (`--stub`). */
  stubs: string[];
}

const IMAGE_DIR = '/assets/images';
const AUDIO_DIR = '/assets/audio';
const LEVEL_DIR = 'movers';

/**
 * Where a word's picture and audio live.
 *
 * A word Cambridge lists at Movers that the app already teaches at Starters --
 * lion, kangaroo, sandwich; they were mis-levelled when Starters was authored
 * -- can point at the existing flat asset instead of generating a duplicate. It
 * still gets its own id and its own progress row, so the child re-drills it at
 * Movers level; only the bytes on disk are shared.
 *
 * Sharing is declared per word in MOVERS_PICTURES, never inferred from a
 * matching filename, because homographs cross the levels: Starters `bat` is a
 * cricket bat and Movers `bat` is the animal.
 */
function assetPaths(text: string, shared: boolean) {
  const name = slug(text);
  const dir = shared ? '' : `/${LEVEL_DIR}`;
  return {
    pictureAsset: `${IMAGE_DIR}${dir}/${name}.webp`,
    audioAsset: `${AUDIO_DIR}${dir}/${name}.mp3`,
  };
}

/** Topic for a word: an explicit override, then the PDF, then its word class. */
function assignTopic(
  entry: NormalizedEntry,
  topicBySlug: ReadonlyMap<string, string>,
): { topicId?: string; error?: string } {
  const key = slug(entry.text);

  const override = TOPIC_OVERRIDES[key];
  if (override) return { topicId: override };

  const header = topicBySlug.get(key);
  const fromPdf = header ? topicForPdfHeader(header) : undefined;
  if (fromPdf) return { topicId: fromPdf };
  if (header) return { error: `"${entry.text}": unmapped PDF topic "${header}"` };

  // Bucketing by word class is right for verbs, adjectives and function words.
  // A noun that lands there is a content word with no home, which is a curation
  // gap rather than something to paper over.
  if (entry.primaryPos === 'n') {
    return {
      error:
        `"${entry.text}" is a noun with no topic. Add it to TOPIC_OVERRIDES ` +
        `in scripts/lib/movers-topics.ts.`,
    };
  }

  const bucket = topicForPos(entry.primaryPos);
  return bucket
    ? { topicId: bucket }
    : { error: `"${entry.text}": no bucket for part of speech "${entry.primaryPos}"` };
}

/** True when these words are a declared synonym group, so sharing is intended. */
function isDeclaredGroup(words: readonly string[]): boolean {
  return MOVERS_SHARED_PICTURE_GROUPS.some(
    (group) => words.every((word) => group.includes(word)),
  );
}

/** POS-based first guess for a missing picture entry, printed by `--stub`. */
function stubPicture(entry: NormalizedEntry): string {
  const isProperName = /^[A-Z]/.test(entry.text);
  if (isProperName) return `{ kind: 'word-card' }`;
  if (entry.primaryPos === 'n' || entry.primaryPos === 'v') return `{ kind: 'emoji', emoji: '' }`;
  if (entry.primaryPos === 'adj') return `{ kind: 'ai' }`;
  return `{ kind: 'word-card' }`;
}

/**
 * What a word's picture actually ends up being.
 *
 * The only divergence from the authored spec is `ai` without a key, which
 * degrades to a word card. Everything downstream keys off this, not off the
 * spec, so a word can never be marked pictorial on the strength of a picture
 * that was never generated.
 */
export function effectiveKind(
  spec: PictureSpec,
  aiRenderable: boolean,
): PictureSpec['kind'] {
  return spec.kind === 'ai' && !aiRenderable ? 'word-card' : spec.kind;
}

export function buildMoversData(input: BuildInput): BuildResult {
  const { raw, pictures, overrides, startersTexts, startersSlugs, aiRenderable } = input;
  const warnings: string[] = [];
  const errors: string[] = [];
  const stubs: string[] = [];
  const reusedAssets: string[] = [];

  if (raw.unparsed.length > 0) {
    errors.push(
      `${raw.unparsed.length} lines in movers-wordlist.raw.json were never parsed. ` +
        `Fix the extractor rather than generating from a partial wordlist.`,
    );
  }

  // Topic lookup from the thematic pages, keyed the same way words are.
  const topicBySlug = new Map<string, string>();
  for (const entry of raw.thematicEntries) {
    const text = normalizeThematic(entry.raw);
    if (text) topicBySlug.set(slug(text), entry.topicRaw);
  }

  const entries = raw.azEntries
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry) => normalizeEntry(entry.raw));

  for (const entry of entries) {
    if (entry.needsReview) {
      errors.push(`unrecognised entry "${entry.text}": ${entry.reviewReason}`);
    }
  }

  // Every taught word, so the letter puzzle never offers a distractor that
  // spells a different word the child is also learning.
  const corpus = new Set<string>([
    ...startersTexts,
    ...entries.map((entry) => entry.text.toLowerCase()),
  ]);

  const byTopic = new Map<string, MoversWord[]>(MOVERS_TOPICS.map((t) => [t.id, []]));
  const seen = new Set<string>();

  for (const entry of entries) {
    if (entry.needsReview) continue;

    const key = slug(entry.text);
    if (seen.has(key)) {
      warnings.push(`duplicate word "${entry.text}" skipped`);
      continue;
    }
    seen.add(key);

    const { topicId, error } = assignTopic(entry, topicBySlug);
    if (error || !topicId) {
      errors.push(error ?? `"${entry.text}": no topic`);
      continue;
    }

    const picture = pictures[entry.text];
    if (!picture) {
      // Defaulting here is how a word-card ends up as the answer in a
      // picture-choice round, so a missing entry stops the build instead.
      errors.push(`"${entry.text}" has no MOVERS_PICTURES entry`);
      stubs.push(`  ${JSON.stringify(entry.text)}: ${stubPicture(entry)},`);
      continue;
    }

    const id = `${topicId}.${key}`;
    const puzzle = deriveLetterPuzzle(entry.text, id, corpus);
    if (!puzzle) {
      errors.push(`"${entry.text}" has no blankable letter; add an override for ${id}`);
      continue;
    }

    const kind = effectiveKind(picture, aiRenderable);
    const shared = kind === 'shared';
    if (shared && !startersSlugs.has(key)) {
      errors.push(
        `"${entry.text}" is marked { kind: 'shared' } but Starters has no ` +
          `"${key}" asset to share. Give it a picture of its own.`,
      );
      continue;
    }
    const { pictureAsset, audioAsset } = assetPaths(entry.text, shared);
    if (shared) reusedAssets.push(entry.text);

    const word: MoversWord = {
      id,
      text: entry.text,
      pictureAsset,
      audioAsset,
      wordSetId: topicId,
      blankLetterIndex: puzzle.blankLetterIndex,
      letterChoices: puzzle.letterChoices,
      // A word-card picture *is* the spelling, so the word must never appear in
      // an activity whose answer is that spelling.
      ...(kind === 'word-card' ? { pictorial: false as const } : {}),
      ...overrides[id],
    };

    byTopic.get(topicId)!.push(word);
  }

  for (const [id, word] of Object.entries(overrides)) {
    if (!seen.has(id.split('.').slice(1).join('.'))) {
      warnings.push(`override for "${id}" (${JSON.stringify(word)}) matches no word`);
    }
  }

  const sets: MoversWordSet[] = [];
  for (const topic of MOVERS_TOPICS) {
    const words = byTopic.get(topic.id)!;
    if (words.length === 0) {
      warnings.push(`topic "${topic.id}" is empty`);
      continue;
    }
    if (words.length < MIN_SET_SIZE) {
      errors.push(
        `topic "${topic.id}" has ${words.length} words, below MIN_SET_SIZE ` +
          `(${MIN_SET_SIZE}). Merge it into a neighbour in movers-topics.ts.`,
      );
    }
    sets.push({ id: topic.id, displayName: topic.displayName, words });
  }

  // Two words in one set drawn with the same picture are two right answers to
  // the same picture round, and `selectDistractors` has no way to tell them
  // apart. This is how a batch of position words all rendered as "box on the
  // left, cat on the right" was caught; it must not come back silently.
  for (const set of sets) {
    const byPicture = new Map<string, string[]>();
    for (const word of set.words) {
      const spec = pictures[word.text];
      if (!spec || effectiveKind(spec, aiRenderable) === 'word-card') continue;
      // Compare what actually gets drawn, not the spec: every `shared` word has
      // the same spec but resolves to a different Starters file.
      const signature =
        spec.kind === 'shared' ? word.pictureAsset : JSON.stringify(spec);
      byPicture.set(signature, [...(byPicture.get(signature) ?? []), word.text]);
    }
    for (const [signature, words] of byPicture) {
      if (words.length > 1 && !isDeclaredGroup(words)) {
        errors.push(
          `${set.id}: ${words.map((w) => `"${w}"`).join(', ')} all render the ` +
            `same picture ${signature}. Give each a distinct one, or make the ` +
            `duplicates word cards.`,
        );
      }
    }
  }

  const downgraded = Object.values(pictures).filter((spec) => spec.kind === 'ai').length;
  if (!aiRenderable && downgraded > 0) {
    warnings.push(
      `${downgraded} words are marked { kind: 'ai' } but no FAL_KEY is set, so ` +
        `they ship as word cards and are excluded from picture rounds. Set ` +
        `FAL_KEY and re-run to promote them.`,
    );
  }

  return { sets, reusedAssets, warnings, errors, stubs };
}
