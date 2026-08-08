# Furniture Topic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifteenth vocabulary topic, `furniture`, with 15 words, generated images and audio, wired into the existing word-set registry.

**Architecture:** A topic in this app is pure data. A JSON word file plus four registry/config entries makes it appear everywhere — every consumer (`SkillHubPage`, `EnglishHome`, `TopicActivitiesPage`, `AchievementsPage`, `MemoryMatchPage`, `SettingsPage`, `YesNoPage`, `useAchievements`) reads `wordSetRegistry` or calls `getWordSet`, so no UI file is touched. Images and audio are produced by existing generator scripts: 5 words map to Noto emoji, 10 need new hand-authored flat-vector SVGs because no suitable emoji exists.

**Tech Stack:** TypeScript, React, Vite, Vitest, `tsx` for scripts, `sharp` for image conversion, macOS `say` + `ffmpeg` for audio.

**Spec:** `docs/superpowers/specs/2026-08-08-furniture-topic-design.md`

## Global Constraints

- **The set id is `furniture`** everywhere — JSON `wordSetId`, registry `id`, `WORD_SET` values, `SET_BACKGROUNDS` key, icon key, locale key.
- **Word ids are `furniture.<text>`** — e.g. `furniture.wardrobe`.
- **Asset paths are keyed by word text, not id**: `/assets/images/<text>.webp` and `/assets/audio/<text>.mp3`.
- **The 15 words are exactly**: `wardrobe`, `shelf`, `bookcase`, `drawer`, `carpet`, `curtain`, `cushion`, `blanket`, `fridge`, `stool`, `bin`, `plant`, `basket`, `candle`, `vase`.
- **No furniture word may collide with a word in any other topic.** `picture` and `computer` are already in `school`; `bed`, `chair`, `table`, `sofa`, `desk`, `cupboard`, `lamp`, `clock`, `mirror` are already in `home`. Do not add them.
- **Three pre-existing cross-topic duplicates are intentional and must keep passing**: `chicken` and `fish` (`animals` + `food`), `orange` (`colors` + `food`). Never write a registry-wide uniqueness assertion.
- **Set background is `{ r: 240, g: 220, b: 190 }`** (warm tan).
- **Topic icon is `🛋️`**; display name is `Furniture`.
- **`letterChoices` is a 3-tuple** typed `[string, string, string]`, with the correct letter written first by convention. `FillInBlankActivity` shuffles at render time via `seededShuffle`, so JSON order does not affect gameplay.
- **SVG style**: 400×400 viewBox, full-bleed background rect, flat fills, no gradients, no text, `stroke-linejoin="round"`, `stroke-linecap="round"`, outline `stroke-width` 8–10 for main forms and 5–7 for details.
- Run `pnpm lint` and `pnpm typecheck` before each commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/data/yle-starters/furniture.json` | Create. The 15 word rows. |
| `src/data/yle-starters/index.ts` | Modify. Import + registry entry. |
| `src/data/yle-starters/icons.ts` | Modify. One icon entry. |
| `src/locales/en/vocab.json` | Modify. One display-name entry. |
| `scripts/lib/emoji-map.ts` | Modify. 15 `EMOJI_MAP` + 15 `WORD_SET` + 1 `SET_BACKGROUNDS` entry. |
| `scripts/generate-custom-images.ts` | Modify. 10 SVG builder functions + 10 `IMAGES` entries. |
| `tests/unit/furniture-word-set.test.ts` | Create. Registry shape + collision guard (Task 1); asset existence (Task 4). |

---

### Task 1: Word data and registry wiring

Creates the topic as data and proves it is correctly registered and collision-free. Assets do not exist yet — asset-existence assertions come in Task 4.

**Files:**
- Create: `src/data/yle-starters/furniture.json`
- Create: `tests/unit/furniture-word-set.test.ts`
- Modify: `src/data/yle-starters/index.ts`
- Modify: `src/data/yle-starters/icons.ts`
- Modify: `src/locales/en/vocab.json`

**Interfaces:**
- Consumes: `Word` and `WordSet` from `@/shared/types`; `wordSetRegistry` and `getWordSet` from `@/data/yle-starters/index`; `WORD_SET_ICONS` from `@/data/yle-starters/icons`.
- Produces: a `WordSet` with `id: 'furniture'`, `displayName: 'Furniture'`, and 15 words. Tasks 2–4 rely on the exact 15 `text` values and on `pictureAsset`/`audioAsset` naming.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/furniture-word-set.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { wordSetRegistry, getWordSet } from '@/data/yle-starters/index';
import { WORD_SET_ICONS } from '@/data/yle-starters/icons';
import vocabEn from '@/locales/en/vocab.json';

const EXPECTED_WORDS = [
  'wardrobe', 'shelf', 'bookcase', 'drawer', 'carpet',
  'curtain', 'cushion', 'blanket', 'fridge', 'stool',
  'bin', 'plant', 'basket', 'candle', 'vase',
];

describe('furniture word set', () => {
  const furniture = getWordSet('furniture');

  it('is registered with the expected display name', () => {
    expect(furniture).toBeDefined();
    expect(furniture!.displayName).toBe('Furniture');
  });

  it('contains exactly the 15 designed words', () => {
    expect(furniture!.words.map((w) => w.text)).toEqual(EXPECTED_WORDS);
  });

  it('gives every word a furniture-scoped id and set id', () => {
    for (const word of furniture!.words) {
      expect(word.wordSetId).toBe('furniture');
      expect(word.id).toBe(`furniture.${word.text}`);
    }
  });

  it('points every word at text-keyed image and audio assets', () => {
    for (const word of furniture!.words) {
      expect(word.pictureAsset).toBe(`/assets/images/${word.text}.webp`);
      expect(word.audioAsset).toBe(`/assets/audio/${word.text}.mp3`);
    }
  });

  it('blanks a letter that is actually offered as a choice', () => {
    for (const word of furniture!.words) {
      expect(word.blankLetterIndex).toBeGreaterThanOrEqual(0);
      expect(word.blankLetterIndex).toBeLessThan(word.text.length);
      expect(word.letterChoices).toHaveLength(3);
      expect(word.letterChoices).toContain(word.text[word.blankLetterIndex]);
      expect(new Set(word.letterChoices).size).toBe(3);
    }
  });

  // Guards the core design decision. Deliberately scoped to furniture: the
  // registry already contains three intentional dual-category duplicates
  // (chicken, fish, orange), so a registry-wide uniqueness check would fail.
  it('shares no word with any other topic', () => {
    const others = new Map<string, string>();
    for (const set of wordSetRegistry) {
      if (set.id === 'furniture') continue;
      for (const word of set.words) others.set(word.text, set.id);
    }
    const collisions = furniture!.words
      .filter((w) => others.has(w.text))
      .map((w) => `${w.text} (already in ${others.get(w.text)})`);
    expect(collisions).toEqual([]);
  });

  it('has an icon and a translated display name', () => {
    expect(WORD_SET_ICONS.furniture).toBe('🛋️');
    // Cast: the key does not exist in the JSON yet, and this test is written
    // before Step 6 adds it. Without the cast `pnpm typecheck` would fail on
    // the intermediate state.
    expect((vocabEn.wordSets as Record<string, string>).furniture).toBe('Furniture');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/furniture-word-set.test.ts
```

