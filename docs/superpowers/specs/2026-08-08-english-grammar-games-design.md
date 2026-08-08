# English Grammar Games — Design

**Date**: 2026-08-08
**Status**: Approved design, ready for implementation planning
**Scope**: A fourth English skill track covering noun plurals, third-person verb forms, and b/d letter discrimination.

## Problem

A fluent 9-year-old reader is making three recurring errors:

1. **Noun plurals** — `apple`/`apples`, and the ending rules behind them (`+s`, `+es`, `y→ies`, irregulars).
2. **Third-person verb agreement** — `teach`/`teaches`.
3. **b/d letter reversal** — persistent past the age it usually resolves.

The existing app has no grammar content. All 240 word rows across 15 topic sets are nouns, and the four standalone Reading & Writing games persist nothing, so nothing in the app can tell which rules the child has actually learned.

### Note on b/d

b/d reversal is developmentally normal to roughly age 7–8. Persisting at 9 alongside fluent reading is common but is sometimes an early dyslexia marker. This feature is a practice tool, not an assessment — a school screening is the appropriate parallel step. The design deliberately makes b/d errors unambiguous (see "b or d" below) so the parent-facing view reports a clean signal.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Placement | New fourth skill track, `grammar` | Reading & Writing already holds 5 activities; grammar deserves a visible concept of its own |
| Content source | Reuse existing assets; add form-annotation tables | No new images, audio, or word sets. Two hand-authored tables annotate the existing 240 words |
| Game structure | One engine, three skins | The adaptive drill logic is the valuable and bug-prone part; write and test it once |
| Mastery model | Per-rule tracking with adaptive weighting | The child has *specific* weak rules; even sampling would waste rounds on rules already mastered |
| b/d mechanics | Real-word picture choice + "bed" anchor taught first | Uses existing assets; fixes the cause rather than drilling the symptom |

### Rejected alternatives

- **Three fully separate games** (drag-to-bin sorter, etc.) — more variety, but duplicates adaptive logic three times for roughly double the code. A future game that genuinely needs a different mechanic can still be added as its own page.
- **One mixed "Grammar Gym"** — strongest drilling since weak rules can't be dodged, but least game-like at this age. The tracking design makes it cheap to add later as a fourth tile on top of this work.
- **Adding an `actions` word set with generated images** — best verb coverage, but violates the reuse-existing-assets constraint.
- **No persistence** (matching current `/rw/*` games) — smallest build, but cannot target the child's actual weak spots, which is the entire point of the feature.
- **Folding grammar into the 4-star per-word model** — `watch→watches` is a fact about a *rule*, not about a word, and irregulars would distort per-word progress.

## What the child sees

### The track

A fourth tile on the English home:

> **🪄 Grammar** — *"Fix the word endings"*

The other three tracks require choosing a topic before showing activities. Grammar is cross-topic, so it skips that step. This is a branch in `SkillHubPage.tsx` — when a skill's activities are all unscoped, render the activity grid instead of the topic grid — not a new page.

### 🍎 One or Many (`/grammar/plurals`)

The picture renders once, or three times in a row. Two or three written options below; tap the correct one.

```
   🍎                🍎 🍎 🍎            🦶 🦶
[apple][apples]    [apple][apples]    [foots][feet]
```

Uncountables and always-plurals get their own round shape, because that is where the real mistakes live: `some milk` / `two milks`, or `a jeans` / `some jeans`.

Rendering "three apples" requires **no new artwork** — the existing `.webp` is repeated.

### 👩‍🏫 Who Does What? (`/grammar/verbs`)

A person from the `work` set, plus a gapped sentence:

```
        👩‍🏫                      👩‍🏫👨‍🏫
   She ___ English.          They ___ English.
   [teach]  [teaches]        [teach]  [teaches]
```

Alternating the subject between *she/he* and *they/I* is essential. Drilling only the third person teaches "always add -es", which is a different wrong answer.

### 🐶 b or d (`/grammar/bd`)

First visit opens the **bed anchor** card: make a bed with two hands — left fist is `b`, right fist is `d`, and the word *bed* shows both shapes. Afterwards it is a 💡 button in the corner of every round.

```
        🐶
   [dog]   [bog]
```

The distractor is always the same word with a single b/d flip, so a wrong tap is unambiguously a b/d error and nothing else.

### Progress

Each game tile shows stars meaning **rules mastered**, not words learned. The track hub carries a parent-facing row of 12 rule chips — `+s ✅  +es ⚠️  y→ies ☆  irregular ⚠️ …` — tappable for attempts and accuracy. This is how the parent knows whether the app is working, so it ships with the feature rather than later.

