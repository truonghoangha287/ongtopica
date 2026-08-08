# Furniture Topic — Design

**Date**: 2026-08-08
**Status**: Approved design, ready for implementation planning
**Scope**: A fifteenth vocabulary topic, `furniture`, covering room furnishings not already taught by the `home` topic.

## Problem

The vocabulary track has fourteen topics. Furnishings are under-taught: `home` mixes rooms, house parts, and a handful of furniture items into one 22-word set, and stops there. A child who finishes `home` knows `bed`, `chair`, `table`, `sofa`, `desk`, `cupboard`, and `lamp` — but not `wardrobe`, `shelf`, `carpet`, `curtain`, or `fridge`, all of which appear in the YLE Movers and Flyers syllabi.

### The overlap constraint

`home` already contains seven furniture words: `bed`, `chair`, `cupboard`, `desk`, `lamp`, `sofa`, `table`.

A `furniture` topic must not restate them. The same word taught under two ids would be tracked twice in `word_progress`, counted twice towards achievements, and could pair with itself in Memory Match. So `furniture` is defined as *furnishings `home` does not already cover* — it complements `home` rather than replacing or duplicating it.

### The artwork constraint

Word pictures are generated, not hand-drawn (`scripts/lib/emoji-map.ts` is the source of truth). Most words render a mapped Noto emoji onto the set's pastel background.

Noto has **no emoji for the core furniture vocabulary**: `wardrobe`, `shelf`, `bookcase`, `drawer`, `carpet`, `curtain`, `cushion`, `blanket`, `fridge`, `stool` all have nothing usable. Only decorative and adjacent items do (`picture` 🖼️, `plant` 🪴, `basket` 🧺, `candle` 🕯️, `vase` 🏺).

This forces a choice between an authentic furniture topic that needs new artwork, and an emoji-only topic that is really "Things at Home". This design takes the first.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Relationship to `home` | Non-overlapping; `home` untouched | No duplicate word rows, no migration of existing progress data |
| Word list | 15 words | Mid-range for the app (existing topics run 10–42) |
| Artwork | 10 hand-authored flat-vector SVGs + 5 Noto emoji | Keeps the topic genuinely about furniture; furniture is rectangles, far simpler to draw than the existing people SVGs |
| Level mix | Starters + Movers + Flyers | Matches `home`, which already carries Movers/Flyers words (`clock`, `mirror`, `key`, `box`, `radio`) |
| Set background | Warm tan `rgb(240, 220, 190)` | Reads as wood; distinct from `home`'s cream `rgb(255, 235, 200)` |
| Topic icon | 🛋️ | Unambiguously furniture; `home` holds 🏠 |

### Rejected alternatives

- **Split `home`** — move its seven furniture words into `furniture`, leaving `home` as rooms and house parts. Two cleaner topics, but every moved word changes `wordSetId`, orphaning existing `word_progress` rows and requiring a data migration for no learning gain.
- **Allow duplicates** — let `furniture` restate `bed`, `chair`, `table`, `sofa`. Both topics read naturally, but the same word is tracked twice under two ids.
- **Emoji-only word list** — `picture`, `TV`, `computer`, `cabinet`, `plant`, `basket`, `candle`, `bin`, `broom`, `ladder`, `shower`, `plug`, `vase`, `fan`. Zero artwork, but the result is a household-objects grab bag, not a furniture topic.
- **Hybrid with ~5 custom SVGs** — half the drawing effort, but drops `bookcase`, `drawer`, `blanket`, `fridge`, and `stool`, which are the words that make the topic worth adding.
- **Including `pillow`** — a YLE Movers word, but visually near-identical to `cushion` at 400×400 for a five-year-old. Excluded deliberately.
- **Including `TV`/`television`** — `TV` is two letters, which breaks Fill-in-the-Blank and Unscramble; `television` is ten, too long for the level.

## Word list

Fifteen words, none of which appear in any existing topic.

| Word | Image | YLE level |
|---|---|---|
| wardrobe | custom SVG | Movers |
| shelf | custom SVG | Flyers |
| bookcase | custom SVG | Starters |
| drawer | custom SVG | Movers |
| carpet | custom SVG | Flyers |
| curtain | custom SVG | Movers |
| cushion | custom SVG | Flyers |
| blanket | custom SVG | Movers |
| fridge | custom SVG | Movers |
| stool | custom SVG | not a YLE headword |
| picture | 🖼️ Noto | Starters |
| plant | 🪴 Noto | Movers |
| basket | 🧺 Noto | not a YLE headword |
| candle | 🕯️ Noto | Flyers |
| vase | 🏺 Noto | not a YLE headword |