Expected: FAIL. `getWordSet('furniture')` returns `undefined`, so the first test fails on `expect(furniture).toBeDefined()` and the rest throw on `furniture!.words`.

- [ ] **Step 3: Create the word data**

Create `src/data/yle-starters/furniture.json`:

```json
[
  {
    "id": "furniture.wardrobe",
    "text": "wardrobe",
    "pictureAsset": "/assets/images/wardrobe.webp",
    "audioAsset": "/assets/audio/wardrobe.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.shelf",
    "text": "shelf",
    "pictureAsset": "/assets/images/shelf.webp",
    "audioAsset": "/assets/audio/shelf.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["e", "a", "i"]
  },
  {
    "id": "furniture.bookcase",
    "text": "bookcase",
    "pictureAsset": "/assets/images/bookcase.webp",
    "audioAsset": "/assets/audio/bookcase.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["o", "a", "e"]
  },
  {
    "id": "furniture.drawer",
    "text": "drawer",
    "pictureAsset": "/assets/images/drawer.webp",
    "audioAsset": "/assets/audio/drawer.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.carpet",
    "text": "carpet",
    "pictureAsset": "/assets/images/carpet.webp",
    "audioAsset": "/assets/audio/carpet.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.curtain",
    "text": "curtain",
    "pictureAsset": "/assets/images/curtain.webp",
    "audioAsset": "/assets/audio/curtain.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["u", "a", "o"]
  },
  {
    "id": "furniture.cushion",
    "text": "cushion",
    "pictureAsset": "/assets/images/cushion.webp",
    "audioAsset": "/assets/audio/cushion.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["u", "a", "o"]
  },
  {
    "id": "furniture.blanket",
    "text": "blanket",
    "pictureAsset": "/assets/images/blanket.webp",
    "audioAsset": "/assets/audio/blanket.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.fridge",
    "text": "fridge",
    "pictureAsset": "/assets/images/fridge.webp",
    "audioAsset": "/assets/audio/fridge.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["i", "e", "a"]
  },
  {
    "id": "furniture.stool",
    "text": "stool",
    "pictureAsset": "/assets/images/stool.webp",
    "audioAsset": "/assets/audio/stool.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["o", "a", "u"]
  },
  {
    "id": "furniture.bin",
    "text": "bin",
    "pictureAsset": "/assets/images/bin.webp",
    "audioAsset": "/assets/audio/bin.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["i", "a", "u"]
  },
  {
    "id": "furniture.plant",
    "text": "plant",
    "pictureAsset": "/assets/images/plant.webp",
    "audioAsset": "/assets/audio/plant.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 2,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.basket",
    "text": "basket",
    "pictureAsset": "/assets/images/basket.webp",
    "audioAsset": "/assets/audio/basket.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.candle",
    "text": "candle",
    "pictureAsset": "/assets/images/candle.webp",
    "audioAsset": "/assets/audio/candle.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["a", "e", "o"]
  },
  {
    "id": "furniture.vase",
    "text": "vase",
    "pictureAsset": "/assets/images/vase.webp",
    "audioAsset": "/assets/audio/vase.mp3",
    "wordSetId": "furniture",
    "blankLetterIndex": 1,
    "letterChoices": ["a", "e", "i"]
  }
]
```

