# Quickstart: Vocabulary Learning Feature

**Date**: 2026-05-10 | **Plan**: [plan.md](plan.md)

## Prerequisites

- Node.js 20+
- pnpm 9+ (preferred) or npm 10+

## Setup

```bash
# Install dependencies (first time or after package changes)
pnpm install

# Start dev server
pnpm dev
# → http://localhost:5173
```

## Key Commands

```bash
pnpm dev          # dev server with HMR
pnpm build        # production build (outputs to dist/)
pnpm preview      # preview production build locally
pnpm test         # run all tests (Vitest)
pnpm test:unit    # unit tests only (session-composer, priority-scorer)
pnpm test:int     # integration tests (activity play-throughs)
pnpm test:a11y    # accessibility tests (axe-core on all screens)
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
```

## Project Conventions

- **Files**: kebab-case for all files; <200 lines each; split when exceeded
- **Components**: PascalCase component names, one component per file
- **Constants**: All game parameters in `src/shared/constants/game-constants.ts`
- **i18n**: All UI strings via `t('vocab.<key>')` — no hardcoded strings in JSX
- **DB**: All Dexie access goes through hooks in `src/english/vocab/hooks/` or `src/shared/`
- **No business logic in pages**: `src/pages/` are thin routing shells only

## Adding a New Word Set

1. Create `src/data/yle-starters/{set-name}.json` following `Word[]` schema in [data-model.md](data-model.md)
2. Add display name key to `src/locales/en/vocab.json` under `wordSets`
3. Register the set in `src/data/yle-starters/index.ts`
4. Add picture assets to `public/assets/images/` and audio to `public/assets/audio/`
5. Verify Workbox pre-cache manifest picks up new assets: `pnpm build && pnpm preview`

## Adding a New Locale

1. Copy `src/locales/en/vocab.json` to `src/locales/{lang}/vocab.json`
2. Translate all values (do not change keys)
3. Register the locale in `src/i18n.ts`
4. Test: `pnpm test:a11y` (all screens should still pass axe-core)

## Offline Testing

```bash
pnpm build && pnpm preview
# Open Chrome DevTools → Application → Service Workers → Offline checkbox
# All activities must remain fully operable
```

## Tech Stack Reference

| Concern | Library | Docs |
|---------|---------|------|
| Build | Vite + vite-plugin-pwa | vite.dev |
| UI | React 18 + TypeScript | react.dev |
| State | Zustand | zustand docs |
| Storage | Dexie.js | dexie.org |
| Audio | Howler.js | howlerjs.com |
| Drag-and-drop | @dnd-kit/core | dndkit.com |
| Animation | Framer Motion | framer.com/motion |
| Confetti | canvas-confetti | npm canvas-confetti |
| i18n | react-i18next | react.i18next.com |
| Tests | Vitest + RTL | vitest.dev |
| A11y tests | axe-core / vitest-axe | deque.com/axe |
