# English Grammar Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth English skill track — Grammar — with three games (noun plurals, third-person verb agreement, b/d letter discrimination) driven by one shared adaptive drill engine that tracks mastery per grammar rule.

**Architecture:** A new `src/english/grammar/` module. Pure services (rule catalog, form tables, scheduler, mastery maths, per-game item builders) sit under `data/` and `services/`; a single `GrammarDrillPage` component runs a 10-round loop for any game, and `GrammarHubPage` lists the three games plus a parent-facing rule-state row. Mastery persists to a new Dexie table at `version(5)`. Nothing in the existing vocab/math code paths changes behaviour.

**Tech Stack:** TypeScript 5.8, React 18.3, Vite 6, Dexie 4 (IndexedDB), Zustand, framer-motion, react-router-dom 7, react-i18next, Vitest + Testing Library + vitest-axe.

**Source spec:** `docs/superpowers/specs/2026-08-08-english-grammar-games-design.md`

## Global Constraints

- **Path alias:** `@/` resolves to `src/`. Use it in all imports (configured in both `vite.config.ts` and `vitest.config.ts`).
- **No new dependencies.** Everything needed is already installed.
- **No new assets.** No images, audio, or word-set JSON. Plural quantity is shown by repeating an existing `.webp`.
- **Local-first.** All new state is per-child, in IndexedDB. No network calls.
- **DB field name is `childId`, not `profileId`.** Every existing row type uses `childId` and composite ids of the form `` `${childId}:${something}` ``. The spec wrote `profileId`; `childId` is correct.
- **Dexie migrations are additive.** Each `version(n).stores({...})` must repeat every prior table definition verbatim, then add the new one. Never drop or rename an existing store.
- **i18n:** user-facing strings go in `src/locales/en/vocab.json` under a new `grammar` key, read via `useTranslation('vocab')`. Child-facing activity blurbs (`desc`) are plain strings in `skills.ts`, matching the existing pattern.
- **Test commands:** `npm run test:unit`, `npm run test:int`, `npm run test:a11y`, `npm run test` (all), `npm run typecheck`, `npm run lint`.
- **Determinism:** no `Math.random()` in any pure service. All randomness enters through an injected `Rng` so tests are deterministic.
- **File size:** keep new files under ~200 lines, matching the codebase convention.

## Naming contract (used across tasks — do not diverge)

These exact names are referenced by later tasks. Task N's implementer only sees Task N, so this is the shared vocabulary:

```ts
type RuleId          // union of 11 string literals, from @/english/grammar/data/rules
type MasteryMap      // Partial<Record<RuleId, RuleMastery>>
interface RuleMastery { attempts; correct; streak; gold }
interface DrillItem  { rule; picture{asset,alt,repeat}; sentence?; options; answer; hint? }
interface GrammarGame{ id; rules; buildItem(rule, rng) }
type Rng = () => number             // from @/english/grammar/services/rng
function makeRng(seed: number): Rng
function selectRules(ruleIds, mastery, count, rng): RuleId[]
function applyAttempt(m: RuleMastery, wasCorrect: boolean): RuleMastery
function pluralOf(word: Word): PluralEntry | null
```

---

### Task 1: Rule catalog

The 11 grammar rules that everything else keys off. Pure data + lookup, no dependencies.

**Files:**
- Create: `src/english/grammar/data/rules.ts`
- Test: `tests/unit/grammar-rules.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `RuleId`, `PluralRuleId`, `VerbRuleId`, `Rule`, `RULES`, `RULE_IDS`, `getRule(id)`, `PLURAL_RULE_IDS`, `VERB_RULE_IDS`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  RULES,
  RULE_IDS,
  getRule,
  PLURAL_RULE_IDS,
  VERB_RULE_IDS,
} from '@/english/grammar/data/rules';

describe('rule catalog', () => {
  it('has exactly 11 rules', () => {
    expect(RULES).toHaveLength(11);
    expect(RULE_IDS).toHaveLength(11);
  });

  it('has no duplicate ids', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  it('gives every rule a non-empty label and example', () => {
    for (const rule of RULES) {
      expect(rule.label.length).toBeGreaterThan(0);
      expect(rule.example.length).toBeGreaterThan(0);
    }
  });

  it('looks up a rule by id', () => {
    expect(getRule('plural.es')?.example).toBe('watch → watches');
  });

  it('returns undefined for an unknown id', () => {
    expect(getRule('plural.nope')).toBeUndefined();
  });

  it('partitions ids into 6 plural rules and 4 verb rules plus letter.bd', () => {
    expect(PLURAL_RULE_IDS).toHaveLength(6);
    expect(VERB_RULE_IDS).toHaveLength(4);
    expect(RULE_IDS).toContain('letter.bd');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-rules`
Expected: FAIL — `Failed to resolve import "@/english/grammar/data/rules"`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/data/rules.ts`:

```ts
/**
 * The grammar rules the child is drilled on. A rule id is the unit of mastery
 * everywhere in this module: the scheduler weights by rule, the mastery table
 * has one row per rule, and the parent-facing chips show one chip per rule.
 *
 * `plural.irregular` deliberately absorbs the zero-plural words (sheep, fish)
 * alongside man→men. Splitting them would leave a rule with only two source
 * words — below the 4-item minimum the data integrity test enforces — and for
 * a 9-year-old both are the same lesson: this one doesn't follow the rule.
 */

export type PluralRuleId =
  | 'plural.s'
  | 'plural.es'
  | 'plural.ies'
  | 'plural.irregular'
  | 'plural.uncountable'
  | 'plural.tantum';

/** `verb.base` is the counter-rule: "they teach", not "they teaches". */
export type VerbRuleId = 'verb.base' | 'verb.s' | 'verb.es' | 'verb.ies';

export type LetterRuleId = 'letter.bd';

export type RuleId = PluralRuleId | VerbRuleId | LetterRuleId;

export interface Rule {
  id: RuleId;
  /** Short child-facing name, e.g. "add -es". */
  label: string;
  /** One worked example, e.g. "watch → watches". */
  example: string;
}

export const RULES: Rule[] = [
  { id: 'plural.s', label: 'add -s', example: 'cat → cats' },
  { id: 'plural.es', label: 'add -es', example: 'watch → watches' },
  { id: 'plural.ies', label: 'y → -ies', example: 'baby → babies' },
  { id: 'plural.irregular', label: 'special ones', example: 'foot → feet' },
  { id: 'plural.uncountable', label: 'no plural', example: 'some milk' },
  { id: 'plural.tantum', label: 'always plural', example: 'some jeans' },
  { id: 'verb.base', label: 'they + no ending', example: 'they teach' },
  { id: 'verb.s', label: 'add -s', example: 'the dog barks' },
  { id: 'verb.es', label: 'add -es', example: 'the teacher teaches' },
  { id: 'verb.ies', label: 'y → -ies', example: 'the pilot flies' },
  { id: 'letter.bd', label: 'b or d', example: 'dog, not bog' },
];

export const RULE_IDS: RuleId[] = RULES.map((r) => r.id);

export const PLURAL_RULE_IDS = RULE_IDS.filter((id) =>
  id.startsWith('plural.'),
) as PluralRuleId[];

export const VERB_RULE_IDS = RULE_IDS.filter((id) =>
  id.startsWith('verb.'),
) as VerbRuleId[];

export function getRule(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-rules`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/data/rules.ts tests/unit/grammar-rules.test.ts
git commit -m "feat(grammar): add 11-rule grammar catalog"
```

---

### Task 2: Deterministic RNG helpers

Every pure service takes randomness as a parameter so tests are repeatable.

**Files:**
- Create: `src/english/grammar/services/rng.ts`
- Test: `tests/unit/grammar-rng.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Rng = () => number`, `makeRng(seed: number): Rng`, `pickFrom<T>(arr: T[], rng: Rng): T | undefined`, `shuffle<T>(arr: T[], rng: Rng): T[]`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-rng.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeRng, pickFrom, shuffle } from '@/english/grammar/services/rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });

  it('stays within [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 500; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('pickFrom', () => {
  it('returns an element of the array', () => {
    const arr = ['a', 'b', 'c'];
    expect(arr).toContain(pickFrom(arr, makeRng(3)));
  });

  it('returns undefined for an empty array', () => {
    expect(pickFrom([], makeRng(1))).toBeUndefined();
  });
});