- [ ] **Step 4: Register the set**

In `src/data/yle-starters/index.ts`, add the import after the `foodData` line:

```ts
import furnitureData from './furniture.json';
```

and the registry entry between the `food` and `home` rows:

```ts
  { id: 'furniture', displayName: 'Furniture', words: furnitureData as Word[] },
```

- [ ] **Step 5: Add the icon**

In `src/data/yle-starters/icons.ts`, add between the `food` and `home` entries:

```ts
  furniture: '🛋️',
```

- [ ] **Step 6: Add the display name**

In `src/locales/en/vocab.json`, add to the `wordSets` object between `"food"` and `"home"`:

```json
    "furniture": "Furniture",
```

- [ ] **Step 7: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/furniture-word-set.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 8: Run the full suite, lint and typecheck**

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: all pass. No existing test asserts a topic count, so nothing should break.

- [ ] **Step 9: Commit**

```bash
git add src/data/yle-starters/furniture.json src/data/yle-starters/index.ts src/data/yle-starters/icons.ts src/locales/en/vocab.json tests/unit/furniture-word-set.test.ts
git commit -m "feat(vocab): add furniture topic word data and registry entry"
```

---

### Task 2: Emoji map entries and the 5 emoji images

Wires the generator config and produces the five images that need no new artwork. Verifies the pipeline end-to-end before the expensive SVG work.

**Files:**
- Modify: `scripts/lib/emoji-map.ts`

