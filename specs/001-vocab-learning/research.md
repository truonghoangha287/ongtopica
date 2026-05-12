# Research: Vocabulary Learning — Tech Decisions

**Date**: 2026-05-10 | **Plan**: [plan.md](plan.md)

## Framework

**Decision**: Vite + React 18 + TypeScript  
**Rationale**: Fastest dev loop, smallest production bundle, native TypeScript support, and first-class
PWA support via `vite-plugin-pwa` (Workbox integration). The existing `package.json` is a Node.js
skeleton — Vite replaces it cleanly.  
**Alternatives rejected**: Next.js (SSR/SSG overhead unneeded for offline PWA), CRA (deprecated, slower builds).

## Offline Storage

**Decision**: Dexie.js (IndexedDB wrapper)  
**Rationale**: Transactional writes with typed tables, zero UI jank on rapid session updates, scales to
1000+ word-progress records, and native TypeScript generics. Composite indexes (`[childId+stage]`) support
the session composer's priority queries efficiently.  
**Alternatives rejected**: localStorage (no transactions, 5MB limit, synchronous), SQLite WASM (large
bundle, overkill for this schema).

## Audio

**Decision**: Howler.js  
**Rationale**: Service-worker-compatible, handles offline fallback gracefully, supports sprite sheets
for reduced HTTP requests, ~8KB gzipped. Pairs cleanly with Workbox pre-caching of MP3 assets.  
**Alternatives rejected**: Web Audio API directly (too verbose; no built-in fallback logic),
use-sound (thin wrapper — adds dependency without benefit over a custom `useAudio` hook on Howler).

## Service Worker / Offline

**Decision**: Workbox via `vite-plugin-pwa`  
**Rationale**: Auto-generates cache manifests with content hashing, handles stale-while-revalidate
patterns, and pre-caches all bundled audio + image assets declared in the Vite asset manifest.
Manual service worker would be 200+ lines of error-prone boilerplate.  
**Alternatives rejected**: Manual SW (maintenance burden), no SW (violates FR-014 / Constitution V).

## Drag-and-Drop (Unscramble activity)

**Decision**: `@dnd-kit/core` v9+  
**Rationale**: Headless, touch-first, actively maintained (2024), TypeScript-native, zero DOM
mutation jank. Configurable sensors handle imprecise 6-year-old touch gestures. Snap-to-grid
alignment baked in via `rectSortingStrategy`.  
**UX pattern**: Primary = tap-to-select + tap-to-place (more reliable for young children than drag);
drag-and-drop as secondary. 48px+ tile hit targets enforced via CSS.  
**Alternatives rejected**: react-beautiful-dnd (archived, poor touch story), react-dnd (requires
HTML5 drag polyfill, not touch-native).

## Animation

**Decision**: Framer Motion (mascot reactions + screen transitions) + CSS transitions (tile snaps)  
**Rationale**: Framer Motion runs on its own compositor thread — zero layout shifts (CLS=0),
60fps guaranteed for mascot bounces and screen fades. CSS transitions for tile snap are the fastest
path with no JS overhead. Total bundle addition ~35KB (tree-shakeable).  
**Alternatives rejected**: React Spring (more complex API, similar bundle); CSS-only (insufficient
for mascot state-machine reactions).

## Celebration Effects

**Decision**: `canvas-confetti` wrapped in a `<CelebrationEffect>` component  
**Rationale**: Canvas-based — zero DOM nodes added, zero CLS risk, 8KB, fires and forgets.
Used only on correct-answer events.  
**Alternatives rejected**: `react-confetti` (DOM-based particle divs, CLS risk).

## State Management

**Decision**: Zustand  
**Rationale**: ~20 lines per store, native `persist` middleware syncs to IndexedDB via Dexie,
no provider wrapper required, direct hook consumption fits <200 line file constraint. Two stores:
`session-store` (active session + retry state) and `profile-store` (active child profile).  
**Alternatives rejected**: Redux Toolkit (ceremony overkill for simple session state), React Context
(re-render cost; no built-in persistence), Jotai (atom granularity unneeded here).

## Session Composer Architecture

**Decision**: Pure function service + hook wrapper  
**Rationale**: `session-composer.ts` is a pure function (word-progress array in → sorted 10-word
session out) — unit-testable with zero mocks. `useSessionComposer()` hook fetches from Dexie,
calls the pure function, returns the session. Decoupling satisfies Constitution Principle VII.  
**Algorithm**: Select highest-priority words first (by `priorityScore` DESC), filtered by eligibility
(stage-appropriate); fill remaining slots with next unstarted Stage 1 words from same WordSet.

## i18n

**Decision**: react-i18next  
**Rationale**: Minimal setup for single language, extensible to multiple locales without code changes,
zero runtime cost when monolingual. Locale files live in `src/locales/en/vocab.json`. Satisfies
Constitution requirement: no hardcoded UI strings from day one.  
**Alternatives rejected**: Hardcoded strings (prohibited by constitution), custom solution (YAGNI).

## Testing

**Decision**: Vitest + React Testing Library + axe-core  
**Rationale**: Vitest is native to Vite — same config, same transforms, no Jest/Babel friction.
RTL for integration tests (user-event interactions). axe-core via `jest-axe` (vitest-axe adapter)
for automated accessibility assertions on every screen.  
**Alternatives rejected**: Jest (requires separate Babel config with Vite; friction per build).

## Unresolved Questions

None. All NEEDS CLARIFICATION items resolved by research.
