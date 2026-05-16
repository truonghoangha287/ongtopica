# Implementation Plan: Vocab Image Generation (All 174 Assets — Emoji Icons)

**Branch**: `claude/quizzical-goodall-1adf47` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: 108 vocab words missing images + 68 existing real photos to replace. Full visual unification.

## Summary

Replace all 174 vocabulary images with **emoji icons** rendered on colored backgrounds — $0 cost, consistent style, no API needed. Source: **Noto Emoji** (Google, Apache 2.0) SVGs, rendered via `sharp` → 400×400 WebP. Each word maps to an emoji codepoint; ~10 ambiguous words get better emoji alternatives or fallback to a simple AI-generated illustration (fal.ai Flux, ~$0.12 total for fallbacks). This is simpler and cheaper than full AI generation ($0 vs $2.12).

## Technical Context

**Language/Version**: TypeScript/React 18 (Vite 5), Node.js 20 for tooling scripts  
**Primary Dependencies**: React, Zustand, Dexie, framer-motion, Vite PWA  
**Storage**: WebP files at `public/assets/images/{word}.webp` (400×400 px)  
**Testing**: Vitest + Testing Library  
**Target Platform**: Web PWA (offline-first, tablet-primary)  
**Project Type**: Web application + Node.js asset pipeline scripts  
**Performance Goals**: Each image < 50 KB WebP; loads within 1 s on first session  
**Constraints**: Images must be age-appropriate, culturally inclusive, offline-available after first load  
**Scale/Scope**: 174 total images (68 replace existing + 106 new), 14 word sets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Child-First UX | ✅ PASS | Illustrations must be clear, bright, friendly — no text overlays, no complex scenes |
| II. Accessibility | ✅ PASS | Images are presentational; alt text via word `text` field already in components |
| III. Progressive Mastery | ✅ PASS | Image generation doesn't affect progression logic |
| IV. Safe & Private Sandbox | ✅ PASS | All images pre-bundled; no external CDN links at runtime; generation is offline/build-time |
| V. Performance & Offline | ✅ PASS | WebP 400×400 ≤ 50 KB per image; pre-cached by PWA service worker |
| VI. Code Quality | ✅ PASS | Generation script uses named constants for size/format; image paths follow existing convention |
| VII. Test Coverage | ✅ PASS | No logic change; existing rendering tests cover `pictureAsset` presence check |

No violations. No Complexity Tracking table required.

## Project Structure

### Documentation (this feature)

```text
specs/001-vocab-learning/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
public/assets/images/          ← 400×400 WebP images (174 total, emoji icons)
src/data/yle-starters/         ← JSON vocab files (pictureAsset fields to patch for new words)
scripts/
├── generate-vocab-images.ts   ← main orchestrator (emoji render + AI fallback)
└── lib/
    ├── emoji-map.ts           ← word → emoji codepoint mapping (174 entries)
    ├── emoji-renderer.ts      ← SVG fetch + sharp render → WebP 400×400
    ├── fal-ai-client.ts       ← AI fallback for 8 ambiguous words
    ├── image-converter.ts     ← sharp WebP conversion util
    └── word-loader.ts         ← load all words from JSON files
```

## Image Scope

### All 174 words — replace with emoji icons

174 words across 14 sets, all rendered as emoji-on-background WebP.

**Emoji coverage**: 164 clean mappings + 10 fallback words requiring AI generation:

| Word | Issue | Resolution |
|------|-------|-----------|
| `back` (body) | 🔙 is direction arrow | AI fallback |
| `floor` | ⬜ is generic square | AI fallback |
| `eraser` | 🧹 is broom | AI fallback |
| `skirt` | 👗 same as `dress` | AI fallback |
| `sweater` | 🧥 same as `jacket` | AI fallback |
| `trousers` | 👖 same as `jeans` | AI fallback |
| `brother` | 👦 same as `boy` | AI fallback |
| `sister` | 👧 same as `girl` | AI fallback |
| `zoo` | 🦁 already used for `lion` | Use 🦒 instead |
| `ball` (toys) | ⚽ same as `football` | Use 🏐 instead |