**Interfaces:**
- Consumes: the 15 word texts from Task 1; `AI_FALLBACK` and `getSetBackground` already exported from `scripts/lib/emoji-map.ts`.
- Produces: `SET_BACKGROUNDS.furniture` (used by Task 3's `bg('furniture')` calls) and the 10 `AI_FALLBACK` markings that make Task 3's images the fallback path.

- [ ] **Step 1: Add the emoji entries**

In `scripts/lib/emoji-map.ts`, insert a new block in `EMOJI_MAP` between the Food and Home sections:

```ts
  // ── Furniture ─────────────────────────────────────────────────────────────
  // No Noto emoji exists for real furniture — these render via
  // generate-custom-images.ts instead.
  wardrobe:   AI_FALLBACK,
  shelf:      AI_FALLBACK,
  bookcase:   AI_FALLBACK,
  drawer:     AI_FALLBACK,
  carpet:     AI_FALLBACK,
  curtain:    AI_FALLBACK,
  cushion:    AI_FALLBACK,
  blanket:    AI_FALLBACK,
  fridge:     AI_FALLBACK,
  stool:      AI_FALLBACK,
  bin:        '🗑️',
  plant:      '🪴',
  basket:     '🧺',
  candle:     '🕯️',
  vase:       '🏺',
```

- [ ] **Step 2: Add the set background**

In the `SET_BACKGROUNDS` object, add between `food` and `home`:

```ts
  furniture: { r: 240, g: 220, b: 190 }, // warm tan — wood, distinct from home cream
```

- [ ] **Step 3: Add the word-to-set mapping**

In the `WORD_SET` object, add a block between the `// Food` and `// Home` sections:

```ts
  // Furniture
  wardrobe: 'furniture', shelf: 'furniture', bookcase: 'furniture', drawer: 'furniture',
  carpet: 'furniture', curtain: 'furniture', cushion: 'furniture', blanket: 'furniture',
  fridge: 'furniture', stool: 'furniture', bin: 'furniture', plant: 'furniture',
  basket: 'furniture', candle: 'furniture', vase: 'furniture',
```

- [ ] **Step 4: Dry-run the generator to confirm the set resolves**

```bash
pnpm tsx scripts/generate-vocab-images.ts --set=furniture --dry-run
```

Expected: it lists 15 furniture words and does **not** print `No words found for set "furniture"`. The 10 `AI_FALLBACK` words are reported as skipped (no `FAL_KEY`); the 5 emoji words are reported as would-generate.

- [ ] **Step 5: Generate the five emoji images**

```bash
pnpm tsx scripts/generate-vocab-images.ts --set=furniture
```

Expected: 5 files written to `public/assets/images/`.

- [ ] **Step 6: Verify the five files exist and are non-empty**

```bash
ls -l public/assets/images/{bin,plant,basket,candle,vase}.webp
```

Expected: 5 files, each a few KB. Open one and confirm the background is warm tan, not the grey `DEFAULT_BG` — a grey background means Step 2 or Step 3 was missed.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/emoji-map.ts public/assets/images/bin.webp public/assets/images/plant.webp public/assets/images/basket.webp public/assets/images/candle.webp public/assets/images/vase.webp
git commit -m "feat(vocab): map furniture words to emoji and generate the 5 emoji images"
```

---

### Task 3: Ten custom furniture illustrations

The ten words with no usable emoji. Each is a flat-vector SVG rendered through the same `convertToWebP` path as the existing custom images.

**Files:**
- Modify: `scripts/generate-custom-images.ts`

**Interfaces:**
- Consumes: `bg(set: string): string` and `convertToWebP(buffer: Buffer, outputPath: string): Promise<void>`, both already present in the file; `SET_BACKGROUNDS.furniture` from Task 2.
- Produces: 10 `.webp` files in `public/assets/images/`, named by word text.

- [ ] **Step 1: Add the shared wood palette**

In `scripts/generate-custom-images.ts`, add below the existing `EYE` constant:

```ts
const WOOD = '#C98B4B';
const WOOD_LIGHT = '#DDA96A';
const WOOD_DARK = '#7A4A22';
```

- [ ] **Step 2: Add the four case-furniture illustrations**

Add these functions above the `IMAGES` array:

```ts
/** wardrobe: a closed two-door cabinet with panelled doors and legs. */
function wardrobeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="94" y="54" width="212" height="278" rx="12" fill="${WOOD}"/>
    <rect x="114" y="76" width="76" height="234" rx="7" fill="${WOOD_LIGHT}"/>
    <rect x="210" y="76" width="76" height="234" rx="7" fill="${WOOD_LIGHT}"/>
    <line x1="200" y1="60" x2="200" y2="326"/>
    <line x1="130" y1="332" x2="130" y2="366"/>
    <line x1="270" y1="332" x2="270" y2="366"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="7" stroke-linecap="round">
    <line x1="180" y1="182" x2="180" y2="216"/>
    <line x1="220" y1="182" x2="220" y2="216"/>
  </g>
</svg>`;
}

/** bookcase: an open frame of three shelves filled with coloured book spines. */
function bookcaseSvg(): string {
  const spine = (x: number, y: number, h: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="20" height="${h}" fill="${fill}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="78" y="58" width="244" height="276" rx="10" fill="${WOOD}"/>
    <rect x="100" y="80" width="200" height="232" fill="#F7E9D2"/>
    <line x1="100" y1="157" x2="300" y2="157"/>
    <line x1="100" y1="234" x2="300" y2="234"/>
    <line x1="122" y1="334" x2="122" y2="366"/>
    <line x1="278" y1="334" x2="278" y2="366"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="5" stroke-linejoin="round">
    ${spine(112, 98, 56, '#E8544B')}${spine(136, 90, 64, '#4E7FD4')}${spine(160, 104, 50, '#3FA66A')}${spine(184, 94, 60, '#F2B441')}
    ${spine(112, 176, 55, '#9B6FD1')}${spine(136, 168, 63, '#E86AA6')}${spine(160, 182, 49, '#46B29D')}
    ${spine(112, 252, 58, '#F2B441')}${spine(136, 246, 64, '#E8544B')}${spine(160, 258, 52, '#4E7FD4')}
  </g>
</svg>`;
}

