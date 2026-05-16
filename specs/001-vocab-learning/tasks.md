# Tasks: Vocab Image Generation (001-vocab-learning)

**Input**: `specs/001-vocab-learning/plan.md`, `research.md`, `scripts/lib/emoji-map.ts`  
**Prerequisite**: All app tasks (T001–T054) from previous tasks.md are ✅ complete.  
**This task list**: Generates 174 WebP emoji icons for all vocabulary words — prerequisite for all 5 user stories.

**Tests**: No test suite required — correctness verified by dry-run output + visual spot-check.

**Organization**: Single pipeline (Setup → Build → Execute → Verify). All tasks support US1–US5.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Setup

**Purpose**: Install image-pipeline dependencies; confirm `scripts/lib/emoji-map.ts` is wired up.

- [X] T101 Add `sharp`, `tsx` devDependencies to package.json; run `pnpm install`; confirm `npx tsx --version` works in scripts/
- [X] T102 [P] Install Noto Emoji SVG source: add `@noto-emoji/svg` package (or clone emoji SVG CDN path); confirm at least one SVG is accessible (e.g. `noto-emoji/svg/emoji_u1f431.svg` for 🐱)
- [X] T103 [P] Create `.env.local` entry placeholder `FAL_KEY=` for AI fallback (8 words); document in `specs/001-vocab-learning/quickstart.md` that FAL_KEY is optional — only needed for fallback words: back, floor, eraser, skirt, sweater, trousers, brother, sister

**Checkpoint**: `npx tsx --help` succeeds; `node -e "require('sharp')"` succeeds; noto-emoji SVG accessible.

---

## Phase 2: Foundational Scripts

**Purpose**: Build reusable modules the orchestrator depends on. `emoji-map.ts` is already created.

- [X] T104 [P] Create `scripts/lib/word-loader.ts`: export `loadAllWords(): { setName: string; word: string; hasPictureAsset: boolean }[]` — reads all 14 `src/data/yle-starters/*.json` files; returns flat list of 174 entries with `hasPictureAsset = !!word.pictureAsset`
- [X] T105 [P] Create `scripts/lib/image-converter.ts`: export `convertToWebP(inputBuffer: Buffer, outputPath: string): Promise<void>` using `sharp` — `fit: 'contain'`, white fill, resize to `IMAGE_SIZE × IMAGE_SIZE`, `webp({ quality: WEBP_QUALITY })`; export constants `IMAGE_SIZE = 400`, `WEBP_QUALITY = 85`
- [X] T106 [P] Verify `scripts/lib/emoji-map.ts` (already created): run `npx tsx -e "import { EMOJI_MAP, AI_FALLBACK_WORDS, EMOJI_WORDS } from './scripts/lib/emoji-map.ts'; console.log('emoji:', EMOJI_WORDS.length, 'fallback:', AI_FALLBACK_WORDS.length)"` — expect `emoji: 166 fallback: 8`

**Checkpoint**: All three modules compile without TypeScript errors (`npx tsx scripts/lib/word-loader.ts`).

---

## Phase 3: Emoji Render Pipeline (supports US1–US5)

**Purpose**: Core path — render Noto Emoji SVG on a colored background → 400×400 WebP.

- [X] T107 [P] [US1] Define per-set background palette in `scripts/lib/emoji-map.ts`: export `SET_BACKGROUNDS: Record<string, { r: number; g: number; b: number }>` — one pastel color per word set (e.g. animals: sky-blue `{r:200,g:230,b:255}`, food: warm-peach `{r:255,g:220,b:190}`, clothes: lavender, etc.); colors must pass WCAG 3:1 contrast against emoji foreground
- [X] T108 [US1] Create `scripts/lib/emoji-renderer.ts`: export `renderEmojiToWebP(emoji: string, wordSetId: string, outputPath: string): Promise<void>`  
  Pipeline: (1) convert emoji char to Unicode hex codepoint(s), (2) locate Noto Emoji SVG file via `@noto-emoji/svg` path, (3) read SVG buffer, (4) build colored-background SVG wrapper (`<svg><rect fill="..."/><image href="data:image/svg+xml;base64,..."/></svg>`), (5) pass composite SVG buffer to `convertToWebP()`; throw descriptive error if SVG not found

**Checkpoint**: Run `npx tsx -e "import {renderEmojiToWebP} from './scripts/lib/emoji-renderer.ts'; renderEmojiToWebP('🐱','animals','tmp-cat.webp')"` → `tmp-cat.webp` appears, 400×400 WebP, ~10 KB.

---

## Phase 4: AI Fallback Pipeline (8 words)

**Purpose**: Generate the 8 words where emoji is wrong/ambiguous via fal.ai Flux.

- [X] T109 [P] [US1] Create `scripts/lib/fal-ai-client.ts`: export `generateViaFalAi(word: string, outputPath: string): Promise<void>`  
  (1) read `process.env.FAL_KEY` (throw if missing), (2) call `@fal-ai/client` with model `fal-ai/flux/schnell`, prompt template from `research.md`, image_size `square_hd`, (3) download result PNG to tmp file, (4) call `convertToWebP()` to produce final WebP; include exponential backoff retry (3 attempts, base 1 s)