describe('shuffle', () => {
  it('keeps every element exactly once', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, makeRng(9));
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr, makeRng(9));
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-rng`
Expected: FAIL — cannot resolve `@/english/grammar/services/rng`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/services/rng.ts`:

```ts
/**
 * Seeded randomness for the grammar drill. Every pure service takes an `Rng`
 * so a test can pin the exact sequence of questions a child would see.
 */

export type Rng = () => number;

/** Mulberry32 — small, fast, good enough for picking quiz items. */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(arr: T[], rng: Rng): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

/** Fisher-Yates on a copy — never mutates the caller's array. */
export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-rng`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/services/rng.ts tests/unit/grammar-rng.test.ts
git commit -m "feat(grammar): add seeded rng helpers for deterministic drills"
```

---

### Task 3: Plural form table

Annotates the existing vocabulary with plural forms.

**Design note (deviation from spec):** the spec called for ~225 hand-written entries. Instead this stores only the ~50 **exceptions**; every other word defaults to `text + 's'`. An integrity test (Task 5) then *forces* any future word ending in `s/x/z/ch/sh` or consonant-`y` into the exceptions table, so the default can never silently produce "watchs".

Exclusions are keyed by **wordId** (so `colors.orange` is excluded while `food.orange` is not); exceptions are keyed by **text** (a plural is a fact about the word, not about which set it lives in).

**Files:**
- Create: `src/english/grammar/data/plural-forms.ts`
- Test: `tests/unit/grammar-plural-forms.test.ts`

**Interfaces:**
- Consumes: `PluralRuleId` from Task 1; `Word`/`wordSetRegistry` from existing `@/shared/types` and `@/data/yle-starters/index`.
- Produces: `PluralEntry`, `PLURAL_EXCEPTIONS`, `PLURAL_EXCLUDED_IDS`, `pluralOf(word)`, `pluralWordsByRule()`.

`Word` is `{ id, text, pictureAsset, audioAsset, wordSetId, blankLetterIndex, letterChoices }`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-plural-forms.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { pluralOf, pluralWordsByRule } from '@/english/grammar/data/plural-forms';
import type { Word } from '@/shared/types';

const findWord = (id: string): Word => {
  const w = wordSetRegistry.flatMap((ws) => ws.words).find((x) => x.id === id);
  if (!w) throw new Error(`fixture word missing: ${id}`);
  return w;
};

describe('pluralOf', () => {
  it('defaults to +s for a regular noun', () => {
    expect(pluralOf(findWord('animals.cat'))).toEqual({
      plural: 'cats',
      rule: 'plural.s',
    });
  });

  it('uses the exception table for -es words', () => {
    expect(pluralOf(findWord('home.box'))).toEqual({
      plural: 'boxes',
      rule: 'plural.es',
    });
  });

  it('handles -o words that take -es, not the generic +s', () => {
    expect(pluralOf(findWord('food.potato'))).toEqual({
      plural: 'potatoes',
      rule: 'plural.es',
    });
  });

  it('handles consonant + y', () => {
    expect(pluralOf(findWord('family.baby'))).toEqual({
      plural: 'babies',
      rule: 'plural.ies',
    });
  });

  it('handles irregulars', () => {
    expect(pluralOf(findWord('body.foot'))).toEqual({
      plural: 'feet',
      rule: 'plural.irregular',
    });
  });

  it('treats zero-plural words as irregular with an unchanged form', () => {
    expect(pluralOf(findWord('animals.sheep'))).toEqual({
      plural: 'sheep',
      rule: 'plural.irregular',
    });
  });

  it('gives uncountables a null plural', () => {
    expect(pluralOf(findWord('food.water'))).toEqual({
      plural: null,
      rule: 'plural.uncountable',
    });
  });

  it('marks always-plural words as tantum with an unchanged form', () => {
    expect(pluralOf(findWord('clothes.jeans'))).toEqual({
      plural: 'jeans',
      rule: 'plural.tantum',
    });
  });

  it('excludes adjectives by wordId, not by text', () => {
    expect(pluralOf(findWord('colors.orange'))).toBeNull();
    expect(pluralOf(findWord('food.orange'))).toEqual({
      plural: 'oranges',
      rule: 'plural.s',
    });
  });
});

describe('pluralWordsByRule', () => {
  const byRule = pluralWordsByRule();

  it('gives every plural rule at least 4 usable words', () => {
    for (const [rule, words] of Object.entries(byRule)) {
      expect(words.length, `rule ${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
  });

  it('never places an excluded word in a bucket', () => {
    const all = Object.values(byRule).flat();
    expect(all.some((w) => w.id === 'colors.blue')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-plural-forms`
Expected: FAIL — cannot resolve `@/english/grammar/data/plural-forms`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/data/plural-forms.ts`:

```ts
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

  // consonant + y → -ies
  baby: { plural: 'babies', rule: 'plural.ies' },
  lorry: { plural: 'lorries', rule: 'plural.ies' },
  teddy: { plural: 'teddies', rule: 'plural.ies' },
  family: { plural: 'families', rule: 'plural.ies' },
  body: { plural: 'bodies', rule: 'plural.ies' },

  // irregular, including the zero-plural words
  man: { plural: 'men', rule: 'plural.irregular' },
  woman: { plural: 'women', rule: 'plural.irregular' },
  foot: { plural: 'feet', rule: 'plural.irregular' },
  tooth: { plural: 'teeth', rule: 'plural.irregular' },
  mouse: { plural: 'mice', rule: 'plural.irregular' },
  sheep: { plural: 'sheep', rule: 'plural.irregular' },
  fish: { plural: 'fish', rule: 'plural.irregular' },

  // Genuine plurale tantum — no ordinary singular exists. NOT boots/shoes/
  // socks/chips: a boot and a sock are perfectly good singulars, and listing
  // them here would teach a false rule.
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
```

> **Implementer note:** every key in `PLURAL_EXCEPTIONS` must correspond to a word that actually exists in the vocabulary — no speculative entries. The `plural.ies` bucket is the thinnest at exactly 5 (`baby`, `lorry`, `teddy`, `family`, `body`), which is why `family` and `body` are **not** excluded despite being slightly abstract nouns. If a bucket assertion fails, add a real existing word — never delete the assertion.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-plural-forms`
Expected: PASS, 11 tests.

If a bucket assertion fails, the fix is always to add a **real existing** word to `PLURAL_EXCEPTIONS` with its correct plural and rule — never to weaken the assertion or invent a word that isn't in the vocabulary.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/data/plural-forms.ts tests/unit/grammar-plural-forms.test.ts
git commit -m "feat(grammar): add plural form table over existing vocabulary"
```

---

### Task 4: Verb form table

**Design note (deviation from spec):** the spec's sentences used *She/They*, which would need gender data per word. Instead the subject is the noun itself — `The teacher ___ English.` vs `The teachers ___ English.` — which needs no gender, and reuses `pluralOf` from Task 3 so it reinforces plurals at the same time.

**Files:**
- Create: `src/english/grammar/data/verb-forms.ts`
- Test: `tests/unit/grammar-verb-forms.test.ts`

**Interfaces:**
- Consumes: `VerbRuleId` (Task 1), `pluralOf` (Task 3), `wordSetRegistry`.
- Produces: `VerbEntry`, `VERB_ENTRIES`, `verbEntriesByRule()`, `subjectFormsFor(entry)`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-verb-forms.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import {
  VERB_ENTRIES,
  verbEntriesByRule,
  subjectFormsFor,
} from '@/english/grammar/data/verb-forms';

const wordIds = new Set(wordSetRegistry.flatMap((ws) => ws.words).map((w) => w.id));

describe('VERB_ENTRIES', () => {
  it('references only real words', () => {
    for (const entry of VERB_ENTRIES) {
      expect(wordIds.has(entry.subjectWordId), `missing ${entry.subjectWordId}`).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = VERB_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never has base equal to third person', () => {
    for (const entry of VERB_ENTRIES) {
      expect(entry.base).not.toBe(entry.third);
    }
  });
});

describe('verbEntriesByRule', () => {
  const byRule = verbEntriesByRule();

  it('gives verb.s, verb.es and verb.ies at least 4 entries each', () => {
    expect(byRule['verb.s'].length).toBeGreaterThanOrEqual(4);
    expect(byRule['verb.es'].length).toBeGreaterThanOrEqual(4);
    expect(byRule['verb.ies'].length).toBeGreaterThanOrEqual(4);
  });

  it('makes every entry available to verb.base', () => {
    expect(byRule['verb.base'].length).toBe(VERB_ENTRIES.length);
  });
});

describe('subjectFormsFor', () => {
  it('returns singular and plural subject text', () => {
    const teacher = VERB_ENTRIES.find((e) => e.subjectWordId === 'work.teacher');
    expect(teacher).toBeDefined();
    const forms = subjectFormsFor(teacher!);
    expect(forms).toEqual({
      singular: 'the teacher',
      plural: 'the teachers',
      asset: expect.stringContaining('teacher'),
    });
  });

  it('returns null when the subject word has no plural', () => {
    const fake = { ...VERB_ENTRIES[0], subjectWordId: 'colors.blue' };
    expect(subjectFormsFor(fake)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-verb-forms`
Expected: FAIL — cannot resolve `@/english/grammar/data/verb-forms`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/data/verb-forms.ts`:

```ts
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
  { id: 'police-catch', subjectWordId: 'work.police', base: 'catch', third: 'catches', object: 'the thief', rule: 'verb.es' },
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
```

> **Implementer note:** `work.police` is in `PLURAL_EXCLUDED_IDS` from Task 3, so `subjectFormsFor` returns null for `police-catch` and it drops out of every bucket. That is correct behaviour, and `verb.es` still has 5 entries. If a `byRule` assertion fails, check which subjects are being filtered out rather than loosening the assertion.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-verb-forms`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/data/verb-forms.ts tests/unit/grammar-verb-forms.test.ts
git commit -m "feat(grammar): add verb form table using existing subject pictures"
```

---

### Task 5: b/d word derivation + cross-table integrity test

b/d candidates are derived, not authored. This task also adds the integrity test that guards all three data tables.

**Files:**
- Create: `src/english/grammar/data/bd-words.ts`
- Test: `tests/unit/grammar-bd-words.test.ts`
- Test: `tests/unit/grammar-data-integrity.test.ts`

**Interfaces:**
- Consumes: `wordSetRegistry`, `pluralOf` / `PLURAL_EXCEPTIONS` (Task 3), `verbEntriesByRule` (Task 4), `RULE_IDS` (Task 1).
- Produces: `BdCandidate`, `flipBd(text)`, `bdCandidates()`, `BD_EXCLUDED_IDS`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/grammar-bd-words.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { flipBd, bdCandidates } from '@/english/grammar/data/bd-words';

describe('flipBd', () => {
  it('flips the first b to d', () => {
    expect(flipBd('bear')).toBe('dear');
  });

  it('flips the first d to b', () => {
    expect(flipBd('dog')).toBe('bog');
  });

  it('flips only the first occurrence when both letters appear', () => {
    expect(flipBd('bed')).toBe('ded');
  });

  it('returns null when the word has no b or d', () => {
    expect(flipBd('cat')).toBeNull();
  });
});

describe('bdCandidates', () => {
  const candidates = bdCandidates();
  const realWords = new Set(
    wordSetRegistry.flatMap((ws) => ws.words).map((w) => w.text),
  );

  it('finds a workable number of candidates', () => {
    expect(candidates.length).toBeGreaterThanOrEqual(20);
  });

  it('never offers a distractor that is itself a real vocabulary word', () => {
    for (const c of candidates) {
      expect(realWords.has(c.distractor), `${c.word.text} → ${c.distractor}`).toBe(false);
    }
  });

  it('always differs from the real word by exactly one letter', () => {
    for (const c of candidates) {
      expect(c.distractor).toHaveLength(c.word.text.length);
      const diffs = [...c.word.text].filter((ch, i) => ch !== c.distractor[i]);
      expect(diffs).toHaveLength(1);
    }
  });

  it('only differs on a b/d swap', () => {
    for (const c of candidates) {
      const i = [...c.word.text].findIndex((ch, idx) => ch !== c.distractor[idx]);
      expect(['b', 'd']).toContain(c.word.text[i]);
      expect(['b', 'd']).toContain(c.distractor[i]);
    }
  });
});
```

Create `tests/unit/grammar-data-integrity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { RULE_IDS } from '@/english/grammar/data/rules';
import {
  PLURAL_EXCEPTIONS,
  PLURAL_EXCLUDED_IDS,
  pluralOf,
  pluralWordsByRule,
} from '@/english/grammar/data/plural-forms';
import { VERB_ENTRIES, verbEntriesByRule } from '@/english/grammar/data/verb-forms';

const allWords = wordSetRegistry.flatMap((ws) => ws.words);

describe('grammar data integrity', () => {
  it('references only rule ids from the catalog', () => {
    for (const entry of Object.values(PLURAL_EXCEPTIONS)) {
      expect(RULE_IDS).toContain(entry.rule);
    }
    for (const entry of VERB_ENTRIES) {
      expect(RULE_IDS).toContain(entry.rule);
    }
  });

  it('excludes only wordIds that actually exist', () => {
    const ids = new Set(allWords.map((w) => w.id));
    for (const id of PLURAL_EXCLUDED_IDS) {
      expect(ids.has(id), `stale exclusion: ${id}`).toBe(true);
    }
  });

  // This is the guard that makes the "+s by default" shortcut safe.
  it('never lets a tricky ending fall through to the +s default', () => {
    const tricky = /(ch|sh|ss|s|x|z|o)$|[^aeiou]y$/;
    for (const word of allWords) {
      if (PLURAL_EXCLUDED_IDS.has(word.id)) continue;
      if (!tricky.test(word.text)) continue;
      expect(
        PLURAL_EXCEPTIONS[word.text],
        `"${word.text}" needs an explicit entry in PLURAL_EXCEPTIONS`,
      ).toBeDefined();
    }
  });

  it('gives a non-empty plural to everything except uncountables', () => {
    for (const word of allWords) {
      const entry = pluralOf(word);
      if (!entry) continue;
      if (entry.rule === 'plural.uncountable') {
        expect(entry.plural).toBeNull();
      } else {
        expect(entry.plural, `"${word.text}" has an empty plural`).toBeTruthy();
      }
    }
  });

  it('gives every rule that a game draws on at least 4 items', () => {
    const plural = pluralWordsByRule();
    for (const [rule, words] of Object.entries(plural)) {
      expect(words.length, `${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
    const verbs = verbEntriesByRule();
    for (const [rule, entries] of Object.entries(verbs)) {
      expect(entries.length, `${rule} is too thin`).toBeGreaterThanOrEqual(4);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- grammar-bd-words grammar-data-integrity`
Expected: FAIL — cannot resolve `@/english/grammar/data/bd-words`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/data/bd-words.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- grammar-bd-words grammar-data-integrity`
Expected: PASS, 10 tests.

If "never lets a tricky ending fall through" fails, the named word must be added to `PLURAL_EXCEPTIONS` in `src/english/grammar/data/plural-forms.ts` with its correct plural and rule — do **not** weaken the regex. Words ending in `-o` that take a plain `+s` (hippo, piano, radio, kangaroo, zoo, avocado) still need an explicit entry, e.g.:

```ts
  hippo: { plural: 'hippos', rule: 'plural.s' },
  piano: { plural: 'pianos', rule: 'plural.s' },
  radio: { plural: 'radios', rule: 'plural.s' },
  kangaroo: { plural: 'kangaroos', rule: 'plural.s' },
  zoo: { plural: 'zoos', rule: 'plural.s' },
```

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/data/bd-words.ts tests/unit/grammar-bd-words.test.ts tests/unit/grammar-data-integrity.test.ts
git commit -m "feat(grammar): derive b/d items and guard all grammar data in CI"
```

---

### Task 6: Mastery maths

Pure functions for recording an attempt and deciding when a rule goes gold.

**Files:**
- Create: `src/english/grammar/services/mastery.ts`
- Test: `tests/unit/grammar-mastery.test.ts`

**Interfaces:**
- Consumes: `RuleId` (Task 1).
- Produces: `RuleMastery`, `MasteryMap`, `EMPTY_MASTERY`, `applyAttempt`, `accuracy`, `isWeak`, `isUnseen`, `GOLD_STREAK`, `GOLD_MIN_ATTEMPTS`, `GOLD_MIN_ACCURACY`, `WEAK_ACCURACY`, `WEAK_MIN_ATTEMPTS`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-mastery.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  EMPTY_MASTERY,
  applyAttempt,
  accuracy,
  isWeak,
  isUnseen,
} from '@/english/grammar/services/mastery';
import type { RuleMastery } from '@/english/grammar/services/mastery';

const run = (results: boolean[]): RuleMastery =>
  results.reduce((m, correct) => applyAttempt(m, correct), EMPTY_MASTERY);

describe('applyAttempt', () => {
  it('counts a correct attempt', () => {
    expect(applyAttempt(EMPTY_MASTERY, true)).toEqual({
      attempts: 1, correct: 1, streak: 1, gold: false,
    });
  });

  it('resets the streak on a wrong answer', () => {
    const m = run([true, true, false]);
    expect(m.streak).toBe(0);
    expect(m.attempts).toBe(3);
    expect(m.correct).toBe(2);
  });

  it('does not mutate its input', () => {
    const before = { ...EMPTY_MASTERY };
    applyAttempt(before, true);
    expect(before).toEqual(EMPTY_MASTERY);
  });

  it('goes gold at 6 straight correct with 8+ attempts and 80%+ accuracy', () => {
    // 2 wrong then 8 correct → 10 attempts, 80% accuracy, streak 8.
    const m = run([false, false, ...Array(8).fill(true)]);
    expect(m.gold).toBe(true);
  });

  it('does not go gold on a 6-streak with too few attempts', () => {
    const m = run(Array(6).fill(true));
    expect(m.attempts).toBe(6);
    expect(m.gold).toBe(false);
  });

  it('does not go gold when lifetime accuracy is below 80%', () => {
    // 4 wrong then 6 correct → 10 attempts, 60% accuracy, streak 6.
    const m = run([...Array(4).fill(false), ...Array(6).fill(true)]);
    expect(m.streak).toBe(6);
    expect(m.gold).toBe(false);
  });

  it('keeps gold once earned, even after later mistakes', () => {
    let m = run([false, false, ...Array(8).fill(true)]);
    expect(m.gold).toBe(true);
    for (let i = 0; i < 10; i++) m = applyAttempt(m, false);
    expect(m.gold).toBe(true);
    expect(m.streak).toBe(0);
  });
});

describe('accuracy', () => {
  it('is 0 for an unseen rule', () => {
    expect(accuracy(EMPTY_MASTERY)).toBe(0);
  });

  it('is correct / attempts', () => {
    expect(accuracy(run([true, true, false, true]))).toBeCloseTo(0.75);
  });
});

describe('isWeak', () => {
  it('is false before enough attempts to judge', () => {
    expect(isWeak(run([false, false]))).toBe(false);
  });

  it('is true below 70% once there are enough attempts', () => {
    expect(isWeak(run([false, false, false, true]))).toBe(true);
  });

  it('is false at or above 70%', () => {
    expect(isWeak(run([true, true, true, false]))).toBe(false);
  });

  it('stays true for a slipping gold rule', () => {
    let m = run([false, false, ...Array(8).fill(true)]);
    for (let i = 0; i < 12; i++) m = applyAttempt(m, false);
    expect(m.gold).toBe(true);
    expect(isWeak(m)).toBe(true);
  });
});

describe('isUnseen', () => {
  it('is true for a missing rule', () => {
    expect(isUnseen(undefined)).toBe(true);
  });

  it('is false once attempted', () => {
    expect(isUnseen(run([false]))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-mastery`
Expected: FAIL — cannot resolve `@/english/grammar/services/mastery`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/services/mastery.ts`:

```ts
import type { RuleId } from '@/english/grammar/data/rules';

/**
 * Per-rule mastery maths. Only *first* attempts on an item reach these
 * functions — retry-until-right is good for morale but useless as a signal, so
 * the caller records the first tap and ignores the rest.
 */

export interface RuleMastery {
  attempts: number;
  correct: number;
  /** Consecutive first-attempt correct answers. */
  streak: number;
  gold: boolean;
}

export type MasteryMap = Partial<Record<RuleId, RuleMastery>>;

export const EMPTY_MASTERY: RuleMastery = {
  attempts: 0,
  correct: 0,
  streak: 0,
  gold: false,
};

export const GOLD_STREAK = 6;
export const GOLD_MIN_ATTEMPTS = 8;
export const GOLD_MIN_ACCURACY = 0.8;

export const WEAK_ACCURACY = 0.7;
export const WEAK_MIN_ATTEMPTS = 4;

export function accuracy(m: RuleMastery): number {
  return m.attempts === 0 ? 0 : m.correct / m.attempts;
}

export function isUnseen(m: RuleMastery | undefined): boolean {
  return !m || m.attempts === 0;
}

/**
 * Weak enough to deserve extra drilling. Judged on live accuracy, so a gold
 * rule that starts slipping quietly gets more questions while keeping its star.
 */
export function isWeak(m: RuleMastery | undefined): boolean {
  if (!m || m.attempts < WEAK_MIN_ATTEMPTS) return false;
  return accuracy(m) < WEAK_ACCURACY;
}

/**
 * Record one first-attempt result.
 *
 * Gold is **sticky**: once earned it is never removed. Taking back a star the
 * child already earned reads as punishment, and the star display is not where
 * accuracy needs to be strict — `isWeak` still tells the scheduler the truth.
 */
export function applyAttempt(m: RuleMastery, wasCorrect: boolean): RuleMastery {
  const next: RuleMastery = {
    attempts: m.attempts + 1,
    correct: m.correct + (wasCorrect ? 1 : 0),
    streak: wasCorrect ? m.streak + 1 : 0,
    gold: m.gold,
  };
  if (
    !next.gold &&
    next.streak >= GOLD_STREAK &&
    next.attempts >= GOLD_MIN_ATTEMPTS &&
    accuracy(next) >= GOLD_MIN_ACCURACY
  ) {
    next.gold = true;
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-mastery`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/services/mastery.ts tests/unit/grammar-mastery.test.ts
git commit -m "feat(grammar): add per-rule mastery maths with sticky gold"
```

---

### Task 7: Adaptive rule scheduler

Chooses which rules a 10-round session drills, weighted toward weak ones.

**Files:**
- Create: `src/english/grammar/services/rule-scheduler.ts`
- Test: `tests/unit/grammar-rule-scheduler.test.ts`

**Interfaces:**
- Consumes: `RuleId` (Task 1), `Rng` (Task 2), `MasteryMap`/`isWeak`/`isUnseen` (Task 6).
- Produces: `ruleWeight(m)`, `selectRules(ruleIds, mastery, count, rng)`, `breakRuns(list, rng)`, weight constants.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-rule-scheduler.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap, RuleMastery } from '@/english/grammar/services/mastery';
import {
  ruleWeight,
  selectRules,
  breakRuns,
  WEIGHT_UNSEEN,
  WEIGHT_WEAK,
  WEIGHT_LEARNING,
  WEIGHT_GOLD,
} from '@/english/grammar/services/rule-scheduler';
import type { RuleId } from '@/english/grammar/data/rules';

const run = (results: boolean[]): RuleMastery =>
  results.reduce((m, c) => applyAttempt(m, c), EMPTY_MASTERY);

const GOLD = run([false, false, ...Array(8).fill(true)]);
const WEAK = run([false, false, false, true]);
const LEARNING = run([true, true, true, false, true]);

describe('ruleWeight', () => {
  it('weights an unseen rule for establishing', () => {
    expect(ruleWeight(undefined)).toBe(WEIGHT_UNSEEN);
  });

  it('weights a weak rule highest', () => {
    expect(ruleWeight(WEAK)).toBe(WEIGHT_WEAK);
  });

  it('weights a healthy learning rule in the middle', () => {
    expect(ruleWeight(LEARNING)).toBe(WEIGHT_LEARNING);
  });

  it('weights a gold rule lowest but never zero', () => {
    expect(ruleWeight(GOLD)).toBe(WEIGHT_GOLD);
    expect(WEIGHT_GOLD).toBeGreaterThan(0);
  });

  it('prefers weak over gold for a slipping gold rule', () => {
    let m = GOLD;
    for (let i = 0; i < 12; i++) m = applyAttempt(m, false);
    expect(ruleWeight(m)).toBe(WEIGHT_WEAK);
  });
});

describe('selectRules', () => {
  const rules: RuleId[] = ['plural.s', 'plural.es', 'plural.ies'];

  it('returns exactly `count` rules', () => {
    expect(selectRules(rules, {}, 10, makeRng(1))).toHaveLength(10);
  });

  it('only returns rules it was given', () => {
    for (const r of selectRules(rules, {}, 10, makeRng(2))) {
      expect(rules).toContain(r);
    }
  });

  it('returns an empty list when given no rules', () => {
    expect(selectRules([], {}, 10, makeRng(3))).toEqual([]);
  });

  it('is deterministic for a given seed', () => {
    expect(selectRules(rules, {}, 10, makeRng(5)))
      .toEqual(selectRules(rules, {}, 10, makeRng(5)));
  });

  it('drills the weak rule markedly more than the gold ones', () => {
    const mastery: MasteryMap = {
      'plural.s': GOLD,
      'plural.es': WEAK,
      'plural.ies': GOLD,
    };
    const picked = selectRules(rules, mastery, 200, makeRng(11));
    const weakCount = picked.filter((r) => r === 'plural.es').length;
    expect(weakCount).toBeGreaterThan(100);
  });

  it('still surfaces gold rules occasionally', () => {
    const mastery: MasteryMap = {
      'plural.s': GOLD,
      'plural.es': WEAK,
      'plural.ies': GOLD,
    };
    const picked = selectRules(rules, mastery, 200, makeRng(12));
    expect(picked.filter((r) => r === 'plural.s').length).toBeGreaterThan(0);
  });

  it('never repeats the same rule three times in a row', () => {
    const picked = selectRules(rules, {}, 60, makeRng(13));
    for (let i = 2; i < picked.length; i++) {
      const threePeat = picked[i] === picked[i - 1] && picked[i - 1] === picked[i - 2];
      expect(threePeat, `three-in-a-row at index ${i}`).toBe(false);
    }
  });

  it('tolerates a single-rule game without hanging', () => {
    const picked = selectRules(['letter.bd'], {}, 10, makeRng(14));
    expect(picked).toEqual(Array(10).fill('letter.bd'));
  });
});

describe('breakRuns', () => {
  it('breaks up a three-in-a-row when an alternative exists', () => {
    const out = breakRuns(['a', 'a', 'a', 'b'] as unknown as RuleId[], makeRng(1));
    expect(out).toHaveLength(4);
    for (let i = 2; i < out.length; i++) {
      expect(out[i] === out[i - 1] && out[i - 1] === out[i - 2]).toBe(false);
    }
  });

  it('preserves the multiset of rules', () => {
    const input = ['a', 'a', 'a', 'b', 'b'] as unknown as RuleId[];
    const out = breakRuns(input, makeRng(2));
    expect([...out].sort()).toEqual([...input].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-rule-scheduler`
Expected: FAIL — cannot resolve `@/english/grammar/services/rule-scheduler`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/services/rule-scheduler.ts`:

```ts
import type { RuleId } from '@/english/grammar/data/rules';
import type { Rng } from './rng';
import { isUnseen, isWeak } from './mastery';
import type { MasteryMap, RuleMastery } from './mastery';

/**
 * Picks which rules a session drills. Weighted sampling toward the rules the
 * child is getting wrong, so rounds are not spent re-teaching what they already
 * know — the whole reason this track tracks anything at all.
 */

export const WEIGHT_UNSEEN = 3;
export const WEIGHT_WEAK = 5;
export const WEIGHT_LEARNING = 2;
/** Never 0: mastered rules must resurface occasionally or they decay unseen. */
export const WEIGHT_GOLD = 1;

export function ruleWeight(m: RuleMastery | undefined): number {
  if (isUnseen(m)) return WEIGHT_UNSEEN;
  // Weak is checked before gold: gold is sticky, but a slipping gold rule
  // should still be drilled hard.
  if (isWeak(m)) return WEIGHT_WEAK;
  if (m?.gold) return WEIGHT_GOLD;
  return WEIGHT_LEARNING;
}

/**
 * Reorder so no rule appears three times consecutively. Swaps the offending
 * item with a later, different one; leaves the list alone when no such item
 * exists (e.g. a single-rule game).
 */
export function breakRuns(list: RuleId[], rng: Rng): RuleId[] {
  const out = [...list];
  for (let i = 2; i < out.length; i++) {
    if (out[i] !== out[i - 1] || out[i - 1] !== out[i - 2]) continue;
    const options: number[] = [];
    for (let j = i + 1; j < out.length; j++) {
      if (out[j] !== out[i]) options.push(j);
    }
    if (options.length === 0) continue;
    const j = options[Math.floor(rng() * options.length)];
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` rules, weighted by mastery, with three-in-a-row runs broken up. */
export function selectRules(
  ruleIds: RuleId[],
  mastery: MasteryMap,
  count: number,
  rng: Rng,
): RuleId[] {
  if (ruleIds.length === 0 || count <= 0) return [];

  const weights = ruleIds.map((id) => ruleWeight(mastery[id]));
  const total = weights.reduce((sum, w) => sum + w, 0);

  const picked: RuleId[] = [];
  for (let i = 0; i < count; i++) {
    let roll = rng() * total;
    let chosen = ruleIds[ruleIds.length - 1];
    for (let j = 0; j < ruleIds.length; j++) {
      roll -= weights[j];
      if (roll <= 0) {
        chosen = ruleIds[j];
        break;
      }
    }
    picked.push(chosen);
  }
  return breakRuns(picked, rng);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- grammar-rule-scheduler`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/services/rule-scheduler.ts tests/unit/grammar-rule-scheduler.test.ts
git commit -m "feat(grammar): add adaptive rule scheduler weighted to weak rules"
```

---

### Task 8: Dexie v5 — rule mastery table

**Files:**
- Modify: `src/shared/db/schema.ts` (append after `MathOlympiadStateRow`, and to the table-type block at the end)
- Modify: `src/shared/db/db.ts:56-65` (add `version(5)` after the existing `version(4)` block; add the field declaration in the class body)
- Test: `tests/integration/dexie-migration-v4-v5.test.ts`

**Interfaces:**
- Consumes: nothing (uses a plain `string` for `ruleId` to keep the DB layer free of module coupling).
- Produces: `RuleMasteryRow`, `RuleMasteryTable`, `db.ruleMastery`.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/dexie-migration-v4-v5.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db/db';

describe('Dexie v4 → v5 migration', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
  });

  it('opens at version 5', async () => {
    expect(db.verno).toBe(5);
  });

  it('exposes the ruleMastery table', () => {
    expect(db.ruleMastery).toBeDefined();
  });

  it('preserves existing word progress across the upgrade', async () => {
    await db.wordProgress.put({
      id: 'child-1:animals.cat',
      childId: 'child-1',
      wordId: 'animals.cat',
      wordSetId: 'animals',
      stage: 3,
      consecutiveCorrect: 2,
      totalIncorrect: 1,
      priorityScore: 55,
      lastReviewedAt: 1_700_000_000_000,
      introducedAt: 1_699_000_000_000,
    });

    const row = await db.wordProgress.get('child-1:animals.cat');
    expect(row?.stage).toBe(3);
    expect(row?.introducedAt).toBe(1_699_000_000_000);
  });

  it('preserves existing math progress across the upgrade', async () => {
    await db.mathTopicProgress.put({
      id: 'child-1:addition',
      childId: 'child-1',
      topicId: 'addition',
      stars: 2,
      level: 4,
      updatedAt: 1_700_000_000_000,
    });
    const row = await db.mathTopicProgress.get('child-1:addition');
    expect(row?.stars).toBe(2);
    expect(row?.level).toBe(4);
  });

  it('reads back a rule mastery row by the [childId+ruleId] index', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.es',
      childId: 'child-1',
      ruleId: 'plural.es',
      attempts: 9,
      correct: 8,
      streak: 6,
      gold: true,
      lastSeenAt: 1_700_000_000_000,
    });

    const found = await db.ruleMastery
      .where('[childId+ruleId]')
      .equals(['child-1', 'plural.es'])
      .toArray();

    expect(found).toHaveLength(1);
    expect(found[0].gold).toBe(true);
  });

  it('scopes mastery rows per child', async () => {
    await db.ruleMastery.bulkPut([
      { id: 'a:plural.s', childId: 'a', ruleId: 'plural.s', attempts: 1, correct: 1, streak: 1, gold: false, lastSeenAt: 1 },
      { id: 'b:plural.s', childId: 'b', ruleId: 'plural.s', attempts: 5, correct: 0, streak: 0, gold: false, lastSeenAt: 2 },
    ]);
    const forA = await db.ruleMastery.where('childId').equals('a').toArray();
    expect(forA).toHaveLength(1);
    expect(forA[0].attempts).toBe(1);
  });
});
```

> **Implementer note:** check that `fake-indexeddb` is available — `tests/integration/dexie-migration-v1-v2.test.ts` already exercises Dexie, so copy whatever import style that file uses rather than assuming `fake-indexeddb/auto`. Run `head -20 tests/integration/dexie-migration-v1-v2.test.ts` first and match it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:int -- dexie-migration-v4-v5`
Expected: FAIL — `db.verno` is 4, and `db.ruleMastery` is undefined.

- [ ] **Step 3: Add the row type**

In `src/shared/db/schema.ts`, append after the `MathOlympiadStateRow` interface (before the `export type ...Table` block):

```ts
/**
 * Per-child mastery of one grammar rule. `ruleId` is a `RuleId` from
 * `@/english/grammar/data/rules`, kept as a plain string here so the DB layer
 * has no dependency on the grammar module.
 *
 * `attempts`/`correct` count **first attempts only** — retries within an item
 * are deliberately not recorded.
 */
export interface RuleMasteryRow {
  id: string; // composite: `${childId}:${ruleId}`
  childId: string;
  ruleId: string;
  attempts: number;
  correct: number;
  /** Consecutive first-attempt correct answers. */
  streak: number;
  /** Sticky once earned — never cleared. */
  gold: boolean;
  lastSeenAt: number;
}
```

And append to the table-type block at the end of the file:

```ts
export type RuleMasteryTable = Table<RuleMasteryRow, string>;
```

- [ ] **Step 4: Add the migration**

In `src/shared/db/db.ts`:

Add to the import type list at the top:

```ts
  RuleMasteryTable,
```

Add to the class body after `mathOlympiadState`:

```ts
  ruleMastery!: RuleMasteryTable;
```

And append after the closing `});` of the `version(4)` block, still inside the constructor:

```ts
    // v5: Grammar track — per-rule mastery. Additive table only; existing
    // vocab and math progress is untouched.
    this.version(5).stores({
      childProfiles: 'id, createdAt',
      wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
      wordSetState: 'id, childId, [childId+wordSetId]',
      achievements: 'id, childId, [childId+earnedAt]',
      mathProfileState: 'id, childId',
      mathTopicProgress: 'id, childId, [childId+topicId]',
      mathLevelResults: 'id, childId, [childId+topicId]',
      mathOlympiadState: 'id, childId',
      ruleMastery: 'id, childId, [childId+ruleId]',
    });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:int -- dexie-migration-v4-v5`
Expected: PASS, 6 tests.

- [ ] **Step 6: Verify nothing else broke**

Run: `npm run test && npm run typecheck`
Expected: all existing suites still pass.

- [ ] **Step 7: Commit**

```bash
git add src/shared/db/schema.ts src/shared/db/db.ts tests/integration/dexie-migration-v4-v5.test.ts
git commit -m "feat(db): add ruleMastery table at schema v5"
```

---

### Task 9: useRuleMastery hook

Dexie read/write for mastery, mirroring `useWordProgress`.

**Files:**
- Create: `src/english/grammar/hooks/useRuleMastery.ts`
- Test: `tests/integration/use-rule-mastery.test.tsx`

**Interfaces:**
- Consumes: `db` (Task 8), `useProfileStore`, `applyAttempt`/`EMPTY_MASTERY`/`MasteryMap` (Task 6), `RuleId` (Task 1).
- Produces: `useRuleMastery(): { getMastery, recordAttempt }`.

`useProfileStore` exposes `activeProfileId: string | null` — this is the value stored in the DB's `childId` column.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/use-rule-mastery.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { renderHook, act } from '@testing-library/react';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';

describe('useRuleMastery', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('starts with an empty mastery map', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await expect(result.current.getMastery()).resolves.toEqual({});
  });

  it('creates a row on the first attempt', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.es', true);
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.es']).toMatchObject({
      attempts: 1, correct: 1, streak: 1, gold: false,
    });
  });

  it('accumulates across attempts', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.es', true);
      await result.current.recordAttempt('plural.es', false);
      await result.current.recordAttempt('plural.es', true);
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.es']).toMatchObject({
      attempts: 3, correct: 2, streak: 1,
    });
  });

  it('goes gold after a long enough correct run', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.s', false);
      await result.current.recordAttempt('plural.s', false);
      for (let i = 0; i < 8; i++) {
        await result.current.recordAttempt('plural.s', true);
      }
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.s']?.gold).toBe(true);
  });

  it('keeps each child\'s mastery separate', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('letter.bd', true);
    });

    useProfileStore.setState({ activeProfileId: 'child-2' });
    const second = renderHook(() => useRuleMastery());
    await expect(second.result.current.getMastery()).resolves.toEqual({});
  });

  it('is a no-op when no profile is active', async () => {
    useProfileStore.setState({ activeProfileId: null });
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.s', true);
    });
    expect(await db.ruleMastery.count()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:int -- use-rule-mastery`
Expected: FAIL — cannot resolve `@/english/grammar/hooks/useRuleMastery`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/hooks/useRuleMastery.ts`:

```ts
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap, RuleMastery } from '@/english/grammar/services/mastery';
import type { RuleId } from '@/english/grammar/data/rules';

export interface UseRuleMasteryReturn {
  /** Every rule this child has attempted, keyed by rule id. */
  getMastery: () => Promise<MasteryMap>;
  /** Record one **first** attempt. Retries within an item must not call this. */
  recordAttempt: (ruleId: RuleId, wasCorrect: boolean) => Promise<void>;
}

export function useRuleMastery(): UseRuleMasteryReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getMastery = async (): Promise<MasteryMap> => {
    if (!activeProfileId) return {};
    const rows = await db.ruleMastery.where('childId').equals(activeProfileId).toArray();
    const map: MasteryMap = {};
    for (const row of rows) {
      map[row.ruleId as RuleId] = {
        attempts: row.attempts,
        correct: row.correct,
        streak: row.streak,
        gold: row.gold,
      };
    }
    return map;
  };

  const recordAttempt = async (ruleId: RuleId, wasCorrect: boolean): Promise<void> => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${ruleId}`;
    const existing = await db.ruleMastery.get(id);
    const before: RuleMastery = existing
      ? {
          attempts: existing.attempts,
          correct: existing.correct,
          streak: existing.streak,
          gold: existing.gold,
        }
      : EMPTY_MASTERY;
    const after = applyAttempt(before, wasCorrect);
    await db.ruleMastery.put({
      id,
      childId: activeProfileId,
      ruleId,
      ...after,
      lastSeenAt: Date.now(),
    });
  };

  return { getMastery, recordAttempt };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:int -- use-rule-mastery`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/hooks/useRuleMastery.ts tests/integration/use-rule-mastery.test.tsx
git commit -m "feat(grammar): add useRuleMastery hook for per-rule persistence"
```

---

### Task 10: Game item builders

The three `buildItem` implementations plus the shared `DrillItem`/`GrammarGame` types.

**Files:**
- Create: `src/english/grammar/types.ts`
- Create: `src/english/grammar/services/games/plurals.ts`
- Create: `src/english/grammar/services/games/verbs.ts`
- Create: `src/english/grammar/services/games/bd.ts`
- Create: `src/english/grammar/services/games/index.ts`
- Test: `tests/unit/grammar-games.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: `DrillItem`, `GrammarGame`, `GrammarGameId`, `PLURALS_GAME`, `VERBS_GAME`, `BD_GAME`, `GRAMMAR_GAMES`, `getGame(id)`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-games.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { GRAMMAR_GAMES, getGame } from '@/english/grammar/services/games';
import { RULE_IDS } from '@/english/grammar/data/rules';

describe('game registry', () => {
  it('registers exactly three games', () => {
    expect(GRAMMAR_GAMES.map((g) => g.id)).toEqual(['plurals', 'verbs', 'bd']);
  });

  it('looks a game up by id', () => {
    expect(getGame('bd')?.rules).toEqual(['letter.bd']);
  });

  it('returns undefined for an unknown game', () => {
    expect(getGame('nope')).toBeUndefined();
  });

  it('only claims rules that exist in the catalog', () => {
    for (const game of GRAMMAR_GAMES) {
      for (const rule of game.rules) expect(RULE_IDS).toContain(rule);
    }
  });

  it('covers all 11 rules exactly once across the three games', () => {
    const claimed = GRAMMAR_GAMES.flatMap((g) => g.rules);
    expect([...claimed].sort()).toEqual([...RULE_IDS].sort());
  });

  it('builds a usable item for every rule it claims', () => {
    for (const game of GRAMMAR_GAMES) {
      for (const rule of game.rules) {
        const item = game.buildItem(rule, makeRng(1));
        expect(item, `${game.id} could not build ${rule}`).not.toBeNull();
        expect(item!.rule).toBe(rule);
        expect(item!.options.length).toBeGreaterThanOrEqual(2);
        expect(item!.options).toContain(item!.answer);
        expect(new Set(item!.options).size).toBe(item!.options.length);
        expect(item!.picture.asset.length).toBeGreaterThan(0);
        expect(item!.picture.alt.length).toBeGreaterThan(0);
        expect(item!.picture.repeat).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = getGame('plurals')!.buildItem('plural.s', makeRng(7));
    const b = getGame('plurals')!.buildItem('plural.s', makeRng(7));
    expect(a).toEqual(b);
  });
});

describe('plurals game', () => {
  const game = getGame('plurals')!;

  it('offers "some X" vs "two Xs" for uncountables', () => {
    const item = game.buildItem('plural.uncountable', makeRng(3))!;
    expect(item.answer.startsWith('some ')).toBe(true);
    expect(item.picture.repeat).toBe(1);
  });

  it('offers "a X" vs "some X" for always-plural words', () => {
    const item = game.buildItem('plural.tantum', makeRng(4))!;
    expect(item.answer.startsWith('some ')).toBe(true);
    expect(item.options.some((o) => o.startsWith('a '))).toBe(true);
  });

  it('never offers two identical options for zero-plural words', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('plural.irregular', makeRng(seed))!;
      expect(new Set(item.options).size).toBe(item.options.length);
    }
  });

  it('shows one picture for a singular answer and three for a plural one', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('plural.s', makeRng(seed))!;
      const isPluralAnswer = item.answer.endsWith('s');
      expect(item.picture.repeat).toBe(isPluralAnswer ? 3 : 1);
    }
  });
});

describe('verbs game', () => {
  const game = getGame('verbs')!;

  it('uses a singular subject and the -es form for verb.es', () => {
    const item = game.buildItem('verb.es', makeRng(5))!;
    expect(item.sentence).toMatch(/^the \w+ ___/);
    expect(item.picture.repeat).toBe(1);
    expect(item.answer.endsWith('es')).toBe(true);
  });

  it('uses a plural subject and the bare form for verb.base', () => {
    const item = game.buildItem('verb.base', makeRng(6))!;
    expect(item.picture.repeat).toBe(2);
    expect(item.rule).toBe('verb.base');
  });

  it('always ends the sentence with a full stop', () => {
    for (let seed = 0; seed < 20; seed++) {
      const item = game.buildItem('verb.s', makeRng(seed))!;
      expect(item.sentence?.endsWith('.')).toBe(true);
    }
  });

  it('never leaves a double space when the object is empty', () => {
    for (let seed = 0; seed < 40; seed++) {
      const item = game.buildItem('verb.s', makeRng(seed))!;
      expect(item.sentence).not.toMatch(/ {2}/);
      expect(item.sentence).not.toMatch(/ \./);
    }
  });
});

describe('bd game', () => {
  const game = getGame('bd')!;

  it('always attaches the bed-anchor hint', () => {
    const item = game.buildItem('letter.bd', makeRng(8))!;
    expect(item.hint).toBe('bed-anchor');
  });

  it('answers with the real word, not the flipped one', () => {
    for (let seed = 0; seed < 20; seed++) {
      const item = game.buildItem('letter.bd', makeRng(seed))!;
      expect(item.options).toHaveLength(2);
      expect(item.answer).toBe(item.picture.alt);
    }
  });

  it('returns null for a rule it does not own', () => {
    expect(game.buildItem('plural.s', makeRng(1))).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-games`
Expected: FAIL — cannot resolve `@/english/grammar/services/games`.

- [ ] **Step 3: Write the shared types**

Create `src/english/grammar/types.ts`:

```ts
import type { RuleId } from './data/rules';
import type { Rng } from './services/rng';

export type GrammarGameId = 'plurals' | 'verbs' | 'bd';

/** One question. The engine renders this without knowing which game made it. */
export interface DrillItem {
  rule: RuleId;
  picture: {
    asset: string;
    /** Screen-reader description; also the real word in the b/d game. */
    alt: string;
    /** How many times to repeat the picture — 3 apples means "apples". */
    repeat: number;
  };
  /** Gapped sentence, e.g. "the teacher ___ English." Absent in picture-only games. */
  sentence?: string;
  options: string[];
  answer: string;
  /** Optional on-screen help the engine knows how to render. */
  hint?: 'bed-anchor';
}

export interface GrammarGame {
  id: GrammarGameId;
  /** Rules this game can build items for. */
  rules: RuleId[];
  /** Returns null when no item can be built — the caller should try another rule. */
  buildItem: (rule: RuleId, rng: Rng) => DrillItem | null;
}
```

- [ ] **Step 4: Write the plurals game**

Create `src/english/grammar/services/games/plurals.ts`:

```ts
import { pluralOf, pluralWordsByRule } from '@/english/grammar/data/plural-forms';
import type { PluralRuleId, RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const PLURAL_RULES: RuleId[] = [
  'plural.s',
  'plural.es',
  'plural.ies',
  'plural.irregular',
  'plural.uncountable',
  'plural.tantum',
];

const buckets = pluralWordsByRule();

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (!PLURAL_RULES.includes(rule)) return null;
  const word = pickFrom(buckets[rule as PluralRuleId], rng);
  if (!word) return null;

  const picture = { asset: word.pictureAsset, alt: word.text, repeat: 1 };

  // "some milk" is right; "two milks" is the mistake worth catching.
  if (rule === 'plural.uncountable') {
    const answer = `some ${word.text}`;
    return {
      rule,
      picture,
      options: shuffle([answer, `two ${word.text}s`], rng),
      answer,
    };
  }

  // Always-plural words have no singular: "a jeans" is the mistake.
  if (rule === 'plural.tantum') {
    const answer = `some ${word.text}`;
    return {
      rule,
      picture,
      options: shuffle([answer, `a ${word.text}`], rng),
      answer,
    };
  }

  const entry = pluralOf(word);
  if (!entry || entry.plural === null) return null;
  const plural = entry.plural;

  // sheep → sheep: there is no second form to contrast, so contrast against
  // the mistake the child would actually make ("sheeps").
  if (plural === word.text) {
    return {
      rule,
      picture: { ...picture, repeat: 3 },
      options: shuffle([word.text, `${word.text}s`], rng),
      answer: word.text,
    };
  }

  const wantPlural = rng() < 0.5;
  return {
    rule,
    picture: { ...picture, repeat: wantPlural ? 3 : 1 },
    options: shuffle([word.text, plural], rng),
    answer: wantPlural ? plural : word.text,
  };
}

export const PLURALS_GAME: GrammarGame = {
  id: 'plurals',
  rules: PLURAL_RULES,
  buildItem,
};
```

- [ ] **Step 5: Write the verbs game**

Create `src/english/grammar/services/games/verbs.ts`:

```ts
import { verbEntriesByRule, subjectFormsFor } from '@/english/grammar/data/verb-forms';
import type { VerbRuleId, RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const VERB_RULES: RuleId[] = ['verb.base', 'verb.s', 'verb.es', 'verb.ies'];

/** "the teacher ___ English." — no double spaces when the object is empty. */
function sentenceFor(subject: string, object: string): string {
  return `${subject} ___${object ? ` ${object}` : ''}.`;
}

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (!VERB_RULES.includes(rule)) return null;

  const entry = pickFrom(verbEntriesByRule()[rule as VerbRuleId], rng);
  if (!entry) return null;

  const forms = subjectFormsFor(entry);
  if (!forms) return null;

  // A plural subject takes the bare form; a singular one takes the ending.
  const isBase = rule === 'verb.base';
  const subject = isBase ? forms.plural : forms.singular;

  return {
    rule,
    picture: {
      asset: forms.asset,
      alt: subject,
      // Two pictures make "the teachers" visibly plural.
      repeat: isBase ? 2 : 1,
    },
    sentence: sentenceFor(subject, entry.object),
    options: shuffle([entry.base, entry.third], rng),
    answer: isBase ? entry.base : entry.third,
  };
}

export const VERBS_GAME: GrammarGame = {
  id: 'verbs',
  rules: VERB_RULES,
  buildItem,
};
```

- [ ] **Step 6: Write the b/d game**

Create `src/english/grammar/services/games/bd.ts`:

```ts
import { bdCandidates } from '@/english/grammar/data/bd-words';
import type { RuleId } from '@/english/grammar/data/rules';
import type { DrillItem, GrammarGame } from '@/english/grammar/types';
import { pickFrom, shuffle } from '../rng';
import type { Rng } from '../rng';

const candidates = bdCandidates();

function buildItem(rule: RuleId, rng: Rng): DrillItem | null {
  if (rule !== 'letter.bd') return null;
  const candidate = pickFrom(candidates, rng);
  if (!candidate) return null;

  return {
    rule,
    picture: {
      asset: candidate.word.pictureAsset,
      alt: candidate.word.text,
      repeat: 1,
    },
    options: shuffle([candidate.word.text, candidate.distractor], rng),
    answer: candidate.word.text,
    hint: 'bed-anchor',
  };
}

export const BD_GAME: GrammarGame = {
  id: 'bd',
  rules: ['letter.bd'],
  buildItem,
};
```

- [ ] **Step 7: Write the registry**

Create `src/english/grammar/services/games/index.ts`:

```ts
import type { GrammarGame } from '@/english/grammar/types';
import { PLURALS_GAME } from './plurals';
import { VERBS_GAME } from './verbs';
import { BD_GAME } from './bd';

export { PLURALS_GAME, VERBS_GAME, BD_GAME };

/** Order matters: this is the order the hub lists the games in. */
export const GRAMMAR_GAMES: GrammarGame[] = [PLURALS_GAME, VERBS_GAME, BD_GAME];

export function getGame(id: string): GrammarGame | undefined {
  return GRAMMAR_GAMES.find((g) => g.id === id);
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test:unit -- grammar-games`
Expected: PASS, 19 tests.

- [ ] **Step 9: Commit**

```bash
git add src/english/grammar/types.ts src/english/grammar/services/games tests/unit/grammar-games.test.ts
git commit -m "feat(grammar): add item builders for plurals, verbs and b/d games"
```

---

### Task 11: The bed-anchor card

The b/d mnemonic, shown on first visit and available as a hint afterwards.

**Files:**
- Create: `src/english/grammar/components/BedAnchorCard.tsx`
- Modify: `src/locales/en/vocab.json` (add the `grammar` block)
- Test: `tests/unit/grammar-bed-anchor.test.tsx`

**Interfaces:**
- Consumes: `useTranslation('vocab')`.
- Produces: `BedAnchorCard({ onDismiss }: { onDismiss: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/grammar-bed-anchor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithI18n } from '../i18n-test-utils';
import { BedAnchorCard } from '@/english/grammar/components/BedAnchorCard';

describe('BedAnchorCard', () => {
  it('shows the bed mnemonic', () => {
    renderWithI18n(<BedAnchorCard onDismiss={() => {}} />);
    expect(screen.getByText(/bed/i)).toBeInTheDocument();
  });

  it('calls onDismiss when the button is tapped', async () => {
    const onDismiss = vi.fn();
    renderWithI18n(<BedAnchorCard onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('labels the b and d halves for screen readers', () => {
    renderWithI18n(<BedAnchorCard onDismiss={() => {}} />);
    expect(screen.getByRole('img', { name: /b.*d|hands/i })).toBeInTheDocument();
  });
});
```

> **Implementer note:** check `tests/i18n-test-utils.tsx` for the exact helper name it exports before writing this test — it may be `renderWithI18n` or a provider component. Run `cat tests/i18n-test-utils.tsx` and match its API. If it exports a plain provider, wrap with that instead and adjust the import.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- grammar-bed-anchor`
Expected: FAIL — cannot resolve `@/english/grammar/components/BedAnchorCard`.

- [ ] **Step 3: Add the i18n strings**

In `src/locales/en/vocab.json`, add a top-level `"grammar"` key alongside the existing `"readingWriting"` key:

```json
  "grammar": {
    "sectionTitle": "Grammar",
    "sectionHint": "Fix the word endings",
    "plurals": "One or Many",
    "verbs": "Who Does What?",
    "bd": "b or d",
    "backButton": "Back",
    "playAgain": "Play again",
    "exit": "Done",
    "progress": "{{done}} of {{total}}",
    "wellDone": "Great job!",
    "hintButton": "Show me the trick",
    "howsItGoing": "How's it going?",
    "ruleAttempts": "{{correct}} right out of {{attempts}}",
    "ruleUnseen": "Not tried yet",
    "bedAnchor": {
      "title": "Make a bed with your hands!",
      "body": "Left hand is b. Right hand is d. Together they spell bed.",
      "handsAlt": "Two hands forming the letters b and d, spelling bed",
      "gotIt": "Got it!"
    }
  },
```

- [ ] **Step 4: Write the implementation**

Create `src/english/grammar/components/BedAnchorCard.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface BedAnchorCardProps {
  onDismiss: () => void;
}

/**
 * The b/d mnemonic, shown before the first b/d round and reachable from the
 * hint button afterwards. Teaching one physical anchor fixes the cause; drilling
 * alone only rehearses the symptom.
 */
export function BedAnchorCard({ onDismiss }: BedAnchorCardProps) {
  const { t } = useTranslation('vocab');

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        borderRadius: 24,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
        {t('grammar.bedAnchor.title')}
      </h2>

      <div
        role="img"
        aria-label={t('grammar.bedAnchor.handsAlt')}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          fontSize: '3.2rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}
      >
        <span style={{ color: 'var(--primary)' }}>b</span>
        <span style={{ color: 'var(--muted-fg)' }}>e</span>
        <span style={{ color: 'var(--accent, var(--destructive))' }}>d</span>
      </div>

      <p style={{ fontWeight: 700, color: 'var(--muted-fg)', margin: 0, maxWidth: 320 }}>
        {t('grammar.bedAnchor.body')}
      </p>

      <button
        className="btn-primary"
        onClick={onDismiss}
        style={{ minHeight: 52, padding: '0 32px' }}
      >
        {t('grammar.bedAnchor.gotIt')}
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- grammar-bed-anchor`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/english/grammar/components/BedAnchorCard.tsx src/locales/en/vocab.json tests/unit/grammar-bed-anchor.test.tsx
git commit -m "feat(grammar): add bed-anchor mnemonic card and grammar i18n strings"
```

---

### Task 12: The drill engine

One page component that runs any `GrammarGame` for 10 rounds.

**Files:**
- Create: `src/english/grammar/components/GrammarDrillPage.tsx`
- Test: `tests/integration/grammar-drill.test.tsx`

**Interfaces:**
- Consumes: `getGame` (Task 10), `useRuleMastery` (Task 9), `selectRules` (Task 7), `makeRng` (Task 2), `BedAnchorCard` (Task 11), plus existing `useAnswerFeedback`, `Mascot`, `CelebrationEffect`, `playWin`, `speak`.
- Produces: `GrammarDrillPage()` — reads `:gameId` from the route.

Behaviour contract, matching `YesNoPage`:
- 10 rounds. A wrong tap shakes and lets the child retry; a correct tap advances.
- **Only the first tap on each item is recorded** via `recordAttempt`.
- Completion shows `CelebrationEffect`, plays `playWin`, and offers Play again / Done.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/grammar-drill.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));
vi.mock('@/shared/utils/sfx', () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playBuzz: vi.fn(),
}));

const renderGame = (gameId: string) =>
  render(
    <MemoryRouter initialEntries={[`/grammar/${gameId}`]}>
      <Routes>
        <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
      </Routes>
    </MemoryRouter>,
  );

/** Tap the correct option for the round currently on screen. */
async function answerCorrectly() {
  const buttons = await screen.findAllByTestId('drill-option');
  const correct = buttons.find((b) => b.getAttribute('data-correct') === 'true');
  if (!correct) throw new Error('no correct option rendered');
  await userEvent.click(correct);
}

describe('GrammarDrillPage', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.clearAllMocks();
  });

  it('renders a question with options', async () => {
    renderGame('plurals');
    expect((await screen.findAllByTestId('drill-option')).length).toBeGreaterThanOrEqual(2);
  });

  it('shows an unknown-game message for a bad id', async () => {
    renderGame('nope');
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it('records a first-attempt correct answer', async () => {
    renderGame('plurals');
    await answerCorrectly();
    await waitFor(async () => {
      expect(await db.ruleMastery.count()).toBe(1);
    });
    const rows = await db.ruleMastery.toArray();
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].correct).toBe(1);
  });

  it('records a wrong first attempt and does not advance', async () => {
    renderGame('plurals');
    const buttons = await screen.findAllByTestId('drill-option');
    const wrong = buttons.find((b) => b.getAttribute('data-correct') === 'false')!;
    await userEvent.click(wrong);

    await waitFor(async () => {
      expect(await db.ruleMastery.count()).toBe(1);
    });
    const rows = await db.ruleMastery.toArray();
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].correct).toBe(0);
    expect(screen.getByTestId('drill-progress')).toHaveTextContent('0 of 10');
  });

  it('records only the first attempt, not the retry', async () => {
    renderGame('plurals');
    const buttons = await screen.findAllByTestId('drill-option');
    const wrong = buttons.find((b) => b.getAttribute('data-correct') === 'false')!;
    await userEvent.click(wrong);
    await answerCorrectly();

    await waitFor(async () => {
      const rows = await db.ruleMastery.toArray();
      const total = rows.reduce((n, r) => n + r.attempts, 0);
      expect(total).toBe(1);
    });
  });

  it('reaches a celebration after ten rounds', async () => {
    renderGame('plurals');
    for (let i = 0; i < 10; i++) await answerCorrectly();
    expect(await screen.findByText(/great job/i)).toBeInTheDocument();
  });

  it('opens the bed anchor before the first b/d round', async () => {
    renderGame('bd');
    expect(await screen.findByText(/make a bed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect((await screen.findAllByTestId('drill-option')).length).toBe(2);
  });

  it('does not show the bed anchor in the plurals game', async () => {
    renderGame('plurals');
    await screen.findAllByTestId('drill-option');
    expect(screen.queryByText(/make a bed/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:int -- grammar-drill`
Expected: FAIL — cannot resolve `@/english/grammar/components/GrammarDrillPage`.

- [ ] **Step 3: Write the implementation**

Create `src/english/grammar/components/GrammarDrillPage.tsx`:

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { useAnswerFeedback } from '@/english/vocab/components/answer-feedback';
import { playWin } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import { getGame } from '@/english/grammar/services/games';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';
import { selectRules } from '@/english/grammar/services/rule-scheduler';
import { makeRng } from '@/english/grammar/services/rng';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import type { DrillItem } from '@/english/grammar/types';
import { BedAnchorCard } from './BedAnchorCard';

const ROUNDS = 10;

/**
 * The shared 10-round engine. It knows nothing about plurals, verbs or letters
 * — a `GrammarGame` supplies the items, and the scheduler decides which rules
 * to draw them from, weighted toward the ones this child is getting wrong.
 */
export function GrammarDrillPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { signalCorrect, signalWrong, feedbackNode } = useAnswerFeedback();
  const { getMastery, recordAttempt } = useRuleMastery();

  const game = gameId ? getGame(gameId) : undefined;

  const [mastery, setMastery] = useState<MasteryMap | null>(null);
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  /** First tap on the current item already recorded? */
  const [scored, setScored] = useState(false);
  const [done, setDone] = useState(false);
  const [showAnchor, setShowAnchor] = useState(false);

  useEffect(() => {
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the whole round list once per session so the questions are stable.
  const items = useMemo<DrillItem[]>(() => {
    if (!game || !mastery) return [];
    const rng = makeRng(seed);
    const rules = selectRules(game.rules, mastery, ROUNDS, rng);
    const built: DrillItem[] = [];
    for (const rule of rules) {
      const item = game.buildItem(rule, rng);
      // A rule that can't produce an item is skipped rather than crashing.
      if (item) built.push(item);
    }
    return built;
  }, [game, mastery, seed]);

  const item = items[index];

  useEffect(() => {
    if (item?.hint === 'bed-anchor' && index === 0 && !done) setShowAnchor(true);
  }, [item, index, done]);

  // Speak the *completed* sentence only after a correct answer. Speaking it on
  // arrival would read the answer aloud and make the question free.
  useEffect(() => {
    if (answered && item?.sentence) speak(item.sentence.replace('___', item.answer));
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done) playWin();
  }, [done]);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setAnswered(false);
    setWrongOption(null);
    setScored(false);
    setDone(false);
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) {
    return (
      <div style={{ padding: 24 }}>
        Game not found. <a href="/">Go home</a>
      </div>
    );
  }

  const handleAnswer = (option: string) => {
    if (answered || !item) return;
    const isCorrect = option === item.answer;

    // Only the first tap counts. Retry-until-right is good for morale but
    // useless as a signal — counting the third guess would make every rule
    // look mastered.
    if (!scored) {
      setScored(true);
      void recordAttempt(item.rule, isCorrect);
    }

    if (isCorrect) {
      signalCorrect();
      setWrongOption(null);
      setAnswered(true);
    } else {
      signalWrong();
      setWrongOption(option);
      setTimeout(() => setWrongOption(null), 400);
    }
  };

  const next = () => {
    setAnswered(false);
    setScored(false);
    if (index + 1 >= items.length) setDone(true);
    else setIndex((i) => i + 1);
  };

  const mascot = answered ? 'celebrate' : wrongOption ? 'encourage' : 'idle';

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <CelebrationEffect active={done} />
      {feedbackNode}

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button
          className="icon-btn"
          onClick={() => navigate('/grammar')}
          aria-label={t('grammar.backButton')}
        >
          ✕
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t(`grammar.${game.id}`)}</h1>
        <span
          className="badge"
          data-testid="drill-progress"
          style={{ marginLeft: 'auto' }}
          aria-live="polite"
        >
          {t('grammar.progress', { done: done ? items.length : index, total: ROUNDS })}
        </span>
      </header>

      {showAnchor && <BedAnchorCard onDismiss={() => setShowAnchor(false)} />}

      {!showAnchor && done && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('grammar.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('grammar.playAgain')}
            </button>
            <button className="btn-primary" onClick={() => navigate('/grammar')} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('grammar.exit')}
            </button>
          </div>
        </div>
      )}

      {!showAnchor && !done && item && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: item.picture.repeat }, (_, i) => (
              <img
                key={i}
                src={item.picture.asset}
                alt={i === 0 ? item.picture.alt : ''}
                aria-hidden={i > 0 ? 'true' : undefined}
                style={{
                  width: item.picture.repeat > 1 ? 88 : 200,
                  height: item.picture.repeat > 1 ? 88 : 150,
                  objectFit: 'contain',
                  borderRadius: 16,
                  background: 'var(--paper)',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
            ))}
          </div>

          {item.sentence && (
            <p style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>
              {item.sentence}
            </p>
          )}

          {answered ? (
            <button
              className="btn-accent"
              onClick={next}
              aria-label={t('grammar.wellDone')}
              style={{ minHeight: 56, padding: '0 40px', fontSize: '1.4rem' }}
            >
              →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {item.options.map((option) => (
                <motion.button
                  key={option}
                  data-testid="drill-option"
                  data-correct={option === item.answer}
                  onClick={() => handleAnswer(option)}
                  animate={wrongOption === option ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                  whileTap={{ scale: 0.94 }}
                  className="card"
                  style={{
                    minWidth: 128,
                    minHeight: 64,
                    padding: '0 20px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          )}

          {item.hint === 'bed-anchor' && !answered && (
            <button
              className="icon-btn"
              onClick={() => setShowAnchor(true)}
              aria-label={t('grammar.hintButton')}
            >
              💡
            </button>
          )}

          <Mascot reaction={mascot} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:int -- grammar-drill`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/grammar/components/GrammarDrillPage.tsx tests/integration/grammar-drill.test.tsx
git commit -m "feat(grammar): add shared 10-round adaptive drill engine"
```

---

### Task 13: The grammar hub + parent rule view

**Files:**
- Create: `src/english/grammar/components/RuleChips.tsx`
- Create: `src/english/grammar/components/GrammarHubPage.tsx`
- Test: `tests/integration/grammar-hub.test.tsx`

**Interfaces:**
- Consumes: `GRAMMAR_GAMES` (Task 10), `useRuleMastery` (Task 9), `RULES`/`getRule` (Task 1), `accuracy`/`isWeak`/`MasteryMap` (Task 6).
- Produces: `RuleChips({ mastery })`, `GrammarHubPage()`, `gameStars(game, mastery)`, `grammarProgress(mastery)`.

`grammarProgress` returns golds ÷ 11 and is imported by Task 14.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/grammar-hub.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarHubPage, grammarProgress } from '@/english/grammar/components/GrammarHubPage';
import type { MasteryMap } from '@/english/grammar/services/mastery';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

const renderHub = () =>
  render(
    <MemoryRouter>
      <GrammarHubPage />
    </MemoryRouter>,
  );

describe('GrammarHubPage', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('lists all three games', async () => {
    renderHub();
    expect(await screen.findByText('One or Many')).toBeInTheDocument();
    expect(screen.getByText('Who Does What?')).toBeInTheDocument();
    expect(screen.getByText('b or d')).toBeInTheDocument();
  });

  it('shows one chip per rule', async () => {
    renderHub();
    await waitFor(() => {
      expect(screen.getAllByTestId('rule-chip')).toHaveLength(11);
    });
  });

  it('marks a gold rule as mastered', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.s', childId: 'child-1', ruleId: 'plural.s',
      attempts: 10, correct: 9, streak: 8, gold: true, lastSeenAt: 1,
    });
    renderHub();
    await waitFor(() => {
      const chip = screen.getByTestId('rule-chip-plural.s');
      expect(chip).toHaveAttribute('data-state', 'gold');
    });
  });

  it('marks a weak rule as needing work', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.es', childId: 'child-1', ruleId: 'plural.es',
      attempts: 10, correct: 3, streak: 0, gold: false, lastSeenAt: 1,
    });
    renderHub();
    await waitFor(() => {
      expect(screen.getByTestId('rule-chip-plural.es')).toHaveAttribute('data-state', 'weak');
    });
  });

  it('marks an untried rule as unseen', async () => {
    renderHub();
    await waitFor(() => {
      expect(screen.getByTestId('rule-chip-letter.bd')).toHaveAttribute('data-state', 'unseen');
    });
  });
});

describe('grammarProgress', () => {
  it('is 0 with no mastery', () => {
    expect(grammarProgress({})).toBe(0);
  });

  it('is golds over 11', () => {
    const mastery: MasteryMap = {
      'plural.s': { attempts: 10, correct: 9, streak: 8, gold: true },
      'plural.es': { attempts: 10, correct: 9, streak: 8, gold: true },
      'plural.ies': { attempts: 4, correct: 1, streak: 0, gold: false },
    };
    expect(grammarProgress(mastery)).toBeCloseTo(2 / 11);
  });

  it('never exceeds 1', () => {
    expect(grammarProgress({})).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:int -- grammar-hub`
Expected: FAIL — cannot resolve `@/english/grammar/components/GrammarHubPage`.

- [ ] **Step 3: Write RuleChips**

Create `src/english/grammar/components/RuleChips.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { RULES } from '@/english/grammar/data/rules';
import { accuracy, isUnseen, isWeak } from '@/english/grammar/services/mastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';

type ChipState = 'gold' | 'weak' | 'learning' | 'unseen';

function chipState(mastery: MasteryMap, ruleId: string): ChipState {
  const m = mastery[ruleId as keyof MasteryMap];
  if (isUnseen(m)) return 'unseen';
  if (isWeak(m)) return 'weak';
  if (m?.gold) return 'gold';
  return 'learning';
}

const MARK: Record<ChipState, string> = {
  gold: '✅',
  weak: '⚠️',
  learning: '•',
  unseen: '☆',
};

interface RuleChipsProps {
  mastery: MasteryMap;
}

/**
 * The parent-facing view: one chip per rule, so a grown-up can see at a glance
 * which rules are still shaky. This is how you tell whether the app is working,
 * so it ships with the feature rather than later.
 */
export function RuleChips({ mastery }: RuleChipsProps) {
  const { t } = useTranslation('vocab');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {RULES.map((rule) => {
        const state = chipState(mastery, rule.id);
        const m = mastery[rule.id];
        const detail = m
          ? t('grammar.ruleAttempts', { correct: m.correct, attempts: m.attempts })
          : t('grammar.ruleUnseen');
        return (
          <span
            key={rule.id}
            data-testid="rule-chip"
            data-state={state}
            title={`${rule.example} — ${detail}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 9999,
              fontSize: '0.82rem',
              fontWeight: 800,
              background: state === 'weak' ? 'var(--secondary)' : 'var(--muted)',
              color: 'var(--ink)',
              opacity: state === 'unseen' ? 0.6 : 1,
            }}
          >
            <span data-testid={`rule-chip-${rule.id}`} data-state={state} aria-hidden="true">
              {MARK[state]}
            </span>
            {rule.label}
            <span style={{ color: 'var(--muted-fg)', fontWeight: 700 }}>
              {Math.round(accuracy(m ?? { attempts: 0, correct: 0, streak: 0, gold: false }) * 100)}%
            </span>
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Write GrammarHubPage**

Create `src/english/grammar/components/GrammarHubPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speak } from '@/shared/utils/speak';
import { GRAMMAR_GAMES } from '@/english/grammar/services/games';
import { RULE_IDS } from '@/english/grammar/data/rules';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import type { GrammarGame } from '@/english/grammar/types';
import { RuleChips } from './RuleChips';

const GAME_EMOJI: Record<string, string> = {
  plurals: '🍎',
  verbs: '👩‍🏫',
  bd: '🐶',
};

const GAME_BLURB: Record<string, string> = {
  plurals: 'One apple or three?',
  verbs: 'Pick the right ending',
  bd: 'Which letter is it?',
};

/** Golds over the whole catalog — the Grammar track's aggregate progress. */
export function grammarProgress(mastery: MasteryMap): number {
  const golds = RULE_IDS.filter((id) => mastery[id]?.gold).length;
  return golds / RULE_IDS.length;
}

/** Stars (0–4) for one game, from how many of its rules have gone gold. */
export function gameStars(game: GrammarGame, mastery: MasteryMap): number {
  const golds = game.rules.filter((id) => mastery[id]?.gold).length;
  return Math.round((golds / game.rules.length) * 4);
}

/**
 * The Grammar track hub. Unlike the other skill hubs this does not ask for a
 * topic first — grammar rules are cross-topic, so it goes straight to games.
 */
export function GrammarHubPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { getMastery } = useRuleMastery();
  const [mastery, setMastery] = useState<MasteryMap>({});

  useEffect(() => {
    getMastery().then(setMastery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
        <button
          className="icon-btn"
          onClick={() => navigate('/')}
          aria-label={t('grammar.backButton')}
          style={{ fontSize: '1.3rem' }}
        >
          ←
        </button>
        <span
          aria-hidden="true"
          style={{
            width: 54, height: 54, flexShrink: 0, borderRadius: 16,
            display: 'grid', placeItems: 'center', fontSize: '1.8rem',
            background: 'var(--muted)',
          }}
        >
          🪄
        </span>
        <div style={{ lineHeight: 1.15 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
            {t('grammar.sectionTitle')}
          </h1>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--muted-fg)' }}>
            {t('grammar.sectionHint')}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
        {GRAMMAR_GAMES.map((game) => {
          const stars = gameStars(game, mastery);
          return (
            <button
              key={game.id}
              className="card lift"
              onClick={() => {
                speak(t(`grammar.${game.id}`));
                navigate(`/grammar/${game.id}`);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                textAlign: 'left', padding: 18, borderRadius: 24,
              }}
              aria-label={`${t(`grammar.${game.id}`)}, ${stars} of 4 stars`}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 60, height: 60, flexShrink: 0, borderRadius: 18,
                  display: 'grid', placeItems: 'center', fontSize: '1.9rem',
                  background: 'var(--muted)',
                }}
              >
                {GAME_EMOJI[game.id]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 900, color: 'var(--ink)' }}>
                  {t(`grammar.${game.id}`)}
                </span>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--muted-fg)' }}>
                  {GAME_BLURB[game.id]}
                </span>
              </span>
              <span aria-hidden="true" style={{ fontSize: '1rem', letterSpacing: '1.5px', flexShrink: 0 }}>
                <span style={{ color: 'var(--star)' }}>{'★'.repeat(stars)}</span>
                <span style={{ color: 'var(--border)' }}>{'☆'.repeat(4 - stars)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="section-title" style={{ margin: '26px 4px 13px' }}>
        {t('grammar.howsItGoing')}
      </h2>
      <RuleChips mastery={mastery} />
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:int -- grammar-hub`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/english/grammar/components/RuleChips.tsx src/english/grammar/components/GrammarHubPage.tsx tests/integration/grammar-hub.test.tsx
git commit -m "feat(grammar): add grammar hub with games list and parent rule view"
```

---

### Task 14: Wire the track into the app

Routes, the home tile, and the `TopicSkillId` type split.

**Design note (deviation from spec):** the spec put a branch in `SkillHubPage` for unscoped skills. A dedicated `/grammar` route is simpler and touches less — `SkillHubPage` needs no change at all.

**Files:**
- Modify: `src/english/vocab/data/skills.ts` (type split + grammar skill entry)
- Modify: `src/english/vocab/components/EnglishHome.tsx` (grammar tile + routing)
- Modify: `src/pages/HomePage.tsx` (load grammar progress)
- Modify: `src/App.tsx` (two new routes)
- Test: `tests/integration/grammar-navigation.test.tsx`

**Interfaces:**
- Consumes: `GrammarHubPage`, `grammarProgress` (Task 13), `GrammarDrillPage` (Task 12), `useRuleMastery` (Task 9).
- Produces: `TopicSkillId`, updated `SkillId`, `/grammar` and `/grammar/:gameId` routes.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/grammar-navigation.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { EnglishHome } from '@/english/vocab/components/EnglishHome';
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { SKILLS, SKILL_ACTIVITIES } from '@/english/vocab/data/skills';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));

describe('grammar track wiring', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('registers grammar as a fourth skill', () => {
    expect(SKILLS.map((s) => s.id)).toEqual(['listening', 'reading', 'vocab', 'grammar']);
  });

  it('gives grammar three activities', () => {
    expect(SKILL_ACTIVITIES.grammar).toHaveLength(3);
  });

  it('routes the grammar tile to /grammar, not /skill/grammar', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<EnglishHome progressBySet={{}} grammarPct={0} />} />
          <Route path="/grammar" element={<GrammarHubPage />} />
          <Route path="/skill/:skillId" element={<div>topic picker</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Grammar/i }));
    expect(await screen.findByText('One or Many')).toBeInTheDocument();
    expect(screen.queryByText('topic picker')).not.toBeInTheDocument();
  });

  it('shows the grammar tile with its progress percentage', () => {
    render(
      <MemoryRouter>
        <EnglishHome progressBySet={{}} grammarPct={27} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /Grammar, 27% complete/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:int -- grammar-navigation`
Expected: FAIL — `SKILLS` has 3 entries; `EnglishHome` has no `grammarPct` prop.

- [ ] **Step 3: Update skills.ts**

In `src/english/vocab/data/skills.ts`:

Replace the `SkillId` type declaration (line 5):

```ts
/** Skills that are practised one topic at a time. */
export type TopicSkillId = 'listening' | 'reading' | 'vocab';

/**
 * Every skill on the English home. `grammar` is deliberately not a
 * `TopicSkillId`: grammar rules are cross-topic, so "how is grammar going in
 * the Animals topic?" is a question with no answer, and the compiler should
 * reject it rather than a function returning a meaningless 0.
 */
export type SkillId = TopicSkillId | 'grammar';
```

Append to the `SKILLS` array, after the `vocab` entry:

```ts
  {
    id: 'grammar',
    title: 'Grammar',
    emoji: '🪄',
    blurb: 'Fix the word endings',
    accent: 'var(--sk-grammar, var(--primary))',
    soft: 'var(--sk-grammar-soft, var(--muted))',
  },
```

Add a `grammar` key to `SKILL_ACTIVITIES`, after the `vocab` array:

```ts
  grammar: [
    { id: 'plurals', i18nKey: 'grammar.plurals', emoji: '🍎', desc: 'One apple or three?', launch: { kind: 'route', route: '/grammar/plurals' }, scoped: false },
    { id: 'verbs', i18nKey: 'grammar.verbs', emoji: '👩‍🏫', desc: 'Pick the right ending', launch: { kind: 'route', route: '/grammar/verbs' }, scoped: false },
    { id: 'bd', i18nKey: 'grammar.bd', emoji: '🐶', desc: 'Which letter is it?', launch: { kind: 'route', route: '/grammar/bd' }, scoped: false },
  ],
```

Change the two topic-progress function signatures to accept only `TopicSkillId`:

```ts
export function skillTopicProgress(
  skillId: TopicSkillId,
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
): number {
```

```ts
export function skillAggregateProgress(
  skillId: TopicSkillId,
  wordSets: WordSet[],
  progressBySet: Record<string, Record<string, WordProgressRow>>,
): number {
```

- [ ] **Step 4: Run typecheck to find every call site the split breaks**

Run: `npm run typecheck`
Expected: errors in `EnglishHome.tsx` and `SkillHubPage.tsx` where a `SkillId` is passed to a `TopicSkillId` parameter. This is the type split doing its job — fix them in the next steps.

- [ ] **Step 5: Update EnglishHome**

In `src/english/vocab/components/EnglishHome.tsx`:

Add to the imports:

```ts
import type { TopicSkillId } from '@/english/vocab/data/skills';
```

Extend the props interface:

```ts
interface EnglishHomeProps {
  /** wordSetId → (wordId → progress row) for the active child. */
  progressBySet: Record<string, Record<string, WordProgressRow>>;
  /** Grammar track completion (0–100). Grammar is not topic-scoped. */
  grammarPct: number;
}
```

Change the signature:

```ts
export function EnglishHome({ progressBySet, grammarPct }: EnglishHomeProps) {
```

In `resumePoint`, restrict the skill search to topic-scoped skills:

```ts
  const skill =
    SKILLS.find(
      (s) => s.id !== 'grammar' && skillTopicProgress(s.id as TopicSkillId, wordSet, map) < 1,
    ) ?? SKILLS[0];
```

Inside the `SKILLS.map` callback, replace the `pct` line and the `onClick` handler:

```ts
          const pct =
            s.id === 'grammar'
              ? grammarPct
              : Math.round(
                  skillAggregateProgress(s.id as TopicSkillId, wordSetRegistry, progressBySet) * 100,
                );
```

```ts
              onClick={() => {
                speak(s.title);
                // Grammar is cross-topic, so it skips the topic picker.
                navigate(s.id === 'grammar' ? '/grammar' : `/skill/${s.id}`);
              }}
```

- [ ] **Step 6: Update SkillHubPage**

In `src/pages/SkillHubPage.tsx`, the `skillTopicProgress(skill.id, ...)` call now needs a `TopicSkillId`. Guard against the grammar id reaching this page at all — add just after the existing `if (!skill)` guard:

```ts
  // Grammar has its own hub at /grammar; it is never topic-scoped.
  if (skill.id === 'grammar') {
    return <Navigate to="/grammar" replace />;
  }
```

Add `Navigate` to the react-router-dom import:

```ts
import { useParams, useNavigate, Navigate } from 'react-router-dom';
```

Then change the progress call to:

```ts
          const p = skillTopicProgress(skill.id as TopicSkillId, ws, progressBySet[ws.id] ?? {});
```

Add `type TopicSkillId` to the existing `skills` import.

- [ ] **Step 7: Update HomePage**

In `src/pages/HomePage.tsx`:

Add imports:

```ts
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';
import { grammarProgress } from '@/english/grammar/components/GrammarHubPage';
```

Add state next to the other `useState` calls:

```ts
  const [grammarPct, setGrammarPct] = useState(0);
```

Add the hook next to `useWordProgress()`:

```ts
  const { getMastery } = useRuleMastery();
```

Inside the existing `useEffect` that runs when `profilePicked` flips, add:

```ts
    getMastery().then((m) => setGrammarPct(Math.round(grammarProgress(m) * 100)));
```

And pass the prop through:

```tsx
      {isMath ? <MathHub economy={economy} /> : <EnglishHome progressBySet={progressBySet} grammarPct={grammarPct} />}
```

- [ ] **Step 8: Add the routes**

In `src/App.tsx`, add imports:

```ts
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';
```

And two routes inside `<Routes>`, after the `/rw/picture-qa` route:

```tsx
          <Route path="/grammar" element={<GrammarHubPage />} />
          <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
```

- [ ] **Step 9: Run the full suite**

Run: `npm run test && npm run typecheck && npm run lint`
Expected: all pass, including the new `grammar-navigation` tests and every pre-existing suite.

- [ ] **Step 10: Commit**

```bash
git add src/english/vocab/data/skills.ts src/english/vocab/components/EnglishHome.tsx src/pages/SkillHubPage.tsx src/pages/HomePage.tsx src/App.tsx tests/integration/grammar-navigation.test.tsx
git commit -m "feat(grammar): wire grammar track into home, routes and skill types"
```

---

### Task 15: Accessibility tests

**Files:**
- Create: `tests/a11y/grammar-screens.test.tsx`

**Interfaces:**
- Consumes: `GrammarHubPage` (Task 13), `GrammarDrillPage` (Task 12).
- Produces: nothing.

- [ ] **Step 1: Check the existing a11y test style**

Run: `head -40 tests/a11y/screens.a11y.test.tsx`
Match its imports, axe setup, and matcher usage exactly — do not invent a different pattern.

- [ ] **Step 2: Write the test**

Create `tests/a11y/grammar-screens.test.tsx`, adapting the imports to match what Step 1 showed:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));
vi.mock('@/shared/utils/sfx', () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playBuzz: vi.fn(),
}));

describe('grammar screens accessibility', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('grammar hub has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <GrammarHubPage />
      </MemoryRouter>,
    );
    await screen.findByText('One or Many');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('plurals drill has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/grammar/plurals']}>
        <Routes>
          <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findAllByTestId('drill-option');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('bed anchor card has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/grammar/bd']}>
        <Routes>
          <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText(/make a bed/i);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test:a11y -- grammar-screens`
Expected: PASS, 3 tests.

If a violation appears, fix the **component**, not the test. The most likely offenders: repeated `<img>` elements in a plural item needing `alt=""` plus `aria-hidden` on all but the first (already handled in Task 12), and colour contrast on the rule chips.

- [ ] **Step 4: Commit**

```bash
git add tests/a11y/grammar-screens.test.tsx
git commit -m "test(grammar): add axe coverage for grammar hub and drill screens"
```

---

### Task 16: Adaptive behaviour end-to-end

The one test that proves the whole feature does what it was built for: seeded wrong answers on a rule make that rule show up more often.

**Files:**
- Create: `tests/integration/grammar-adaptive.test.ts`

**Interfaces:**
- Consumes: `selectRules` (Task 7), `applyAttempt`/`EMPTY_MASTERY` (Task 6), `makeRng` (Task 2), `PLURALS_GAME` (Task 10).
- Produces: nothing.

- [ ] **Step 1: Write the test**

Create `tests/integration/grammar-adaptive.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { selectRules } from '@/english/grammar/services/rule-scheduler';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import { PLURALS_GAME } from '@/english/grammar/services/games';

/** Play `rounds` questions, answering `wrongRule` wrongly and the rest right. */
function simulate(rounds: number, wrongRule: string, seed: number): MasteryMap {
  let mastery: MasteryMap = {};
  let rng = makeRng(seed);
  for (let session = 0; session < rounds; session++) {
    const rules = selectRules(PLURALS_GAME.rules, mastery, 10, rng);
    const next: MasteryMap = { ...mastery };
    for (const rule of rules) {
      const wasCorrect = rule !== wrongRule;
      next[rule] = applyAttempt(next[rule] ?? EMPTY_MASTERY, wasCorrect);
    }
    mastery = next;
    rng = makeRng(seed + session + 1);
  }
  return mastery;
}

describe('adaptive drilling', () => {
  it('drills a rule the child keeps getting wrong more than the others', () => {
    const mastery = simulate(8, 'plural.es', 100);

    const rules = selectRules(PLURALS_GAME.rules, mastery, 300, makeRng(999));
    const esCount = rules.filter((r) => r === 'plural.es').length;
    const evenShare = 300 / PLURALS_GAME.rules.length;

    expect(esCount).toBeGreaterThan(evenShare);
  });

  it('turns consistently-correct rules gold', () => {
    const mastery = simulate(10, 'plural.es', 100);
    const golds = Object.entries(mastery).filter(([, m]) => m?.gold);
    expect(golds.length).toBeGreaterThan(0);
    expect(mastery['plural.es']?.gold).toBe(false);
  });

  it('keeps mastered rules in rotation rather than dropping them', () => {
    const mastery = simulate(10, 'plural.es', 100);
    const rules = selectRules(PLURALS_GAME.rules, mastery, 300, makeRng(7));
    for (const ruleId of PLURALS_GAME.rules) {
      expect(rules, `${ruleId} vanished from rotation`).toContain(ruleId);
    }
  });

  it('builds a real item for every rule the scheduler picks', () => {
    const mastery = simulate(5, 'plural.ies', 55);
    const rng = makeRng(31);
    const rules = selectRules(PLURALS_GAME.rules, mastery, 40, rng);
    for (const rule of rules) {
      expect(PLURALS_GAME.buildItem(rule, rng), `no item for ${rule}`).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm run test:int -- grammar-adaptive`
Expected: PASS, 4 tests.

- [ ] **Step 3: Full verification**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: everything green, production build succeeds.

- [ ] **Step 4: Manual check in the browser**

Start the dev server via the preview tooling (the `vite-dev-alt` config on port 5181), then:
1. Pick a child profile.
2. Confirm a fourth **🪄 Grammar** tile appears on the English home.
3. Tap it — it should go straight to three game tiles, *not* a topic picker.
4. Play **One or Many**: confirm three apples render for a plural answer and one for a singular.
5. Play **b or d**: confirm the bed card appears first, and the 💡 button brings it back.
6. Return to the hub and confirm the rule chips have updated.
7. Reload the page and confirm progress survived.

- [ ] **Step 5: Commit**

```bash
git add tests/integration/grammar-adaptive.test.ts
git commit -m "test(grammar): prove weak rules get drilled harder end to end"
```

---

## Self-review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Rule catalog (11 rules) | 1 |
| Plural form table | 3 |
| Verb form table | 4 |
| b/d derivation | 5 |
| Data integrity test | 5 |
| `DrillItem` / `GrammarGame` | 10 |
| Drill engine, 10 rounds, first-attempt-only | 12 |
| Adaptive scheduler + weights | 7 |
| Sticky gold | 6 |
| Dexie v5 storage | 8, 9 |
| `TopicSkillId` split | 14 |
| Parent rule view | 13 |
| Failure handling (null item, disabled tile) | 10, 12 |
| Unit / integration / a11y tests | throughout, 15, 16 |
| Three games, hub, routes | 10, 13, 14 |

**Deviations from the spec, all deliberate and flagged in-place:**

1. `RuleMasteryRow` uses `childId`, not `profileId` — matches every existing table.
2. Plural table stores ~50 exceptions with a `+s` default, not ~225 entries, guarded by a regex integrity test.
3. Verb sentences use "the teacher / the teachers" rather than "She / They" — no gender data needed, and it reinforces plurals.
4. Grammar gets its own `/grammar` route instead of a branch inside `SkillHubPage`.

**Known gap carried over from the spec:** `plural.ies` is thin. Task 3 pre-seeds extra `-y` entries and Task 5's integrity test will fail loudly if the bucket drops below 4, forcing the issue rather than silently degrading.