/** shelf: one wall-mounted plank on brackets, holding books and a pot plant. */
function shelfSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="62" y="232" width="276" height="28" rx="9" fill="${WOOD}"/>
    <path fill="${WOOD_LIGHT}" d="M104 260 L104 306 L150 260 Z"/>
    <path fill="${WOOD_LIGHT}" d="M296 260 L296 306 L250 260 Z"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="5" stroke-linejoin="round">
    <rect x="112" y="170" width="22" height="62" fill="#E8544B"/>
    <rect x="138" y="162" width="22" height="70" fill="#4E7FD4"/>
    <rect x="164" y="176" width="22" height="56" fill="#3FA66A"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4643C" d="M236 232 L246 196 L292 196 L302 232 Z"/>
    <path fill="#3FA66A" d="M269 196 Q247 176 253 150 Q275 158 275 196 Z"/>
    <path fill="#3FA66A" d="M269 196 Q291 178 287 154 Q265 164 269 196 Z"/>
  </g>
</svg>`;
}

/** drawer: a chest with its middle drawer pulled open, so the word reads
 *  as the drawer itself rather than as the chest. */
function drawerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="96" y="76" width="208" height="248" rx="10" fill="${WOOD}"/>
    <rect x="114" y="94" width="172" height="62" rx="6" fill="${WOOD_LIGHT}"/>
    <rect x="114" y="244" width="172" height="62" rx="6" fill="${WOOD_LIGHT}"/>
    <path fill="#F2D3A6" d="M74 170 L326 170 L302 150 L98 150 Z"/>
    <path fill="#E0B27C" d="M74 170 L326 170 L326 238 L74 238 Z"/>
    <line x1="128" y1="324" x2="128" y2="356"/>
    <line x1="272" y1="324" x2="272" y2="356"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="7" stroke-linecap="round">
    <line x1="170" y1="125" x2="230" y2="125"/>
    <line x1="170" y1="275" x2="230" y2="275"/>
    <line x1="164" y1="204" x2="236" y2="204"/>
  </g>
</svg>`;
}
```

- [ ] **Step 3: Add the seating, soft-furnishing and appliance illustrations**

Add these below the previous four:

```ts
/** stool: a round wooden seat on three splayed legs with a crossbar. */
function stoolSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="11" stroke-linejoin="round" stroke-linecap="round">
    <line x1="128" y1="190" x2="100" y2="336"/>
    <line x1="272" y1="190" x2="300" y2="336"/>
    <line x1="200" y1="200" x2="200" y2="348"/>
  </g>
  <path fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round" d="M118 268 L200 282 L282 268"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="${WOOD}" d="M88 164 L88 186 Q88 212 200 212 Q312 212 312 186 L312 164 Z"/>
    <ellipse cx="200" cy="164" rx="112" ry="34" fill="${WOOD_LIGHT}"/>
  </g>