`stool`, `basket`, and `vase` are outside the YLE lists. They are kept because each has a distinct, easily drawn silhouette and is common in a child's own home.

## Artwork specification

Ten new illustrations, added as functions in `scripts/generate-custom-images.ts` and marked `AI_FALLBACK` in `EMOJI_MAP`.

Style must match the existing custom SVGs and the Noto renders: 400×400 viewBox, full-bleed set background, flat fills, heavy rounded outline (`stroke-width` ~7–9), no gradients, no text.

Three pairs are at risk of being confused. Each is drawn to disambiguate:

| Pair | How they are told apart |
|---|---|
| carpet vs. blanket | Carpet lies flat on visible floorboards with a woven border pattern; blanket is folded and draped over the corner of a bed |
| wardrobe vs. bookcase vs. shelf | Wardrobe is closed with two doors and handles; bookcase is an open frame filled with coloured book spines; shelf is a single wall-mounted plank holding two or three small objects |
| cushion vs. blanket | Cushion is a square with corner tassels shown on a sofa seat; blanket is rectangular and draped |

The five emoji-backed words render through the existing path with no new code.

## Implementation

Six files change. Everything downstream derives from the registry, so no UI file needs editing.

| File | Change |
|---|---|
| `src/data/yle-starters/furniture.json` | New. 15 `Word` entries: `id` `furniture.<word>`, `text`, `pictureAsset`, `audioAsset`, `wordSetId: "furniture"`, `blankLetterIndex`, `letterChoices` |
| `src/data/yle-starters/index.ts` | Import `furnitureData`; add registry entry `{ id: 'furniture', displayName: 'Furniture', words: … }` after `food` |
| `src/data/yle-starters/icons.ts` | `furniture: '🛋️'` |
| `src/locales/en/vocab.json` | `wordSets.furniture: "Furniture"` |
| `scripts/lib/emoji-map.ts` | 15 `EMOJI_MAP` entries (5 emoji, 10 `AI_FALLBACK`); 15 `WORD_SET` entries mapping to `furniture`; one `SET_BACKGROUNDS` entry |
| `scripts/generate-custom-images.ts` | 10 SVG builder functions plus their output entries |

`letterChoices` places the correct letter first by authoring convention; `FillInBlankActivity` shuffles them at render time via `seededShuffle`, so the order in the JSON has no effect on gameplay.

### Consumers that need no change

`SkillHubPage`, `EnglishHome`, `TopicActivitiesPage`, `AchievementsPage`, `MemoryMatchPage`, `SettingsPage`, `YesNoPage`, and `useAchievements` all read `wordSetRegistry` or call `getWordSet`. No test fixture asserts a topic count.

## Asset generation

```bash
pnpm tsx scripts/generate-vocab-images.ts --set=furniture
pnpm tsx scripts/generate-custom-images.ts
pnpm tsx scripts/generate-vocab-audio.ts
```

The first renders the 5 emoji words. The second renders the 10 custom SVGs; it does not need `FAL_KEY`. The third produces `public/assets/audio/<word>.mp3` via local macOS `say -v Samantha` piped through ffmpeg, and skips words that already have audio unless `--force` is passed.

Committed output: 15 `.webp` files in `public/assets/images/` and 15 `.mp3` files in `public/assets/audio/`.

## Verification

A unit test over the registry:

- `furniture` is registered and has exactly 15 words.
- Every entry has `wordSetId: "furniture"` and an `id` of the form `furniture.<text>`.
- `blankLetterIndex` is within `text` bounds, and `letterChoices` contains the letter at that index.
- **No `text` value collides with any word in any other topic.** This is the test that protects the core decision; it runs across the whole registry, so it also guards future topics.
- `pictureAsset` and `audioAsset` files exist on disk.

Then run the app: confirm the Furniture tile appears on the topic list with 🛋️, play one session through to the celebration screen, and screenshot the custom art to check the carpet/blanket and wardrobe/bookcase/shelf pairs read correctly at render size.

## Out of scope

- Any change to the `home` topic.
- Vietnamese or other translations — `src/locales/` currently holds `en` only.
- Reading & Writing item data (`cloze-items.ts`, `picture-qa-items.ts`, `preposition-items.ts`), which are hand-authored per activity and not derived from topics.
