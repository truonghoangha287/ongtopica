import { wordSetRegistry } from '@/data/yle-starters/index';
import type { Word } from '@/shared/types';
import type { PluralRuleId } from './rules';

/**
 * Plural annotations over the existing vocabulary. Only exceptions are stored;
 * anything not listed defaults to `text + 's'`.
 *
 * An algorithm can't do this job: potato→potatoes but hippo→hippos,
 * piano→pianos, radio→radios — same ending, different rule. The integrity test
 * guards the default by failing CI if a word ending in s/x/z/ch/sh or
 * consonant+y is missing from the table below.
 */

export interface PluralEntry {
  /** The plural form, or null for uncountables that have none. */
  plural: string | null;
  rule: PluralRuleId;
}

/**
 * Words that never appear in the plural game, keyed by **wordId** so that
 * `colors.orange` (adjective) is excluded while `food.orange` (fruit) is not.
 */
export const PLURAL_EXCLUDED_IDS: ReadonlySet<string> = new Set([
  // Colours are adjectives here, not countable objects.
  'colors.black', 'colors.blue', 'colors.brown', 'colors.green', 'colors.grey',
  'colors.orange', 'colors.pink', 'colors.purple', 'colors.red',
  'colors.white', 'colors.yellow',
  // Sports are activity names — "two tennises" is not a lesson worth teaching.
  'sports.baseball', 'sports.basketball', 'sports.football', 'sports.hockey',
  'sports.swimming', 'sports.tennis', 'sports.badminton', 'sports.volleyball',
  'sports.running', 'sports.ski', 'sports.golf', 'sports.boxing',
  // Already a collective.
  'work.police',
  // The meat is a mass noun — "two chickens" is only true of the bird, which
  // `animals.chicken` already covers.
  'food.chicken',
  // Real plurals of ordinary singulars (boot, shoe, sock, chip), but the
  // vocabulary has no singular entry to contrast against.
  'clothes.boots', 'clothes.shoes', 'clothes.socks', 'food.chips',
]);

/** Exceptions keyed by word **text** — a plural is a fact about the word. */
export const PLURAL_EXCEPTIONS: Readonly<Record<string, PluralEntry>> = {
  // -es after ch / sh / s / x, and the -o words that take -es.
  beach: { plural: 'beaches', rule: 'plural.es' },
  box: { plural: 'boxes', rule: 'plural.es' },
  bus: { plural: 'buses', rule: 'plural.es' },
  dress: { plural: 'dresses', rule: 'plural.es' },
  sandwich: { plural: 'sandwiches', rule: 'plural.es' },
  watch: { plural: 'watches', rule: 'plural.es' },
  potato: { plural: 'potatoes', rule: 'plural.es' },
  tomato: { plural: 'tomatoes', rule: 'plural.es' },
  mango: { plural: 'mangoes', rule: 'plural.es' },

  // -o words that take a plain +s instead of -es.
  hippo: { plural: 'hippos', rule: 'plural.s' },
  kangaroo: { plural: 'kangaroos', rule: 'plural.s' },
  piano: { plural: 'pianos', rule: 'plural.s' },
  radio: { plural: 'radios', rule: 'plural.s' },
  zoo: { plural: 'zoos', rule: 'plural.s' },

  // consonant + y → -ies
  baby: { plural: 'babies', rule: 'plural.ies' },
  lorry: { plural: 'lorries', rule: 'plural.ies' },
  teddy: { plural: 'teddies', rule: 'plural.ies' },
  family: { plural: 'families', rule: 'plural.ies' },
  body: { plural: 'bodies', rule: 'plural.ies' },

  // -f / -fe is not a rule the catalog teaches, so it lands in irregular:
  // for a 9-year-old "shelfs" being wrong is the whole lesson. `giraffe` is
  // here to state the opposite — a -fe word that really does take a plain +s.
  shelf: { plural: 'shelves', rule: 'plural.irregular' },
  giraffe: { plural: 'giraffes', rule: 'plural.s' },

  // irregular, including the zero-plural words
  man: { plural: 'men', rule: 'plural.irregular' },
  woman: { plural: 'women', rule: 'plural.irregular' },
  foot: { plural: 'feet', rule: 'plural.irregular' },
  tooth: { plural: 'teeth', rule: 'plural.irregular' },
  mouse: { plural: 'mice', rule: 'plural.irregular' },
  sheep: { plural: 'sheep', rule: 'plural.irregular' },
  fish: { plural: 'fish', rule: 'plural.irregular' },

  // always plural — no singular form to offer
  glasses: { plural: 'glasses', rule: 'plural.tantum' },
  jeans: { plural: 'jeans', rule: 'plural.tantum' },
  scissors: { plural: 'scissors', rule: 'plural.tantum' },
  shorts: { plural: 'shorts', rule: 'plural.tantum' },
  trousers: { plural: 'trousers', rule: 'plural.tantum' },

  // uncountable — no plural at all
  bread: { plural: null, rule: 'plural.uncountable' },
  cheese: { plural: null, rule: 'plural.uncountable' },
  chocolate: { plural: null, rule: 'plural.uncountable' },
  coffee: { plural: null, rule: 'plural.uncountable' },
  hair: { plural: null, rule: 'plural.uncountable' },
  ice: { plural: null, rule: 'plural.uncountable' },
  juice: { plural: null, rule: 'plural.uncountable' },
  meat: { plural: null, rule: 'plural.uncountable' },
  milk: { plural: null, rule: 'plural.uncountable' },
  paint: { plural: null, rule: 'plural.uncountable' },
  paper: { plural: null, rule: 'plural.uncountable' },
  rain: { plural: null, rule: 'plural.uncountable' },
  rice: { plural: null, rule: 'plural.uncountable' },
  salad: { plural: null, rule: 'plural.uncountable' },
  snow: { plural: null, rule: 'plural.uncountable' },
  soup: { plural: null, rule: 'plural.uncountable' },
  sugar: { plural: null, rule: 'plural.uncountable' },
  tea: { plural: null, rule: 'plural.uncountable' },
  water: { plural: null, rule: 'plural.uncountable' },
  wind: { plural: null, rule: 'plural.uncountable' },
  lemonade: { plural: null, rule: 'plural.uncountable' },
};

/** The plural annotation for a word, or null when it is excluded. */
export function pluralOf(word: Word): PluralEntry | null {
  if (PLURAL_EXCLUDED_IDS.has(word.id)) return null;
  const exception = PLURAL_EXCEPTIONS[word.text];
  if (exception) return exception;
  return { plural: `${word.text}s`, rule: 'plural.s' };
}

/** Every usable word bucketed by its plural rule. Deduplicated by text. */
export function pluralWordsByRule(): Record<PluralRuleId, Word[]> {
  const buckets = {
    'plural.s': [] as Word[],
    'plural.es': [] as Word[],
    'plural.ies': [] as Word[],
    'plural.irregular': [] as Word[],
    'plural.uncountable': [] as Word[],
    'plural.tantum': [] as Word[],
  } satisfies Record<PluralRuleId, Word[]>;

  const seen = new Set<string>();
  for (const word of wordSetRegistry.flatMap((ws) => ws.words)) {
    if (seen.has(word.text)) continue;
    const entry = pluralOf(word);
    if (!entry) continue;
    seen.add(word.text);
    buckets[entry.rule].push(word);
  }
  return buckets;
}