</svg>`;
}

/** cushion: a plump square cushion with corner tassels, on a sofa seat. */
function cushionSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <path fill="#C9A227" stroke="#8A6A14" stroke-width="9" stroke-linejoin="round" d="M56 310 L344 310 L344 352 L56 352 Z"/>
  <g stroke="#2F5E8C" stroke-width="7" stroke-linecap="round">
    <line x1="110" y1="118" x2="88" y2="96"/>
    <line x1="290" y1="118" x2="312" y2="96"/>
    <line x1="110" y1="292" x2="88" y2="314"/>
    <line x1="290" y1="292" x2="312" y2="314"/>
  </g>
  <g stroke="#2F5E8C" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#4E9BD4" d="M110 118 Q200 96 290 118 Q312 200 290 292 Q200 314 110 292 Q88 200 110 118 Z"/>
    <path fill="none" stroke-width="6" d="M142 152 Q200 140 258 152"/>
    <path fill="none" stroke-width="6" d="M142 258 Q200 270 258 258"/>
  </g>
</svg>`;
}

/** blanket: a striped blanket with a scalloped edge, draped over a bed. */
function blanketSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="72" y="206" width="256" height="56" rx="12" fill="#F4EAD8"/>
    <line x1="96" y1="262" x2="96" y2="332"/>
    <line x1="304" y1="262" x2="304" y2="332"/>
  </g>
  <g stroke="#2F6B4F" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#48A56F" d="M84 200 Q200 168 316 200 L316 268 Q300 288 284 268 Q268 248 252 268 Q236 288 220 268 Q204 248 188 268 Q172 288 156 268 Q140 248 124 268 Q108 288 92 268 L84 268 Z"/>
    <path fill="none" stroke-width="6" d="M88 226 Q200 196 312 226"/>
    <path fill="none" stroke-width="6" d="M88 248 Q200 218 312 248"/>
  </g>
</svg>`;
}

/** fridge: a two-door fridge-freezer with vertical handles and magnets. */
function fridgeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#4A5B6B" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="112" y="48" width="176" height="292" rx="16" fill="#E4ECF2"/>
    <line x1="112" y1="152" x2="288" y2="152"/>
    <line x1="126" y1="340" x2="126" y2="366"/>
    <line x1="274" y1="340" x2="274" y2="366"/>
  </g>
  <g stroke="#4A5B6B" stroke-width="8" stroke-linecap="round">
    <line x1="256" y1="86" x2="256" y2="126"/>
    <line x1="256" y1="180" x2="256" y2="242"/>
  </g>
  <g stroke="#4A5B6B" stroke-width="5" stroke-linejoin="round">
    <rect x="140" y="196" width="30" height="30" rx="5" fill="#E8544B"/>
    <rect x="140" y="240" width="30" height="30" rx="5" fill="#F2B441"/>
    <rect x="184" y="218" width="30" height="30" rx="5" fill="#4E7FD4"/>
  </g>
</svg>`;
}
```

- [ ] **Step 4: Add the two easily-confused illustrations**

`carpet` and `curtain` are the two most at risk of being misread. The carpet is drawn in perspective on visible floorboards with a fringed near edge — the blanket in Step 3 is rectangular, striped and on a bed, so the two cannot be confused.

```ts
/** carpet: a bordered rug in perspective on floorboards, with a fringed edge.
 *  Deliberately unlike `blanket`: on the floor, trapezoid, fringed. */
