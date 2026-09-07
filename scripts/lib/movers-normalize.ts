/**
 * Turn a verbatim Cambridge wordlist line into something a child can see, hear
 * and type.
 *
 * `scripts/pdf/extract-movers-wordlist.py` deliberately does no cleaning, so
 * every interpretation of what a word *is* happens here, where it is covered by
 * `tests/unit/movers-normalize.test.ts`.
 *
 * The contract on `text`: a printable, pronounceable, sluggable surface form
 * containing only letters, spaces, hyphens and apostrophes. Never a slash,
 * never a parenthesis, never a part-of-speech tag. Everything the PDF said that
 * `text` cannot carry survives in `variants`, `note` or `pos` instead.
 *
 * Anything the rules below do not recognise sets `needsReview`, and the
 * generator refuses to run rather than guessing. A wrong guess here becomes a
 * card that teaches a child the wrong spelling.
 */

export type Pos =
  | 'n' | 'v' | 'adj' | 'adv' | 'det' | 'pron' | 'prep'
  | 'conj' | 'excl' | 'num' | 'int' | 'dis' | 'poss';

/** Which tag wins when an entry carries several. Concrete beats functional. */
const POS_PRECEDENCE: readonly Pos[] = [
  'n', 'v', 'adj', 'adv', 'prep', 'det', 'pron', 'conj', 'num', 'int', 'excl', 'dis', 'poss',
];

const POS_TAGS = new Set<string>(POS_PRECEDENCE);

export interface NormalizedEntry {
  /** What the child sees, hears and types. */
  text: string;
  /** Taught-but-not-carded spellings: US/UK pairs, plurals, alternate orders. */
  variants: string[];
  /** Present when the entry gave a singular/plural pair ("leaf/leaves"). */
  pluralForm?: string;
  /** A sense gloss stripped out of `text` ("band (music)" -> "music"). */
  note?: string;
  /** Every tag on the entry, in the order printed. */
  pos: Pos[];
  primaryPos: Pos;
  /** True when a construct was not recognised. Generation must stop. */
  needsReview: boolean;
  /** Why it needs review, for the error the generator prints. */
  reviewReason?: string;
}

// `dolphin n` and `all adj + adv + det + pron` both fall out of this one rule.
// The trailing qualifier covers Cambridge's "prep of time".
const ENTRY_RE = /^(?<head>.+?)\s+(?<pos>[a-z]+(?:\s*\+\s*[a-z]+)*(?:\s+of\s+\w+)?)$/;

/** `centre (US center)` / `film (US movie) star` -- a regional spelling pair. */
const REGIONAL_RE = /^(?:US|UK)\s+(?<other>.+)$/;

/**
 * Words a phrase may optionally include: `wake (up)`, `have (got) to`. A closed
 * set of particles and auxiliaries on purpose -- any lowercase word would also
 * swallow sense glosses, turning `band (music)` into the variant "band music".
 */
const OPTIONAL_WORDS = new Set(['up', 'down', 'off', 'on', 'out', 'in', 'got', 'be', 'to']);

/**
 * Letters a headword may contain. Accents are allowed because `café` is a real
 * Movers word and the child should see it spelled correctly; `slug()` strips
 * the diacritic separately so the asset filename stays ASCII.
 */
const PRINTABLE_RE = /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F' -]*$/;

/**
 * Collapse the typographic characters a PDF uses into the plain ASCII the app
 * renders, so `text` compares and slugs predictably.
 */