Net AI fallback count: **8 words** (~$0.10 at Flux pricing).

---

## Phase 0: Research

### Research Tasks Dispatched

1. **AI Generation API options** — evaluate DALL-E 3, Stable Diffusion (via fal.ai / Replicate), Ideogram, Flux for:
   - Batch generation capability (no per-image manual prompting)
   - Output quality for simple object illustrations (child vocabulary)
   - Cost at **176 images** (all words)
   - PNG/WebP output at 400×400 or higher for downscale
   - API availability without waitlist

2. **Prompt engineering for YLE-style vocabulary images** — what prompt template produces:
   - Single object, centered, white/light background
   - Bright, friendly, cartoon-illustrative style (matches YLE Starters materials)
   - No text, no UI chrome, no people required unless the word is a person/animal

3. **ai-artist skill (Nano Banana) suitability** — can it be driven non-interactively for batch generation of simple vocabulary concepts?

4. **WebP pipeline in Node.js** — `sharp` library for resize + convert from PNG/JPG → WebP 400×400

5. **Incremental/resumable script design** — skip words where `pictureAsset` already populated; handle API rate limits; dry-run mode

### Findings

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Generation approach | **Emoji icons (Noto Emoji SVG)** | $0; consistent style; Apache 2.0 license; covers 164/174 words cleanly |
| Emoji source | **Noto Emoji** (Google) | Apache 2.0; SVG available via `@noto-emoji` or CDN; well-maintained |
| Image pipeline | `sharp` (npm) with SVG input | Renders SVG → 400×400 WebP; `fit: 'contain'` + colored bg; ≈ 5–15 KB output |
| Background color | Per-set pastel palette | Differentiates word sets visually; child-friendly |
| Script language | TypeScript (`tsx`) | Matches project tooling |
| Fallback (10 words) | **fal.ai Flux.1 [schnell]** | For ambiguous/wrong emoji: `back`, `floor`, `eraser`, `skirt`, `sweater`, `trousers`, `brother`, `sister`, `zoo` (~$0.12) |

---

## Phase 1: Design

### Prerequisites

`research.md` complete (all NEEDS CLARIFICATION resolved).

### Data Model

See [data-model.md](./data-model.md) — to be generated.

Key entities unchanged by this feature:
- `Word.pictureAsset: string` — path like `/assets/images/{word}.webp`
- No schema changes needed; this plan patches existing JSON data and adds image files

### Script Contract

`scripts/generate-vocab-images.ts`:
```
Input:  src/data/yle-starters/*.json
        scripts/lib/emoji-map.ts  (word → emoji codepoint)
Output: public/assets/images/{word}.webp  (400×400 WebP ≤ 20 KB)
        src/data/yle-starters/*.json  (patches pictureAsset for new words only)

Process per word:
  1. Look up emoji codepoint in emoji-map.ts
  2a. If emoji available: fetch Noto Emoji SVG → render on colored bg → WebP
  2b. If AI fallback word: call fal.ai Flux → download PNG → convert → WebP
  3. Patch JSON if pictureAsset was empty

Flags:
  --dry-run    list all 174 targets without generating
  --set=NAME   restrict to one word set
  --force      re-generate all (including existing 68 real photos)
  --missing    only generate words where pictureAsset is empty
```

### Agent Context Update

<!-- SPECKIT START -->
Active plan: `specs/001-vocab-learning/plan.md`
<!-- SPECKIT END -->

---

## Implementation Phases (for /speckit-tasks)

| Phase | Description | Deliverables |
|-------|-------------|--------------|
| 1 | ✅ Research & tool selection | research.md (emoji approach chosen) |
| 2 | Build emoji map + script | `scripts/lib/emoji-map.ts` + `generate-vocab-images.ts` (dry-run works) |
| 3 | Generate all 174 images | 174 WebP files in `public/assets/images/` (overwrites existing 68) |
| 4 | Patch JSON data files | 14 JSON files: `pictureAsset` filled for 106 new words |
| 5 | Verify in app | Run dev server, visual check all 14 word sets |

---

## Complexity Tracking

*No constitution violations requiring justification.*