function carpetSvg(): string {
  const fringe = (x1: number, x2: number) =>
    `<line x1="${x1}" y1="322" x2="${x2}" y2="346"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#B08040" stroke-width="6" stroke-linecap="round" opacity="0.5">
    <line x1="36" y1="150" x2="364" y2="150"/>
    <line x1="36" y1="205" x2="364" y2="205"/>
    <line x1="36" y1="260" x2="364" y2="260"/>
    <line x1="36" y1="315" x2="364" y2="315"/>
  </g>
  <g stroke="#8C2F3E" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4485C" d="M52 316 L118 148 L282 148 L348 316 Z"/>
    <path fill="none" stroke="#F2D3A6" stroke-width="8" d="M84 300 L134 170 L266 170 L316 300 Z"/>
    <path fill="#F2D3A6" d="M200 196 L246 246 L200 296 L154 246 Z"/>
  </g>
  <g stroke="#8C2F3E" stroke-width="7" stroke-linecap="round">
    ${fringe(64, 58)}${fringe(106, 102)}${fringe(150, 148)}${fringe(200, 200)}${fringe(250, 252)}${fringe(294, 298)}${fringe(336, 342)}
  </g>
</svg>`;
}

/** curtain: two drapes on a rod, framing a window. */
function curtainSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="122" y="104" width="156" height="196" rx="6" fill="#BFE3F5"/>
    <line x1="200" y1="104" x2="200" y2="300"/>
    <line x1="122" y1="202" x2="278" y2="202"/>
  </g>
  <g stroke="#7A2E3A" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4485C" d="M96 96 Q132 150 118 214 Q104 278 130 330 L84 330 Q64 262 76 194 Q88 126 96 96 Z"/>
    <path fill="#D4485C" d="M304 96 Q268 150 282 214 Q296 278 270 330 L316 330 Q336 262 324 194 Q312 126 304 96 Z"/>
  </g>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <line x1="66" y1="92" x2="334" y2="92"/>
    <circle cx="58" cy="92" r="11" fill="${WOOD}"/>
    <circle cx="342" cy="92" r="11" fill="${WOOD}"/>
  </g>
</svg>`;
}
```

- [ ] **Step 5: Register the ten images**

Extend the `IMAGES` array at the bottom of `scripts/generate-custom-images.ts`:

```ts
const IMAGES: Array<{ word: string; set: string; svg: () => string }> = [
  { word: 'sweater', set: 'clothes', svg: sweaterSvg },
  { word: 'back', set: 'body', svg: backSvg },
  { word: 'brother', set: 'family', svg: brotherSvg },
  { word: 'sister', set: 'family', svg: sisterSvg },
  { word: 'wardrobe', set: 'furniture', svg: wardrobeSvg },
  { word: 'bookcase', set: 'furniture', svg: bookcaseSvg },
  { word: 'shelf', set: 'furniture', svg: shelfSvg },
  { word: 'drawer', set: 'furniture', svg: drawerSvg },
  { word: 'stool', set: 'furniture', svg: stoolSvg },
  { word: 'cushion', set: 'furniture', svg: cushionSvg },
  { word: 'blanket', set: 'furniture', svg: blanketSvg },
  { word: 'fridge', set: 'furniture', svg: fridgeSvg },
  { word: 'carpet', set: 'furniture', svg: carpetSvg },
  { word: 'curtain', set: 'furniture', svg: curtainSvg },
];
```

Also update the file's header comment, which currently names only the four original words:

```ts
/**
 * Renders flat-vector illustrations for the AI_FALLBACK vocabulary words that
 * have no suitable Noto emoji: the four original words (`sweater`, `back`,
 * `brother`, `sister`) plus the ten furniture words (`wardrobe`, `bookcase`,
 * `shelf`, `drawer`, `stool`, `cushion`, `blanket`, `fridge`, `carpet`,
 * `curtain`), for which Noto has no furniture emoji at all.
 *
```

- [ ] **Step 6: Generate the images**

```bash
pnpm tsx scripts/generate-custom-images.ts
```

Expected: `[done]` for all 14 words, ending with `Done: 14 custom illustrations rendered.`

- [ ] **Step 7: Inspect the output**

```bash
ls -l public/assets/images/{wardrobe,bookcase,shelf,drawer,stool,cushion,blanket,fridge,carpet,curtain}.webp
```

Expected: 10 files present. Then **open all ten** and check each reads as its word at thumbnail size. Specifically confirm:
- `carpet` is clearly on a floor with a fringe; `blanket` is clearly on a bed.
- `wardrobe` (closed doors), `bookcase` (visible books) and `shelf` (single plank) are three obviously different objects.
- `cushion` is not mistakable for `blanket`.

