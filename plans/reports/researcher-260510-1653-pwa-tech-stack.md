# PWA Tech Stack Research: Children's Vocabulary Learning App

**Report Date**: 2026-05-10 | **Scope**: Framework, offline storage, audio, service workers, i18n, testing

## Executive Summary

Recommendations prioritize **offline-first reliability**, **minimal dependencies** (per YAGNI), and **proven production patterns**. This PWA requires offline mastery — the constitution mandates 100% offline functionality post-first-load. Stack balances simplicity against feature requirements for a 6-year-old demographic.

---

## 1. Framework Decision: Vite + React + TypeScript

**Decision**: Use **Vite + React 18 + TypeScript** (not CRA, not Next.js).

**Rationale**:
- **Vite**: Fastest cold start (50-100ms vs CRA's 500ms+), native ES modules, instant HMR. Reduces developer friction in early iterations. Smaller bundle (React alone ≈ 40KB gzipped with Vite vs 60KB+ with CRA).
- **React 18**: Production-stable, suspend/error boundary support for activity loading states. Smaller mental overhead than Next.js Server Components for this offline context (no fetch-on-server patterns needed).
- **TypeScript**: Progression logic is high-stakes (Constitution Principle III — mastery decisions untested = invisible bugs). Types catch incorrect data shapes in scoring/advancement.
- **Reject CRA**: Slower dev loop, locked dependency versions, `react-scripts` opaque bundling. Wrong tool for a greenfield PWA.
- **Reject Next.js**: Adds SSR/ISR/API routes — all unnecessary for this offline client app. Complicates service worker setup (Next.js and SW interact awkwardly). Next.js shines for content-heavy apps; this is a game engine.

**Sizing**: React bundle ≈ 40KB gzipped, app code ≈ 50KB (activities, components, logic), assets (images, audio, i18n) dominate the size budget. React is negligible in this equation.

---

## 2. Offline Data Storage: IndexedDB + Dexie.js

**Decision**: **Dexie.js** (IndexedDB wrapper) for child profiles, word progress, session history.

**Rationale**:
- **localStorage** (5–10MB limit): Sufficient for single-child profile + word progress. **BUT** serializing/deserializing large JSON on every read/write causes jank on older tablets. Not suitable for session-by-session progress updates.
- **IndexedDB** (50MB–1GB): True database semantics, transactional writes, indexing. Dexie.js eliminates boilerplate callback hell. Perfect for: child profiles (avatar data), WordProgress (stage, consecutive-correct, priority score per word per child), session history (for teacher dashboard).
- **SQLite WASM**: Heavier (~500KB+), overkill complexity. No relational queries needed; simple key-value indexing suffices.

**Data Schema**:
```
ChildProfile { id, name, avatarUrl, createdAt }
WordProgress { id, childId, wordId, stage (1-4), consecutiveCorrect, totalIncorrect, priorityScore, lastReviewedAt }
SessionRecord { id, childId, sessionId, wordSetId, completedAt, wordOutcomes: [{wordId, stageAtPlay, wasCorrect}] }
```

**Setup Cost**: Dexie initialization ≈ 15 lines of code.

---

## 3. Audio in PWA: Howler.js

**Decision**: **Howler.js** for audio playback with offline pre-caching.

**Rationale**:
- **Howler.js**: Cross-browser audio context pooling, fallback to HTML5 Audio, no dependencies. Works with service worker pre-cached files (loads audio from cache). Plugin ecosystem for rate adjustment (useful for slow learners). ~8KB gzipped. Battle-tested in educational games.
- **Web Audio API directly**: Low-level, requires manual context management, error handling, and loader state. Adds ≈ 100+ lines of glue code. Unnecessary complexity (KISS violation).
- **use-sound**: React hook wrapper over Howler. Small add (≈ 3KB). Useful only if audio state becomes shared across many components — not the case here (each activity manages its own audio independently).

**Integration with Service Worker**: Howler loads files from cache via Cache API. Service worker pre-caches all audio during install phase. No special glue needed.

---

## 4. Service Worker + Asset Pre-Caching: Workbox

**Decision**: **Workbox** (Webpack integration via `vite-plugin-workbox`).

**Rationale**:
- **Workbox**: Google's proven PWA toolkit. Handles cache versioning, stale-while-revalidate patterns, pre-cache manifest generation. Automatic asset fingerprinting (cache busting). Integration with Vite via community plugin `vite-plugin-workbox`.
- **Manual Service Worker**: 200+ lines of error-prone code. Cache versioning, cleanup, asset listing — all must be hand-managed. Not maintainable as app grows.
- **Offline Strategy**: Pre-cache all images, audio, app bundle on first visit. Service Worker skip waiting + claim (immediate activation). Session never hits network for learned content.

**Pre-Cache Configuration**:
```
Vite build output → dist/
   ├── index.html
   ├── app.js, vendor.js (React, Dexie, Howler, i18n)
   ├── assets/images/ (all word pictures)
   └── assets/audio/ (all pronunciation MP3s)

Workbox manifest auto-generated from dist/.
Pre-cache size: Images ≈ 5–10MB (depends on asset count), Audio ≈ 20–50MB (depends on word count).
```

**Pre-Cache Manifest**: Workbox auto-generates manifest. On install, all files downloaded. On first offline access, served from cache.

---

## 5. i18n Setup: react-i18next

**Decision**: **react-i18next** (minimal setup, even for single language).

**Rationale**:
- **react-i18next**: Standard in React. Namespace splitting, lazy loading, fallback language chains. Setup overhead ≈ 5 minutes (Config + Provider). Small bundle ≈ 5KB.
- **Constitutional requirement** (Principle VI): i18n architecture in place day one. No hardcoded strings. Easier to add languages later without code changes.
- **Single-Language Caveat**: Set up i18next with single `en-US` namespace (e.g., `locales/en-US/common.json`) but design folder structure for easy expansion (locale subdirs, namespaces per feature). Zero runtime cost if only one language shipped.

**Folder Structure**:
```
src/
  └── locales/
      ├── en-US/
      │   ├── common.json (UI buttons, labels)
      │   ├── activities.json (Introduce, Recognize, Unscramble, Fill-in-blank prompts)
      │   └── wordsets.json (Word set names, theme descriptions)
      └── [future: es-ES, fr-FR, ...]
```

**Key Insights**: All UI strings must be keys from day one (no `<button>Play</button>` → all become `<button>{t('activities.play')}</button>`). Prevents translation debt accumulation.

---

## 6. Testing Stack: Vitest + React Testing Library + axe-core

**Decision**: **Vitest** (not Jest) + **React Testing Library** + **axe-core**.

**Rationale**:
- **Vitest** (not Jest): Native ES modules, Vite integration, faster startup (important for rapid iteration). Jest works but requires Babel transpilation layer. Vitest auto-detects Vite config. Vitest ≈ same API as Jest (minimal migration cost).
- **React Testing Library**: Query by role/label (encourages accessible component design). Avoids implementation-detail testing (enzyme-style). Tests that verify accessibility requirements double as automation.
- **axe-core**: Automated WCAG scanning. Integrate into component tests: `expect(await axe(container)).toHaveNoViolations()`. Catches color contrast, label/role, keyboard nav issues before review.

**Test Strategy**:
- **Unit**: Progression logic (WordProgress advancement, priority scoring, session composition). Logic-heavy, 100% coverage target.
- **Integration**: Full activity play-through (Introduce → Recognize → etc.), session completion, profile switching. Verify persistence to Dexie.
- **Accessibility**: axe-core on every new screen (render component → axe scan in test). WCAG AA baseline.

**Example Test**:
```typescript
describe('Progression Logic', () => {
  it('advances word stage after MASTERY_THRESHOLD correct answers', () => {
    const progress = new WordProgress({ stage: 1, consecutiveCorrect: 0 });
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      progress.recordCorrectAnswer();
    }
    expect(progress.stage).toBe(2);
  });

  it('resets consecutive correct counter on incorrect answer', () => {
    const progress = new WordProgress({ stage: 1, consecutiveCorrect: 2 });
    progress.recordIncorrectAnswer();
    expect(progress.consecutiveCorrect).toBe(0);
  });
});
```

**Coverage Target**: Progression logic 100%, UI components 70–80% (Vitest + RTL sufficient for integration coverage).

---

## Summary Table

| Decision | Choice | Key Reason |
|----------|--------|-----------|
| **Framework** | Vite + React 18 + TypeScript | Fastest dev loop, minimal bundle, type safety for high-stakes logic |
| **Offline Data** | Dexie.js (IndexedDB) | Transactional, scalable, zero jank on updates |
| **Audio** | Howler.js | Service-worker-friendly, minimal code, proven in games |
| **Service Worker** | Workbox | Auto cache versioning, stale-while-revalidate, asset manifest generation |
| **i18n** | react-i18next | Standard, minimal setup, extensible from day one |
| **Testing** | Vitest + RTL + axe-core | Fast, accessibility-first testing, 100% coverage on progression |

---

## Unresolved Questions

None — all decisions scoped and rationalized.

## Next Steps

1. Initialize Vite project with TypeScript template.
2. Install Dexie, Howler, react-i18next, Workbox plugin, axe-core.
3. Set up i18n folder structure with first locale file.
4. Create service worker config in vite.config.ts.
5. Delegate to planner for implementation roadmap (phases for activities, progression engine, profile system).
