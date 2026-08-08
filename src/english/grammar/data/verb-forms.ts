import { wordSetRegistry } from '@/data/yle-starters/index';
import type { Word } from '@/shared/types';
import type { VerbRuleId } from './rules';
import { pluralOf } from './plural-forms';

/**
 * Verbs hung off existing people/animal pictures. The corpus is 100% nouns, so
 * the verbs themselves have to be authored — but no new artwork is needed.
 *
 * The subject is the noun itself ("the teacher" / "the teachers") rather than
 * a pronoun, so no gender data is required and each item reinforces plurals
 * at the same time.
 */

export interface VerbEntry {
  id: string;
  /** An existing word providing the picture and the subject noun. */
  subjectWordId: string;
  /** Base form, used after a plural subject: "the teachers teach". */
  base: string;
  /** Third-person singular: "the teacher teaches". */
  third: string;
  /** Optional object completing the sentence; may be empty. */
  object: string;
  /** Which rule the third-person form demonstrates. */
  rule: Exclude<VerbRuleId, 'verb.base'>;
}

export const VERB_ENTRIES: VerbEntry[] = [
  // -es after ch / sh / s / x, and go → goes
  { id: 'teacher-teach', subjectWordId: 'work.teacher', base: 'teach', third: 'teaches', object: 'English', rule: 'verb.es' },
  { id: 'nurse-wash', subjectWordId: 'work.nurse', base: 'wash', third: 'washes', object: 'their hands', rule: 'verb.es' },
  { id: 'dad-go', subjectWordId: 'family.dad', base: 'go', third: 'goes', object: 'to work', rule: 'verb.es' },
  { id: 'mum-watch', subjectWordId: 'family.mum', base: 'watch', third: 'watches', object: 'the baby', rule: 'verb.es' },
  { id: 'doctor-fix', subjectWordId: 'work.doctor', base: 'fix', third: 'fixes', object: 'my arm', rule: 'verb.es' },

  // consonant + y → -ies
  { id: 'pilot-fly', subjectWordId: 'work.pilot', base: 'fly', third: 'flies', object: 'a plane', rule: 'verb.ies' },
  { id: 'baby-cry', subjectWordId: 'family.baby', base: 'cry', third: 'cries', object: '', rule: 'verb.ies' },
  { id: 'bird-fly', subjectWordId: 'animals.bird', base: 'fly', third: 'flies', object: '', rule: 'verb.ies' },
  { id: 'sister-study', subjectWordId: 'family.sister', base: 'study', third: 'studies', object: 'English', rule: 'verb.ies' },
  { id: 'brother-carry', subjectWordId: 'family.brother', base: 'carry', third: 'carries', object: 'the bag', rule: 'verb.ies' },

  // regular +s
  { id: 'dog-bark', subjectWordId: 'animals.dog', base: 'bark', third: 'barks', object: '', rule: 'verb.s' },
  { id: 'cat-sleep', subjectWordId: 'animals.cat', base: 'sleep', third: 'sleeps', object: '', rule: 'verb.s' },
  { id: 'cook-make', subjectWordId: 'work.cook', base: 'make', third: 'makes', object: 'dinner', rule: 'verb.s' },
  { id: 'farmer-feed', subjectWordId: 'work.farmer', base: 'feed', third: 'feeds', object: 'the cows', rule: 'verb.s' },
  { id: 'monkey-climb', subjectWordId: 'animals.monkey', base: 'climb', third: 'climbs', object: 'a tree', rule: 'verb.s' },
  { id: 'clown-wear', subjectWordId: 'work.clown', base: 'wear', third: 'wears', object: 'a big hat', rule: 'verb.s' },
  { id: 'king-wear', subjectWordId: 'work.king', base: 'wear', third: 'wears', object: 'a crown', rule: 'verb.s' },
  { id: 'rabbit-jump', subjectWordId: 'animals.rabbit', base: 'jump', third: 'jumps', object: '', rule: 'verb.s' },
  { id: 'boy-play', subjectWordId: 'family.boy', base: 'play', third: 'plays', object: 'football', rule: 'verb.s' },
  { id: 'girl-sing', subjectWordId: 'family.girl', base: 'sing', third: 'sings', object: 'a song', rule: 'verb.s' },
  { id: 'horse-run', subjectWordId: 'animals.horse', base: 'run', third: 'runs', object: '', rule: 'verb.s' },
  { id: 'grandma-read', subjectWordId: 'family.grandma', base: 'read', third: 'reads', object: 'a book', rule: 'verb.s' },
  { id: 'grandpa-drink', subjectWordId: 'family.grandpa', base: 'drink', third: 'drinks', object: 'tea', rule: 'verb.s' },
];

const wordById = new Map<string, Word>(
  wordSetRegistry.flatMap((ws) => ws.words).map((w) => [w.id, w]),
);

export interface SubjectForms {
  /** e.g. "the teacher" */
  singular: string;
  /** e.g. "the teachers" */
  plural: string;
  /** Picture for the subject noun. */
  asset: string;
}

/**
 * Subject phrases for an entry, or null when the subject word has no usable
 * plural (excluded, uncountable, or missing from the vocabulary).
 */
export function subjectFormsFor(entry: VerbEntry): SubjectForms | null {
  const word = wordById.get(entry.subjectWordId);
  if (!word) return null;
  const plural = pluralOf(word);
  if (!plural || plural.plural === null) return null;
  return {
    singular: `the ${word.text}`,
    plural: `the ${plural.plural}`,
    asset: word.pictureAsset,
  };
}

/**
 * Entries bucketed by rule. `verb.base` draws on every entry, because any verb
 * can demonstrate "plural subject takes the bare form".
 */
export function verbEntriesByRule(): Record<VerbRuleId, VerbEntry[]> {
  const usable = VERB_ENTRIES.filter((e) => subjectFormsFor(e) !== null);
  return {
    'verb.base': usable,
    'verb.s': usable.filter((e) => e.rule === 'verb.s'),
    'verb.es': usable.filter((e) => e.rule === 'verb.es'),
    'verb.ies': usable.filter((e) => e.rule === 'verb.ies'),
  };
}