## Data

### Rule catalog — `src/english/grammar/data/rules.ts`

12 ids, the unit of mastery everywhere:

```
plural.s   plural.es   plural.ies   plural.irregular   plural.same
plural.uncountable   plural.tantum
verb.base   verb.s   verb.es   verb.ies
letter.bd
```

`verb.base` is the counter-rule (*they teach*, not *they teaches*). Without it the game only trains "add -es".

### Coverage in existing data

| Rule | Count | Examples |
|---|---|---|
| `plural.s` | ~175 | apple, bag, ball, bear, bed, bike, bird |
| `plural.es` | ~10 | beach, box, bus, dress, sandwich, watch, potato, tomato, mango |
| `plural.ies` | 5 | baby, body, family, lorry, teddy |
| `plural.irregular` / `plural.same` | 7 | man→men, woman→women, foot→feet, tooth→teeth, mouse→mice, sheep, fish |
| `plural.tantum` | 9 | boots, chips, glasses, jeans, scissors, shoes, shorts, socks, trousers |
| `plural.uncountable` | 20 | bread, cheese, milk, rice, water, snow, rain, sugar |
| excluded | 14 | colours (adjectives), swimming/running/boxing (gerunds) |

**Why the table is hand-authored, not derived:** `potato→potatoes` but `hippo→hippos`, `piano→pianos`, `radio→radios` — same `-o` ending, different rule. A naive regex also miscategorises `tennis` as `+es`.

**Known thin spot:** `plural.ies` has only 5 source words, so a child drilling that rule will see `baby/babies` repeatedly. Mitigated by the verb game contributing its own `-ies` items (`flies`, `cries`, `studies`) and by each noun yielding more than one question shape. Accepted as a limitation of the reuse-existing constraint.

### `data/plural-forms.ts`

~225 entries keyed by **wordId**, not text, so `colors.orange` and `food.orange` stay distinct:

```ts
{ wordId: 'food.potato', plural: 'potatoes', rule: 'plural.es' }
{ wordId: 'body.foot',   plural: 'feet',     rule: 'plural.irregular' }
{ wordId: 'food.water',  plural: null,       rule: 'plural.uncountable' }
```

A word with no entry never appears in the game, so adjectives and gerunds are excluded by omission — no separate exclusion list.

### `data/verb-forms.ts`

~30 entries hanging a verb off an existing picture:

```ts
{ subjectWordId: 'work.teacher', base: 'teach', third: 'teaches',
  object: 'English', rule: 'verb.es' }
{ subjectWordId: 'work.pilot',   base: 'fly',   third: 'flies',
  object: 'a plane', rule: 'verb.ies' }
{ subjectWordId: 'animals.dog',  base: 'bark',  third: 'barks',
  object: '',        rule: 'verb.s' }
```

Drawn from `work` (~10), `animals` (~12), `family` (~8). Every entry generates **both** a third-person item (*She ___*) and a base-form item (*They ___*), so 30 rows cover all four verb rules.

### b/d words — derived, not authored

Any existing word containing `b` or `d` produces its own distractor by flipping that letter: `dog→bog`, `bear→dear`, `bed→ded`. ~90 candidates, plus a short exclusion array for any that read badly. No ongoing data maintenance.

### Data integrity

One unit test guards all tables: every `wordId` resolves to a real word, every `rule` is in the catalog, every rule has at least 4 usable items, and no `plural` string is empty unless the rule is `plural.uncountable`. A typo fails CI rather than rendering a blank button.

## Engine

```ts
interface DrillItem {
  rule: RuleId;
  picture: { asset: string; repeat: number };  // repeat: 3 renders three apples
  sentence?: string;                            // "She ___ English."
  options: string[];                            // 2–3 tappable strings
  answer: string;
  hint?: 'bed-anchor';
}

interface GrammarGame {
  id: 'plurals' | 'verbs' | 'bd';
  rules: RuleId[];
  buildItem(rule: RuleId, rng: Rng): DrillItem | null;
}
```

`GrammarDrillPage` takes a `GrammarGame`, runs 10 rounds, and knows nothing about plurals or letters. Round flow reuses existing primitives unchanged — `useAnswerFeedback`, `Mascot`, `CelebrationEffect`, `playWin`, `speak` — so it behaves identically to `YesNoPage`: a wrong answer shakes and allows retry, a correct answer advances.