If any reads wrong, adjust the SVG and re-run Step 6 — never hand-edit the `.webp`.

- [ ] **Step 8: Lint and typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add scripts/generate-custom-images.ts public/assets/images/wardrobe.webp public/assets/images/bookcase.webp public/assets/images/shelf.webp public/assets/images/drawer.webp public/assets/images/stool.webp public/assets/images/cushion.webp public/assets/images/blanket.webp public/assets/images/fridge.webp public/assets/images/carpet.webp public/assets/images/curtain.webp
git commit -m "feat(vocab): add ten custom furniture illustrations"
```

---

### Task 4: Audio, asset verification, and in-app check

Completes the topic and proves it works in the running app.

**Files:**
- Modify: `tests/unit/furniture-word-set.test.ts`

**Interfaces:**
- Consumes: `getWordSet('furniture')` from Task 1; the 15 `.webp` files from Tasks 2 and 3.
- Produces: 15 `.mp3` files in `public/assets/audio/`; a passing asset-existence assertion.

- [ ] **Step 1: Generate the audio**

```bash
pnpm tsx scripts/generate-vocab-audio.ts
```

The script collects words from every JSON file in `src/data/yle-starters` and skips any that already have an mp3, so this generates only the 15 new ones. It needs macOS `say` and `ffmpeg`.

Expected: 15 files written, existing words skipped.

- [ ] **Step 2: Write the failing asset test**

Add to `tests/unit/furniture-word-set.test.ts` — the import goes at the top with the others:

```ts
import { existsSync } from 'fs';
import { join } from 'path';
```

and this test inside the existing `describe` block:

```ts
  it('has a generated image and audio file for every word', () => {
    const missing = furniture!.words.flatMap((word) => [
      ...(existsSync(join(process.cwd(), 'public', word.pictureAsset)) ? [] : [word.pictureAsset]),
      ...(existsSync(join(process.cwd(), 'public', word.audioAsset)) ? [] : [word.audioAsset]),
    ]);
    expect(missing).toEqual([]);
  });
```

- [ ] **Step 3: Run the test**

```bash
pnpm vitest run tests/unit/furniture-word-set.test.ts
```

Expected: PASS, 8 tests. If it fails, the failure message lists exactly which assets are missing — re-run the matching generator from Task 2, 3, or Step 1 above rather than editing the test.

To confirm the test genuinely guards something, temporarily rename one file, re-run, and check it fails naming that file:

```bash
mv public/assets/audio/stool.mp3 public/assets/audio/stool.mp3.bak && pnpm vitest run tests/unit/furniture-word-set.test.ts; mv public/assets/audio/stool.mp3.bak public/assets/audio/stool.mp3
```

Expected: FAIL listing `/assets/audio/stool.mp3`, then PASS again after the restore.

- [ ] **Step 4: Run the full suite, lint and typecheck**

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Expected: all pass.

- [ ] **Step 5: Verify in the running app**

Start the dev server using the `vite-dev` configuration in `.claude/launch.json` (port 5180) — use the preview tooling, not a raw shell command. Then check the topic end to end:

1. The Furniture tile appears in the topic list with the 🛋️ icon and the name "Furniture".
2. Open it and play one vocabulary session through to the celebration screen.
3. Confirm images render on the warm-tan background and audio plays on each word.
4. Confirm Fill-in-the-Blank offers three distinct letters and accepts the correct one.
5. Open Memory Match on Furniture and confirm the deck builds.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/furniture-word-set.test.ts public/assets/audio
git commit -m "feat(vocab): generate furniture audio and assert asset coverage"
```

---

## Notes for the implementer

- **Do not touch the `home` topic.** The two topics are designed to be complementary; moving words between them would orphan existing `word_progress` rows.
- **Do not hand-edit `.webp` or `.mp3` files.** They are generated. Fix the source — the SVG function, the emoji mapping, or the word JSON — and re-run the generator.
- **If a furniture word ever needs to change**, check it against every other topic first. `EMOJI_MAP`, `WORD_SET`, and the asset paths are all keyed by word text, so a duplicate silently takes the other topic's background and shares its image.
- **No UI file needs editing.** If a screen does not show the new topic, the bug is in the registry entry, not in the screen.