function tidy(raw: string): string {
  return raw
    .replace(/ /g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitPos(tail: string): Pos[] {
  return tail
    .replace(/\s+of\s+\w+$/, '')
    .split('+')
    .map((part) => part.trim())
    .filter((part): part is Pos => POS_TAGS.has(part));
}

function choosePrimary(pos: readonly Pos[]): Pos {
  return POS_PRECEDENCE.find((candidate) => pos.includes(candidate)) ?? 'n';
}

const review = (text: string, reason: string): NormalizedEntry => ({
  text,
  variants: [],
  pos: ['n'],
  primaryPos: 'n',
  needsReview: true,
  reviewReason: reason,
});

/**
 * Resolve every parenthetical in a head, returning the cleaned text plus what
 * each parenthetical contributed.
 *
 * Three recognised shapes:
 *   regional trailing  `centre (US center)`      -> text "centre",    variant "center"
 *   regional infix     `film (US movie) star`    -> text "film star", variant "movie star"
 *   sense gloss        `band (music)`            -> text "band",      note "music"
 *
 * A gloss that swallows the whole head (`(No words at this level)`) or an
 * inflection marker glued to a word (`blond(e)`, `stair(s)`) are handled by the
 * callers below rather than here.
 */
function resolveParentheticals(head: string): {
  text: string;
  variants: string[];
  notes: string[];
} {
  const variants: string[] = [];
  const notes: string[] = [];
  let text = head;

  for (;;) {
    const match = /\s*\(([^()]*)\)/.exec(text);
    if (!match) break;

    const inner = match[1].trim();
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    const regional = REGIONAL_RE.exec(inner);

    if (regional) {
      // The variant swaps the token the parenthetical annotates -- the word
      // immediately before it -- and keeps the rest of the phrase intact, so
      // `film (US movie) star` yields `movie star`, not `film movie star`.
      const words = before.trim().split(' ');
      const swapped = [...words.slice(0, -1), regional.groups!.other].join(' ');
      variants.push(tidy(`${swapped}${after}`));
    } else if (OPTIONAL_WORDS.has(inner)) {
      // The longer reading is a real thing to teach, not a footnote:
      // `wake (up)` -> "wake" / "wake up", `have (got) to` -> "have got to".
      variants.push(tidy(`${before} ${inner}${after}`));
    } else {
      notes.push(inner);
    }
    text = tidy(`${before}${after}`);
  }

  return { text, variants, notes };
}

/**
 * Expand an inflection marker written inside the word itself: `blond(e)` is
 * taught as both spellings, `stair(s)` as singular and plural. The bare stem is
 * what the child types; the suffixed form is a variant.
 */
function expandInlineSuffix(head: string): { text: string; variant: string } | null {
  const match = /^([a-z]+)\(([a-z]{1,2})\)$/i.exec(head);
  if (!match) return null;
  return { text: match[1], variant: match[1] + match[2] };
}

/** Words whose plural is not formed by appending to the singular. */
const IRREGULAR_PLURALS: Record<string, string> = {
  tooth: 'teeth',
  leaf: 'leaves',
  foot: 'feet',
  mouse: 'mice',
  person: 'people',
  child: 'children',
};

/**
 * `leaf/leaves` is one card, not two. Decide whether the right-hand side is an
 * inflection of the left (so it is a plural) or a genuine alternative phrasing
 * such as `town/city centre` (so it is just another way to say the same thing).
 */
function resolveSlash(head: string): { text: string; variant: string; plural?: string } | null {
  if (!head.includes('/')) return null;

  // Only the final token is ever slashed; `town/city centre` slashes the first.
  const slashAt = head.indexOf('/');
  const left = head.slice(0, slashAt).trim();
  const right = head.slice(slashAt + 1).trim();
  if (!left || !right) return null;

  const leftWords = left.split(' ');
  const stem = leftWords[leftWords.length - 1];
  const rightWords = right.split(' ');
  const rightStem = rightWords[0];

  const isPlural =
    IRREGULAR_PLURALS[stem.toLowerCase()] === rightStem.toLowerCase() ||
    (rightStem.toLowerCase().startsWith(stem.toLowerCase()) && rightStem.length > stem.length);

  if (isPlural && rightWords.length === 1) {
    return { text: left, variant: right, plural: right };
  }

  // `town/city centre`: the alternative replaces only the slashed token, and
  // the tail after it belongs to both readings.
  const tail = rightWords.slice(1).join(' ');
  const alternative = tidy(`${rightStem} ${tail}`);
  return { text: tidy(`${leftWords.join(' ')} ${tail}`), variant: alternative };
}

/**
 * Normalize one verbatim A-Z line.
 *
 * @param raw   the line exactly as the extractor read it
 */
export function normalizeEntry(raw: string): NormalizedEntry {
  const line = tidy(raw);
  const match = ENTRY_RE.exec(line);
  if (!match) return review(line, 'no part-of-speech tag');

  const pos = splitPos(match.groups!.pos);
  if (pos.length === 0) return review(line, `unrecognised tag "${match.groups!.pos}"`);

  const variants: string[] = [];
  const notes: string[] = [];
  let head = tidy(match.groups!.head);
  let pluralForm: string | undefined;

  const inline = expandInlineSuffix(head);
  if (inline) {
    head = inline.text;
    variants.push(inline.variant);
  }

  // Slash first: `city/town centre (US center)` must not build its regional
  // variant from a head that still contains the slash.
  const slashed = resolveSlash(head);
  if (slashed) {
    head = slashed.text;
    variants.push(slashed.variant);
    pluralForm = slashed.plural;
  }

  const parens = resolveParentheticals(head);
  head = parens.text;
  variants.push(...parens.variants);
  notes.push(...parens.notes);
  // A variant lifted out before the parentheticals were resolved still carries
  // them; clean it the same way rather than shipping "town centre (US center)".
  for (let i = 0; i < variants.length; i++) {
    variants[i] = resolveParentheticals(variants[i]).text;
  }

  const text = tidy(head);
  if (!text) return review(line, 'parentheticals consumed the whole entry');
  if (!PRINTABLE_RE.test(text)) {
    return review(line, `unprintable characters in "${text}"`);
  }

  return {
    text,
    // A variant that reduces to the headword teaches nothing.
    variants: [...new Set(variants.map(tidy))].filter((v) => v && v !== text),
    ...(pluralForm ? { pluralForm } : {}),
    ...(notes.length ? { note: notes.join('; ') } : {}),
    pos,
    primaryPos: choosePrimary(pos),
    needsReview: false,
  };
}

/**
 * Normalize a thematic-list entry, which carries no part-of-speech tag and is
 * only ever used to look up a topic. Returns the surface form to match on, or
 * null when the entry is not a word at all (`21-100`, `1st-20th`).
 */
export function normalizeThematic(raw: string): string | null {
  let head = tidy(raw);

  const inline = expandInlineSuffix(head);
  if (inline) head = inline.text;
  head = resolveParentheticals(head).text;
  const slashed = resolveSlash(head);
  if (slashed) head = slashed.text;

  const text = tidy(head);
  return PRINTABLE_RE.test(text) ? text : null;
}