**Only the first attempt on each item is recorded.** Retry-until-right is good for morale but useless as a signal; counting the third guess would make every rule look mastered.

### Adaptive selection — `rule-scheduler.ts`

Pure function: `selectRules(gameRules, mastery, 10) → RuleId[]`.

| Rule state | Weight |
|---|---|
| Never seen | 3 |
| Weak (accuracy < 70%) | 5 |
| Learning | 2 |
| Gold | 1 |

Weighted sample, followed by a pass that breaks up any run of three identical rules. Gold rules keep weight 1 rather than 0, so mastered rules resurface occasionally and do not decay.

### Gold is sticky

A rule goes gold at 6 consecutive first-attempt correct answers, with a minimum of 8 attempts and ≥80% lifetime accuracy. It never un-golds — removing an earned star is demoralising, and the star display is not where accuracy needs to be strict. The **scheduler** continues to use live accuracy, so a slipping rule quietly gets more questions while the star stays put.

## Storage

New Dexie table at `version(5)` (current schema is at v4). Additive only; no existing table is touched.

```ts
interface RuleMasteryRow {
  id: string;          // `${profileId}:${ruleId}`
  profileId: string;
  ruleId: RuleId;
  attempts: number;    // first attempts only
  correct: number;
  streak: number;
  gold: boolean;
  lastSeenAt: number;
}
```

## Type change

`skillTopicProgress()` in `src/english/vocab/data/skills.ts` switches exhaustively on `SkillId`. Grammar is not topic-scoped, so adding it there would require a case returning a meaningless `0`. Split the type instead:

```ts
type TopicSkillId = 'listening' | 'reading' | 'vocab';
type SkillId = TopicSkillId | 'grammar';
```

`skillTopicProgress` accepts `TopicSkillId`; grammar gets `grammarProgress(mastery)` = golds ÷ 12. The compiler then prevents asking "how is grammar going in the Animals topic?" — a question with no answer.

## Failure handling

- Malformed data fails **CI** via the integrity test, never reaching the child's screen.
- `buildItem` returning `null` at runtime → the scheduler falls through to the next rule.
- A game that can build no items renders a **disabled tile**, never a crash or a blank round.
- No active profile → same guard as existing pages.

## Testing

**Unit**
- Scheduler: weak rules oversampled, gold rules still appear, no three-in-a-row.
- `buildItem` for each game across every rule it claims to support.
- b/d distractor is exactly a one-letter flip.
- Mastery updater: first-attempt-only recording, sticky gold, accuracy maths.
- Data integrity across all three tables.

**Integration**
- 10 rounds writes the expected mastery rows.
- Seeded wrong answers on `plural.es` make that rule measurably more frequent in the next session.
- v4→v5 migration preserves all existing word progress and math data.

**Accessibility**
- axe on the Grammar hub and the drill page, matching the existing a11y suite.

## Proposed file layout

```text
src/english/grammar/
├── data/
│   ├── rules.ts              # 12-rule catalog
│   ├── plural-forms.ts       # ~225 annotations
│   ├── verb-forms.ts         # ~30 verb entries
│   └── bd-words.ts           # derivation + exclusions
├── services/
│   ├── rule-scheduler.ts     # adaptive weighting (pure)
│   ├── mastery.ts            # first-attempt recording, gold logic (pure)
│   └── games/
│       ├── plurals.ts        # buildItem
│       ├── verbs.ts          # buildItem
│       └── bd.ts             # buildItem
├── hooks/
│   └── useRuleMastery.ts     # Dexie read/write
└── components/
    ├── GrammarHubPage.tsx    # 3 tiles + parent rule chips
    ├── GrammarDrillPage.tsx  # shared 10-round engine
    ├── BedAnchorCard.tsx     # b/d mnemonic
    └── RuleChips.tsx         # parent-facing rule state

Touched existing files:
  src/shared/db/db.ts             # version(5)
  src/shared/db/schema.ts         # + RuleMasteryRow
  src/english/vocab/data/skills.ts # + grammar skill, TopicSkillId split
  src/pages/SkillHubPage.tsx      # unscoped-skill branch
  src/App.tsx                     # + /grammar routes
```

## Out of scope

- Past tense, comparatives, articles (`a`/`an`) — the rule catalog and engine are designed to absorb these as data later.
- A mixed "Grammar Gym" session across all rules — cheap to add on top of this engine once individual rules go gold.
- Letter-tracing / handwriting for b/d — needs a canvas component; considered and deferred.
- Any new image, audio, or vocabulary asset.