**Checkpoint**: With valid FAL_KEY set, run `npx tsx -e "import {generateViaFalAi} from './scripts/lib/fal-ai-client.ts'; generateViaFalAi('back','tmp-back.webp')"` → `tmp-back.webp` produced.

---

## Phase 5: Main Orchestrator + Execution (US1–US5)

**Purpose**: Build the CLI entry point; run it to produce all 174 images and patch JSON.

- [X] T110 [US1] Create `scripts/generate-vocab-images.ts`: CLI entry point  
  Flags: `--dry-run`, `--force`, `--missing`, `--set=NAME`  
  Per word: (1) check if output file exists + `--force`/`--missing` logic, (2) route to `renderEmojiToWebP` or `generateViaFalAi` based on `EMOJI_MAP[word]`, (3) write to `public/assets/images/{word}.webp`, (4) if `word.pictureAsset === ''` patch JSON in-place (`src/data/yle-starters/{set}.json`), (5) log `[done] {set} / {word}` per word; write `generation-progress.json` (total, generated, failed[]) on completion
- [X] T111 [US1] Dry-run verification: `npx tsx scripts/generate-vocab-images.ts --dry-run`  
  Assert output lists exactly 174 words across 14 sets; assert 8 fallback words listed with `[AI]` marker; no files written
- [X] T112 [US1] Generate emoji images: `npx tsx scripts/generate-vocab-images.ts --force`  
  Runs all 174 words (166 emoji + 8 AI fallback if FAL_KEY set; skip AI if not set, log warning);  
  Assert: `public/assets/images/` contains ≥ 166 new `.webp` files when done
- [X] T113 [US1] Patch JSON verification: `python3 -c "import json,glob; [print(f) for f in glob.glob('src/data/yle-starters/*.json') if any(not w.get('pictureAsset') for w in json.load(open(f)))]"` — must print nothing (all `pictureAsset` fields filled)

**Checkpoint**: 166+ WebP files in `public/assets/images/`; all JSON `pictureAsset` fields non-empty; `generation-progress.json` shows 0 failed.

---

## Phase 6: Polish & Verification

**Purpose**: Spot-check visuals in the app; verify PWA pre-caches all images.

- [X] T114 [P] Run dev server `pnpm dev`; open each of the 14 word-set pages; spot-check: animals (🐱 cat), food (🍎 apple), transport (🚗 car), weather (☀️ sun) — images render at correct size, consistent colored backgrounds, no broken img tags
- [X] T115 [P] Run `pnpm build`; inspect `dist/sw.js` precache manifest — confirm all 174 `.webp` files in `public/assets/images/` appear in the Workbox precache list (grep `assets/images` in sw.js output)
- [X] T116 [P] File size audit: `find public/assets/images -name "*.webp" -size +50k` — must return nothing (all images ≤ 50 KB per SC-002 budget)
- [X] T117 Clean up: delete `generation-progress.json` and any `tmp-*.webp` files from repo root; add `generation-progress.json` to `.gitignore`

**Checkpoint**: All 14 word sets display emoji images correctly in the running app. `pnpm build` passes. All images ≤ 50 KB.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational Scripts)**: Depends on Phase 1
- **Phase 3 (Emoji Render)**: Depends on Phase 2 (needs `image-converter.ts`, `emoji-map.ts`)
- **Phase 4 (AI Fallback)**: Depends on Phase 2; parallel with Phase 3
- **Phase 5 (Orchestrator)**: Depends on Phase 3 + Phase 4
- **Phase 6 (Polish)**: Depends on Phase 5

### Parallel Opportunities

| Phase | Parallel group |
|-------|---------------|
| 1 | T102, T103 together (independent installs) |
| 2 | T104, T105, T106 together (different files) |
| 3 | T107 first (defines palette used by T108), then T108 |
| 4 | T109 parallel with Phase 3 (different file) |
| 6 | T114, T115, T116 together |

---

## Implementation Strategy

### Minimal path (no FAL_KEY)

1. Phase 1 → Phase 2 → Phase 3 → Phase 5 (skip T109 Phase 4)
2. Run `--force` → generates 166 emoji images; 8 fallback words get no image (shown as broken img in app temporarily)
3. Acquire FAL_KEY later → run `--missing` to fill the 8 gaps

### Full path

1. Phases 1–5 in order, acquire FAL_KEY before T112
2. Single `--force` run generates all 174 images in ~5 min
3. Phase 6 verifies

---

## Notes

- `[P]` = different files, safe to parallelize
- All user stories (US1–US5) benefit equally — images are a shared prerequisite
- `emoji-map.ts` is already created at `scripts/lib/emoji-map.ts`; T106 is verification only
- Run `--dry-run` first always to confirm word list before generating
- Files must stay under 200 lines; split if exceeded
