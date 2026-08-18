# Word Game Hearts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional hearts (lives) mode to the four answerable vocab session activities — a grown-up turns it on in Settings, a failed word costs a heart, running out ends the round on a friendly screen.

**Architecture:** A pure `hearts-settings` module owns the `localStorage` key. The Zustand session store holds `heartsMax` / `heartsRemaining` and is seeded by `useSession` at session start, so the store never reads `localStorage`. `SessionPlayer` is the single place hearts are spent — it already funnels every activity outcome through one `callbacks` object — and it renders `HeartRow` plus an `OutOfHeartsScreen` branch. Only `UnscrambleActivity` learns anything new: an optional `onShatter` callback, because a shatter is its only fail signal.

**Tech Stack:** TypeScript 5.8, React 18.3, Vite 6, Zustand 5, framer-motion 12, Dexie 4, react-i18next 15, Vitest 3 + Testing Library + vitest-axe. No new dependencies.

## Global Constraints

- Scope is `src/english/vocab` + `src/pages/SettingsPage.tsx` + `src/shared/constants/game-constants.ts` + `src/locales/en/vocab.json`. Memory Match, grammar, math, Reading & Writing, `session-composer`, `useWordProgress` and the Dexie schema are **untouched**. No migration.
- No new dependencies.
- Default is **Off**. With hearts off, no new code path runs and no new element renders.
- `localStorage` key is exactly `heartsMode`, values exactly `"off" | "3" | "5"`.
- Heart counts come from `HEARTS_CHOICES = [3, 5]` in `src/shared/constants/game-constants.ts`. No magic numbers anywhere else (Constitution VI).
- Imports use the `@/` alias (`@` → `./src`), matching every existing file.
- Every interactive control on a session screen keeps a **56 px** minimum touch target; Settings controls keep 44 px like the existing Settings buttons (Constitution I/II).
- Any motion added must gate on `useReducedMotion()` from framer-motion, as `answer-feedback.tsx` does (Constitution II).
- New files stay under 200 lines (Constitution VI).
- Test commands: `npm run test:unit`, `npm run test:int`, `npm run test:a11y`, `npm run typecheck`, `npm run lint`.
- Commit style is Conventional Commits with a scope, matching git history: `feat(vocab): …`, `test(vocab): …`.

## File Structure

| File | Responsibility |
|---|---|
| `src/shared/constants/game-constants.ts` *(modify)* | `HEARTS_CHOICES`, `SHATTER_ANIM_MS`. |
| `src/english/vocab/services/hearts-settings.ts` *(new)* | The only code that touches `localStorage.heartsMode`. Pure, no React. |
| `src/english/vocab/store/session-store.ts` *(modify)* | Holds `heartsMax` / `heartsRemaining`; `loseHeart()`; `restart()` reseeds. |
| `src/english/vocab/hooks/useSession.ts` *(modify)* | Reads the setting once, at session start, and passes the count to `setSession`. |
| `src/english/vocab/components/heart-row.tsx` *(new)* | Visual primitive: full/spent hearts + a polite live announcement. |
| `src/english/vocab/components/OutOfHeartsScreen.tsx` *(new)* | End screen with Try again / Go home. |
| `src/english/vocab/types/vocab.types.ts` *(modify)* | `ActivityCallbacks.onShatter?`. |
| `src/english/vocab/components/activities/UnscrambleActivity.tsx` *(modify)* | Fires `onShatter` on a shatter (not on an empty-board tile shake). |
| `src/english/vocab/components/SessionPlayer.tsx` *(modify)* | Spends hearts, renders the heart row, owns the `outOfHearts` branch. |
| `src/pages/SettingsPage.tsx` *(modify)* | Off / 3 ❤️ / 5 ❤️ radiogroup, behind the existing math gate. |
| `src/locales/en/vocab.json` *(modify)* | `session.outOfHearts*`, `session.tryAgain`, `session.goHome`, `settings.hearts*`. |

Tests: `tests/unit/hearts-settings.test.ts`, `tests/unit/session-store.hearts.test.ts`, `tests/unit/heart-row.test.tsx`, `tests/integration/hearts-session.test.tsx`, `tests/integration/settings-hearts.test.tsx`, `tests/a11y/out-of-hearts-screen.test.tsx`, plus additions to the existing `tests/integration/unscramble-activity.test.tsx`.

---

### Task 1: Hearts settings module

The pure module that owns the `localStorage` key, plus the constant every other task imports. Nothing renders yet.

**Files:**
- Modify: `src/shared/constants/game-constants.ts` (append at end of file)
- Create: `src/english/vocab/services/hearts-settings.ts`
- Test: `tests/unit/hearts-settings.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `HEARTS_CHOICES: readonly [3, 5]`
  - `type HeartsChoice = 3 | 5`
  - `type HeartsMode = 'off' | '3' | '5'`
  - `type HeartsCount = 0 | 3 | 5`
  - `readHeartsMode(): HeartsMode`
  - `writeHeartsMode(mode: HeartsMode): void`
  - `heartsCountFor(mode: HeartsMode): HeartsCount`

- [ ] **Step 1: Add the constant**

Append to `src/shared/constants/game-constants.ts`:

```ts
// Optional hearts mode: the heart counts a grown-up can pick in Settings.
export const HEARTS_CHOICES = [3, 5] as const;
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/hearts-settings.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  readHeartsMode,
  writeHeartsMode,
  heartsCountFor,
} from '@/english/vocab/services/hearts-settings';

describe('hearts-settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "off" when the key was never written', () => {
    expect(readHeartsMode()).toBe('off');
  });

  it('round-trips every mode', () => {
    writeHeartsMode('3');
    expect(readHeartsMode()).toBe('3');
    writeHeartsMode('5');
    expect(readHeartsMode()).toBe('5');
    writeHeartsMode('off');
    expect(readHeartsMode()).toBe('off');
  });

  it('writes the raw value under the "heartsMode" key', () => {
    writeHeartsMode('5');
    expect(localStorage.getItem('heartsMode')).toBe('5');
  });

  it('returns "off" for a corrupt stored value', () => {
    localStorage.setItem('heartsMode', '7');
    expect(readHeartsMode()).toBe('off');
    localStorage.setItem('heartsMode', 'yes please');
    expect(readHeartsMode()).toBe('off');
  });

  it('returns "off" when localStorage throws (private browsing)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    expect(readHeartsMode()).toBe('off');
  });

  it('does not throw when localStorage write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeHeartsMode('3')).not.toThrow();
  });

  it('maps modes to session heart counts', () => {
    expect(heartsCountFor('off')).toBe(0);
    expect(heartsCountFor('3')).toBe(3);
    expect(heartsCountFor('5')).toBe(5);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run tests/unit/hearts-settings.test.ts
```

Expected: FAIL — `Failed to resolve import "@/english/vocab/services/hearts-settings"`.

- [ ] **Step 4: Write the implementation**

Create `src/english/vocab/services/hearts-settings.ts`:

```ts
import { HEARTS_CHOICES } from '@/shared/constants/game-constants';

/**
 * The optional hearts (lives) setting. This module is the only place that
 * touches `localStorage.heartsMode`, so every failure mode — unset key, corrupt
 * value, private browsing — degrades to "off", i.e. the game we shipped before.
 */

/** A heart count a grown-up can pick: 3 or 5. */
export type HeartsChoice = (typeof HEARTS_CHOICES)[number];
/** What is stored: "off" | "3" | "5". */
export type HeartsMode = 'off' | `${HeartsChoice}`;
/** Hearts a session starts with. 0 means hearts are off. */
export type HeartsCount = 0 | HeartsChoice;

const STORAGE_KEY = 'heartsMode';
const VALID_COUNTS: readonly string[] = HEARTS_CHOICES.map(String);

export function readHeartsMode(): HeartsMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null && VALID_COUNTS.includes(raw)) return raw as HeartsMode;
  } catch {
    // Private browsing can throw on read — fall through to "off".
  }
  return 'off';
}

export function writeHeartsMode(mode: HeartsMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Nothing to do: hearts are optional, and the caller keeps the value in
    // component state for this session.
  }
}

export function heartsCountFor(mode: HeartsMode): HeartsCount {
  return mode === 'off' ? 0 : (Number(mode) as HeartsChoice);
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/unit/hearts-settings.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/shared/constants/game-constants.ts src/english/vocab/services/hearts-settings.ts tests/unit/hearts-settings.test.ts && git commit -m "feat(vocab): add hearts-mode setting module"
```

---

### Task 2: Hearts state in the session store

The store gains the two counts and `loseHeart()`. `setSession` takes the count as an argument so the store never reads `localStorage`; `useSession` supplies it.

**Files:**
- Modify: `src/english/vocab/store/session-store.ts` (whole file)
- Modify: `src/english/vocab/hooks/useSession.ts:54` and `:79`
- Test: `tests/unit/session-store.hearts.test.ts`

**Interfaces:**
- Consumes: `readHeartsMode()`, `heartsCountFor()` from Task 1.
- Produces on `useSessionStore`:
  - `heartsMax: number`, `heartsRemaining: number`
  - `setSession(session: Session, heartsMax: number): void` — **signature change**
  - `loseHeart(): void`
  - `restart(): void` — now also reseeds `heartsRemaining` to `heartsMax`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/session-store.hearts.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/english/vocab/store/session-store';
import type { Session } from '@/english/vocab/types/vocab.types';

const session: Session = {
  id: 's1',
  wordSetId: 'animals',
  items: [],
  createdAt: 0,
};

describe('session-store hearts', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it('setSession seeds both heart counts', () => {
    useSessionStore.getState().setSession(session, 3);
    expect(useSessionStore.getState().heartsMax).toBe(3);
    expect(useSessionStore.getState().heartsRemaining).toBe(3);
  });

  it('loseHeart decrements remaining and leaves max alone', () => {
    useSessionStore.getState().setSession(session, 5);
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(4);
    expect(useSessionStore.getState().heartsMax).toBe(5);
  });

  it('loseHeart floors at 0', () => {
    useSessionStore.getState().setSession(session, 1);
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
  });

  it('loseHeart is a no-op when hearts are off', () => {
    useSessionStore.getState().setSession(session, 0);
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
    expect(useSessionStore.getState().heartsMax).toBe(0);
  });

  it('restart reseeds hearts to full and returns to the first item', () => {
    useSessionStore.getState().setSession(session, 3);
    useSessionStore.getState().advance();
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().restart();
    expect(useSessionStore.getState().heartsRemaining).toBe(3);
    expect(useSessionStore.getState().currentIndex).toBe(0);
    expect(useSessionStore.getState().retryCount).toBe(0);
  });

  it('clearSession clears hearts too', () => {
    useSessionStore.getState().setSession(session, 5);
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().heartsMax).toBe(0);
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
    expect(useSessionStore.getState().session).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/session-store.hearts.test.ts
```

Expected: FAIL — `Expected 1 arguments, but got 2` at typecheck / `heartsMax` is `undefined` at runtime.

- [ ] **Step 3: Rewrite the store**

Replace the whole of `src/english/vocab/store/session-store.ts` with:

```ts
import { create } from 'zustand';
import type { Session } from '@/english/vocab/types/vocab.types';

interface SessionState {
  session: Session | null;
  currentIndex: number;
  retryCount: number;
  /** Hearts this session started with. 0 means hearts mode is off. */
  heartsMax: number;
  heartsRemaining: number;
  setSession: (session: Session, heartsMax: number) => void;
  advance: () => void;
  incrementRetry: () => void;
  loseHeart: () => void;
  restart: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  currentIndex: 0,
  retryCount: 0,
  heartsMax: 0,
  heartsRemaining: 0,
  // The caller passes the heart count so the store stays free of localStorage.
  setSession: (session, heartsMax) =>
    set({ session, currentIndex: 0, retryCount: 0, heartsMax, heartsRemaining: heartsMax }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, retryCount: 0 })),
  incrementRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),
  loseHeart: () =>
    set((s) => (s.heartsMax === 0 ? {} : { heartsRemaining: Math.max(0, s.heartsRemaining - 1) })),
  restart: () => set((s) => ({ currentIndex: 0, retryCount: 0, heartsRemaining: s.heartsMax })),
  clearSession: () =>
    set({ session: null, currentIndex: 0, retryCount: 0, heartsMax: 0, heartsRemaining: 0 }),
}));
```

- [ ] **Step 4: Update both `setSession` call sites**

In `src/english/vocab/hooks/useSession.ts`, add the import below the existing `SESSION_WORD_COUNT` import:

```ts
import { readHeartsMode, heartsCountFor } from '@/english/vocab/services/hearts-settings';
```

Then replace **both** occurrences of `setSession(session);` (line 54 in `compose`, line 79 in `composeListenMatch`) with:

```ts
      // Read the hearts setting once, here. Changing it mid-session does not
      // mutate a game in flight; it applies to the next one.
      setSession(session, heartsCountFor(readHeartsMode()));
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/unit/session-store.hearts.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Verify nothing else called `setSession`**

```bash
grep -rn "setSession(" src tests
```

Expected: exactly three hits — the definition in `session-store.ts` and the two call sites in `useSession.ts` (plus the new unit test's calls, which already pass two arguments).

- [ ] **Step 7: Run the full suite and typecheck**

```bash
npm run typecheck && npm test
```

Expected: typecheck silent; all existing tests still pass.

- [ ] **Step 8: Commit**

```bash
git add src/english/vocab/store/session-store.ts src/english/vocab/hooks/useSession.ts tests/unit/session-store.hearts.test.ts && git commit -m "feat(vocab): hold hearts state in the session store"
```

---

### Task 3: HeartRow component

A stateless visual primitive, mirroring `star-row.tsx`. It renders nothing when hearts are off, so callers never need a guard of their own.

**Note on accessibility:** the design doc describes the row as carrying "the label `2 of 3 hearts left`". It is implemented as **visually hidden text inside the live region** rather than an `aria-label`, because screen readers announce a live region's *content* when it changes — an `aria-label` that changes is not reliably announced, so the row would be silent exactly when it matters. This is the same off-screen-announcement pattern `UnscrambleActivity` already uses.

**Files:**
- Create: `src/english/vocab/components/heart-row.tsx`
- Test: `tests/unit/heart-row.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `HeartRow({ remaining, max }: { remaining: number; max: number })` — renders `null` when `max <= 0`; otherwise a `role="status"` element with `data-testid="heart-row"` whose text contains `"{remaining} of {max} hearts left"` and `max` glyphs (`❤️` full, `🤍` spent).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/heart-row.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeartRow } from '@/english/vocab/components/heart-row';

describe('HeartRow', () => {
  it('renders nothing when hearts are off', () => {
    const { container } = render(<HeartRow remaining={0} max={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces how many hearts are left', () => {
    render(<HeartRow remaining={2} max={3} />);
    expect(screen.getByTestId('heart-row')).toHaveTextContent('2 of 3 hearts left');
  });

  it('is a polite live region so a lost heart is announced', () => {
    render(<HeartRow remaining={2} max={3} />);
    const row = screen.getByTestId('heart-row');
    expect(row.getAttribute('role')).toBe('status');
    expect(row.getAttribute('aria-live')).toBe('polite');
  });

  it('renders one glyph per heart, spent ones greyed', () => {
    render(<HeartRow remaining={2} max={5} />);
    const glyphs = Array.from(
      screen.getByTestId('heart-row').querySelectorAll('[aria-hidden="true"]'),
    ).map((el) => el.textContent);
    expect(glyphs.filter((g) => g === '❤️').length).toBe(2);
    expect(glyphs.filter((g) => g === '🤍').length).toBe(3);
  });

  it('renders every heart full at the start of a session', () => {
    render(<HeartRow remaining={3} max={3} />);
    const glyphs = Array.from(
      screen.getByTestId('heart-row').querySelectorAll('[aria-hidden="true"]'),
    ).map((el) => el.textContent);
    expect(glyphs).toEqual(['❤️', '❤️', '❤️']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/heart-row.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/english/vocab/components/heart-row"`.

- [ ] **Step 3: Write the implementation**

Create `src/english/vocab/components/heart-row.tsx`:

```tsx
import { motion, useReducedMotion } from 'framer-motion';

interface HeartRowProps {
  /** Hearts left in the current session. */
  remaining: number;
  /** Hearts the session started with. 0 = hearts mode is off. */
  max: number;
}

const FULL = '❤️';
const SPENT = '🤍';

/**
 * Renders the hearts left in a session. Nothing renders when hearts are off,
 * so callers do not need their own guard.
 *
 * The count is spoken through the live region's own text (visually hidden), not
 * an aria-label — screen readers announce a live region's content when it
 * changes, which is exactly the moment a heart is lost.
 */
export function HeartRow({ remaining, max }: HeartRowProps) {
  const reduce = useReducedMotion();
  if (max <= 0) return null;

  return (
    <div
      data-testid="heart-row"
      role="status"
      aria-live="polite"
      style={{ display: 'inline-flex', gap: 6, lineHeight: 1 }}
    >
      <span style={{ position: 'absolute', left: '-9999px' }}>
        {`${remaining} of ${max} hearts left`}
      </span>
      {Array.from({ length: max }, (_, i) => {
        const spent = i >= remaining;
        // Hearts are spent right-to-left, so index === remaining is the one
        // just lost — pop it once, unless the child asked for less motion.
        const justLost = spent && i === remaining && !reduce;
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            animate={justLost ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            style={{ fontSize: '1.5rem', opacity: spent ? 0.55 : 1 }}
          >
            {spent ? SPENT : FULL}
          </motion.span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/heart-row.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/vocab/components/heart-row.tsx tests/unit/heart-row.test.tsx && git commit -m "feat(vocab): add heart row primitive"
```

---

### Task 4: Out-of-hearts screen and its copy

The end screen, parallel to `CelebrationScreen.tsx`: same layout, `encourage` mascot, no confetti.

**Files:**
- Modify: `src/locales/en/vocab.json` (`session` and `settings` objects)
- Create: `src/english/vocab/components/OutOfHeartsScreen.tsx`
- Test: `tests/a11y/out-of-hearts-screen.test.tsx`

**Interfaces:**
- Consumes: `HeartRow` (Task 3) — only in the a11y test.
- Produces: `OutOfHeartsScreen({ onTryAgain, onGoHome }: { onTryAgain: () => void; onGoHome: () => void })`.
- Produces translation keys: `session.outOfHearts`, `session.outOfHeartsBody`, `session.tryAgain`, `session.goHome`, `settings.heartsLabel`, `settings.heartsHint`, `settings.heartsOff`, `settings.heartsOption`.

- [ ] **Step 1: Add the copy**

In `src/locales/en/vocab.json`, add four keys to the existing `"session"` object (after `"completedBadge"`):

```json
    "outOfHearts": "Out of hearts!",
    "outOfHeartsBody": "Your stars are safe. Want another go?",
    "tryAgain": "Try again",
    "goHome": "Go home"
```

And four keys to the existing `"settings"` object (after `"gateButton"`) — Task 7 uses the last four:

```json
    "heartsLabel": "Challenge hearts",
    "heartsHint": "Off by default. With hearts on, a missed word costs a heart and the round ends when they run out.",
    "heartsOff": "Off",
    "heartsOption": "{{n}} ❤️"
```

Remember to add a comma to the previously-last entry in each object.

- [ ] **Step 2: Write the failing test**

Create `tests/a11y/out-of-hearts-screen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { OutOfHeartsScreen } from '@/english/vocab/components/OutOfHeartsScreen';
import { HeartRow } from '@/english/vocab/components/heart-row';

function wrap(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('A11y: OutOfHeartsScreen', () => {
  it('has no axe violations', async () => {
    const { container } = wrap(
      <OutOfHeartsScreen onTryAgain={vi.fn()} onGoHome={vi.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('offers Try again and Go home, each a 56 px touch target', () => {
    wrap(<OutOfHeartsScreen onTryAgain={vi.fn()} onGoHome={vi.fn()} />);
    for (const name of [/try again/i, /go home/i]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.style.minHeight).toBe('56px');
    }
  });

  it('calls the right handler for each button', () => {
    const onTryAgain = vi.fn();
    const onGoHome = vi.fn();
    wrap(<OutOfHeartsScreen onTryAgain={onTryAgain} onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onTryAgain).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /go home/i }));
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});

describe('A11y: HeartRow', () => {
  it('has no axe violations', async () => {
    const { container } = render(<HeartRow remaining={2} max={3} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run tests/a11y/out-of-hearts-screen.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/english/vocab/components/OutOfHeartsScreen"`.

- [ ] **Step 4: Write the implementation**

Create `src/english/vocab/components/OutOfHeartsScreen.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Mascot } from '@/shared/components/Mascot';

interface OutOfHeartsScreenProps {
  /** Restart the same session from the first item with a fresh heart pool. */
  onTryAgain: () => void;
  onGoHome: () => void;
}

/**
 * Shown when the last heart is spent. Deliberately gentle: no confetti, no
 * score, no "you lost" — every star already earned is kept.
 */
export function OutOfHeartsScreen({ onTryAgain, onGoHome }: OutOfHeartsScreenProps) {
  const { t } = useTranslation('vocab');
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
      <Mascot reaction="encourage" />
      <h2 style={{ fontSize: '2.4rem', margin: 0 }}>{t('session.outOfHearts')}</h2>
      <p style={{ fontSize: '1.1rem', color: 'var(--muted-fg)', margin: 0, maxWidth: 320 }}>
        {t('session.outOfHeartsBody')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, width: '100%', maxWidth: 260 }}>
        <button
          className="btn-primary"
          onClick={onTryAgain}
          style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          🔁 {t('session.tryAgain')}
        </button>
        <button
          className="btn-accent"
          onClick={onGoHome}
          style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          {t('session.goHome')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run tests/a11y/out-of-hearts-screen.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/locales/en/vocab.json src/english/vocab/components/OutOfHeartsScreen.tsx tests/a11y/out-of-hearts-screen.test.tsx && git commit -m "feat(vocab): add out-of-hearts end screen"
```

---

### Task 5: Shatter signal from Unscramble

Unscramble has no reveal and no second-chance counter, so it needs its own fail signal. The callback is optional, so the other three activities and every existing test are untouched.

**Files:**
- Modify: `src/english/vocab/types/vocab.types.ts:25-30`
- Modify: `src/shared/constants/game-constants.ts` (append)
- Modify: `src/english/vocab/components/activities/UnscrambleActivity.tsx:52-64` and `:129`
- Test: `tests/integration/unscramble-activity.test.tsx` (extend)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ActivityCallbacks.onShatter?: () => void` — fired once per shatter (a wrong letter tapped while letters are already placed). **Not** fired for a wrong tap on an empty board.
  - `SHATTER_ANIM_MS = 500` in `game-constants.ts` — how long the shatter animation runs before the board resets. `SessionPlayer` (Task 6) reuses it.

- [ ] **Step 1: Extend the callbacks type**

In `src/english/vocab/types/vocab.types.ts`, replace the `ActivityCallbacks` interface with:

```ts
export interface ActivityCallbacks {
  onCorrect: () => void;
  onIncorrect: () => void;
  onReveal: () => void;
  onAdvance: () => void;
  /**
   * Unscramble only: the placed letters shattered and the word starts over.
   * Optional, because it is the one activity with no reveal to hang a failure on.
   */
  onShatter?: () => void;
}
```

- [ ] **Step 2: Add the animation constant**

Append to `src/shared/constants/game-constants.ts`:

```ts
// How long Unscramble's shatter animation runs before the board resets.
export const SHATTER_ANIM_MS = 500;
```

- [ ] **Step 3: Write the failing tests**

In `tests/integration/unscramble-activity.test.tsx`, replace `makeCallbacks` with:

```tsx
function makeCallbacks() {
  return {
    onCorrect: vi.fn(),
    onIncorrect: vi.fn(),
    onReveal: vi.fn(),
    onAdvance: vi.fn(),
    onShatter: vi.fn(),
  };
}
```

And append these two tests inside the existing `describe('UnscrambleActivity', ...)` block:

```tsx
  it('fires onShatter once when placed letters shatter', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // 't' is wrong for position 2 (expects 'a') → the placed 'c' shatters
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    expect(callbacks.onShatter).toHaveBeenCalledOnce();
    act(() => { vi.runAllTimers(); });
  });

  it('does not fire onShatter for a wrong tap on an empty board', () => {
    const callbacks = makeCallbacks();
    renderWithI18n(<UnscrambleActivity word={word} callbacks={callbacks} />);
    // nothing placed yet — the tile just shakes, and it stays free
    fireEvent.click(screen.getByRole('button', { name: 'letter a' }));
    act(() => { vi.runAllTimers(); });
    expect(callbacks.onShatter).not.toHaveBeenCalled();
  });
```

- [ ] **Step 4: Run the tests to verify they fail**

```bash
npx vitest run tests/integration/unscramble-activity.test.tsx
```

Expected: FAIL on `fires onShatter once when placed letters shatter` — `expected "spy" to be called once, but it was never called`. The empty-board test passes already (vacuously).

- [ ] **Step 5: Fire the callback**

In `src/english/vocab/components/activities/UnscrambleActivity.tsx`, add the constant to the existing import from `game-constants`, or add the import if none exists:

```tsx
import { SHATTER_ANIM_MS } from '@/shared/constants/game-constants';
```

Then, inside `handleTileTap`, replace the shatter branch:

```tsx
      if (placed.some(Boolean)) {
        setBreaking(true);
        setMascotReaction('encourage');
        setAnnounce(t('activities.unscramble.announceBreak'));
        playBreak();
        signalWrong({ silent: true });
        setTimeout(() => {
          setPlaced(Array(letters.length).fill(null));
          setBreaking(false);
          setMascotReaction('idle');
        }, 500);
        return;
      }
```

with:

```tsx
      if (placed.some(Boolean)) {
        setBreaking(true);
        setMascotReaction('encourage');
        setAnnounce(t('activities.unscramble.announceBreak'));
        playBreak();
        signalWrong({ silent: true });
        // Unscramble's only fail state — one heart per shatter, when hearts are on.
        callbacks.onShatter?.();
        setTimeout(() => {
          setPlaced(Array(letters.length).fill(null));
          setBreaking(false);
          setMascotReaction('idle');
        }, SHATTER_ANIM_MS);
        return;
      }
```

Then, on the slot `motion.button`, replace the shatter transition:

```tsx
            transition={{ duration: 0.5, delay: breaking ? i * 0.05 : 0 }}
```

with:

```tsx
            transition={{ duration: SHATTER_ANIM_MS / 1000, delay: breaking ? i * 0.05 : 0 }}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npx vitest run tests/integration/unscramble-activity.test.tsx
```

Expected: PASS, 10 tests.

- [ ] **Step 7: Commit**

```bash
git add src/english/vocab/types/vocab.types.ts src/shared/constants/game-constants.ts src/english/vocab/components/activities/UnscrambleActivity.tsx tests/integration/unscramble-activity.test.tsx && git commit -m "feat(vocab): signal unscramble shatters to the session player"
```

---

### Task 6: Wire hearts into SessionPlayer

The whole feature meets the player here: the heart row renders, hearts are spent, and an exhausted session ends on `OutOfHeartsScreen` instead of falling through to the celebration.

Two ordering rules make or break this task:

1. **Reveal path** — `onReveal` spends the heart, but the swap to the end screen happens in `onAdvance`, after the child has read the revealed answer and tapped Next.
2. **Shatter path** — `onShatter` spends the heart and, if it was the last, sets the flag after `SHATTER_ANIM_MS`, so the break lands on screen first.

And the `outOfHearts` branch is checked **before** `isComplete`, so an exhausted session can never reach the celebration screen.

**Files:**
- Modify: `src/english/vocab/components/SessionPlayer.tsx`
- Test: `tests/integration/hearts-session.test.tsx`

**Interfaces:**
- Consumes: `useSessionStore` `heartsMax` / `heartsRemaining` / `loseHeart` (Task 2), `HeartRow` (Task 3), `OutOfHeartsScreen` (Task 4), `ActivityCallbacks.onShatter` and `SHATTER_ANIM_MS` (Task 5).
- Produces: no new exports. `SessionPlayerProps` is unchanged.

- [ ] **Step 1: Write the failing test file**

Create `tests/integration/hearts-session.test.tsx`:

```tsx
/**
 * Integration test: optional hearts mode inside a real vocab session.
 * Renders SessionPlayer over real Animals words with a real (fake-indexeddb)
 * Dexie, and drives it the way a child would — taps only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { SessionPlayer } from '@/english/vocab/components/SessionPlayer';
import { getWordSet } from '@/data/yle-starters/index';
import type { ActivityType, Session } from '@/english/vocab/types/vocab.types';

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    on: vi.fn(),
  })),
}));

const animals = getWordSet('animals')!;
const wordNamed = (text: string) => animals.words.find((w) => w.text === text)!;

function makeSession(spec: Array<[string, ActivityType]>): Session {
  return {
    id: 'hearts-test-session',
    wordSetId: 'animals',
    items: spec.map(([text, activityType]) => ({ word: wordNamed(text), activityType })),
    createdAt: 0,
    wordSetTotalCount: animals.words.length,
  };
}

/**
 * `heartsMax` is a plain number in the store; Settings only ever offers 3 or 5.
 * Tests that need to run out fast seed 1.
 */
function renderSession(session: Session, heartsMax: number) {
  useSessionStore.getState().setSession(session, heartsMax);
  return render(
    <I18nextProvider i18n={i18n}>
      <SessionPlayer session={session} onSessionComplete={vi.fn()} onExit={vi.fn()} />
    </I18nextProvider>,
  );
}

/** Let real timers (shatter animation, feedback toast) drain inside act(). */
const tick = (ms: number) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

/** Tap a Recognize/Listen-Match option that is NOT the answer. */
function tapWrongPicture(answerText: string) {
  const wrong = screen
    .getAllByRole('img')
    .find((img) => img.getAttribute('alt') !== answerText);
  expect(wrong, 'no wrong option on screen').toBeTruthy();
  fireEvent.click(wrong!.closest('button')!);
}

const heartRow = () => screen.queryByTestId('heart-row');
const nextButton = () => screen.getByRole('button', { name: /next/i });
/** 1-based index of the item on screen, read off the progress dots. */
const itemOnScreen = () =>
  Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

describe('hearts in a vocab session', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    useSessionStore.getState().clearSession();
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.clearAllMocks();
  });

  it('spends exactly one heart for a failed word, and still reveals the answer', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 3);
    expect(heartRow()).toHaveTextContent('3 of 3 hearts left');

    tapWrongPicture('cat'); // first wrong tap: the free retry
    await tick(0);
    expect(heartRow()).toHaveTextContent('3 of 3 hearts left');

    tapWrongPicture('cat'); // second wrong tap: reveals the answer, costs a heart
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    // The teaching moment survives: the answer is on screen with its Next button.
    expect(nextButton()).toBeTruthy();
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(900);
  });

  it('hearts off: no heart row, and a failed word never ends the session', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 0);
    expect(heartRow()).toBeNull();

    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await tick(0);
    fireEvent.click(nextButton());

    await waitFor(() => expect(itemOnScreen()).toBe(2));
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(900);
  });

  it('an Unscramble shatter costs a heart', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 3);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    // 't' is wrong for position 2 (expects 'a') → the placed letters shatter
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    await waitFor(() => expect(heartRow()).toHaveTextContent('2 of 3 hearts left'));
    await tick(600);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run tests/integration/hearts-session.test.tsx
```

Expected: FAIL — all three tests. The first two fail on `heartRow()` being `null` / `toHaveTextContent` on `null`; the third fails on the heart count never changing.

- [ ] **Step 3: Render the heart row and spend hearts**

In `src/english/vocab/components/SessionPlayer.tsx`, add one import beside the existing component imports:

```tsx
import { HeartRow } from '@/english/vocab/components/heart-row';
```

Replace the store destructure on line 20:

```tsx
  const { currentIndex, advance, incrementRetry, restart, clearSession } = useSessionStore();
```

with:

```tsx
  const {
    currentIndex,
    advance,
    incrementRetry,
    restart,
    clearSession,
    heartsMax,
    heartsRemaining,
    loseHeart,
  } = useSessionStore();
```

Inside the `chrome` block, directly after the closing `</div>` of the progress dots and before the `🦉` span, add:

```tsx
      {heartsMax > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 58,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <HeartRow remaining={heartsRemaining} max={heartsMax} />
        </div>
      )}
```

Replace the `callbacks` object (lines 152-164) with:

```tsx
  const callbacks = {
    onCorrect: async () => {
      await wordProgress.recordCorrect(currentItem.word.id, currentItem.word.wordSetId);
    },
    onIncorrect: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
      incrementRetry();
    },
    onReveal: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
      // One heart per failed word. The end screen waits for onAdvance, so the
      // child gets to read the answer that was just revealed.
      loseHeart();
    },
    onShatter: () => {
      loseHeart();
    },
    onAdvance: () => advance(),
  };
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run tests/integration/hearts-session.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/english/vocab/components/SessionPlayer.tsx tests/integration/hearts-session.test.tsx && git commit -m "feat(vocab): show and spend hearts during a session"
```

- [ ] **Step 6: Write the failing end-screen tests**

Append these four tests inside the same `describe('hearts in a vocab session', ...)` block in `tests/integration/hearts-session.test.tsx`:

```tsx
  it('tapping Next on the last heart shows the end screen, not the next word', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await waitFor(() => expect(heartRow()).toHaveTextContent('0 of 1 hearts left'));
    // The answer is still on screen — nothing swaps until the child taps Next.
    expect(screen.queryByText(/out of hearts/i)).toBeNull();

    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
    await tick(900);
  });

  it('the last shatter ends the session only after the break animation', async () => {
    renderSession(makeSession([['cat', 'unscramble']]), 1);
    fireEvent.click(screen.getByRole('button', { name: 'letter c' }));
    fireEvent.click(screen.getByRole('button', { name: 'letter t' }));
    // The break lands first.
    expect(screen.queryByText(/out of hearts/i)).toBeNull();
    await tick(600);
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();
  });

  it('Try again restarts at the first word with a full heart row', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    tapWrongPicture('cat');
    await tick(0);
    tapWrongPicture('cat');
    await tick(0);
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(heartRow()).toHaveTextContent('1 of 1 hearts left'));
    expect(itemOnScreen()).toBe(1);
    await tick(900);
  });

  it('words answered correctly before running out keep their progress rows', async () => {
    renderSession(makeSession([['cat', 'recognize'], ['dog', 'recognize']]), 1);
    fireEvent.click(screen.getByAltText('cat').closest('button')!);
    await waitFor(async () =>
      expect(await db.wordProgress.get('child-1:animals.cat')).toBeTruthy(),
    );
    fireEvent.click(nextButton());
    await waitFor(() => expect(itemOnScreen()).toBe(2));

    tapWrongPicture('dog');
    await tick(0);
    tapWrongPicture('dog');
    await tick(0);
    fireEvent.click(nextButton());
    expect(screen.getByText(/out of hearts/i)).toBeTruthy();

    // Nothing is rolled back when the round ends early.
    const row = await db.wordProgress.get('child-1:animals.cat');
    expect(row).toBeTruthy();
    expect(row!.wordId).toBe('animals.cat');
    await tick(900);
  });
```

- [ ] **Step 7: Run the tests to verify they fail**

```bash
npx vitest run tests/integration/hearts-session.test.tsx
```

Expected: FAIL on the four new tests — `Unable to find an element with the text: /out of hearts/i` (the session advances to the next word instead).

- [ ] **Step 8: Add the out-of-hearts branch**

In `src/english/vocab/components/SessionPlayer.tsx`, add the import:

```tsx
import { OutOfHeartsScreen } from '@/english/vocab/components/OutOfHeartsScreen';
```

And add `SHATTER_ANIM_MS` to the existing `@/shared/constants/game-constants` import, which currently reads:

```tsx
import { LISTEN_MATCH_OPTION_COUNT } from '@/shared/constants/game-constants';
```

so it becomes:

```tsx
import { LISTEN_MATCH_OPTION_COUNT, SHATTER_ANIM_MS } from '@/shared/constants/game-constants';
```

Add the flag beside the other `useState` hooks (after `confirmingExit`):

```tsx
  // Set only once the last heart is spent AND the child has seen the outcome —
  // see onAdvance (reveal path) and onShatter (unscramble path).
  const [outOfHearts, setOutOfHearts] = useState(false);
```

Add a handler beside `handlePlayAgain`:

```tsx
  const handleTryAgain = () => {
    setOutOfHearts(false);
    handlePlayAgain();
  };
```

Insert this branch **immediately before** the existing `if (isComplete) {` block, so an exhausted session can never fall through to the celebration screen:

```tsx
  if (outOfHearts) {
    return <OutOfHeartsScreen onTryAgain={handleTryAgain} onGoHome={handleExit} />;
  }
```

Finally, replace `onShatter` and `onAdvance` in the `callbacks` object with:

```tsx
    onShatter: () => {
      loseHeart();
      // No reveal and no Next button here, so the swap is on a timer: let the
      // shatter land on screen before the end screen replaces it.
      if (heartsMax > 0 && heartsRemaining <= 1) {
        setTimeout(() => setOutOfHearts(true), SHATTER_ANIM_MS);
      }
    },
    onAdvance: () => {
      // The heart was spent in onReveal; the swap waits until here so the child
      // reads the revealed answer first.
      if (heartsMax > 0 && heartsRemaining === 0) {
        setOutOfHearts(true);
        return;
      }
      advance();
    },
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
npx vitest run tests/integration/hearts-session.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 10: Run the whole suite, typecheck and lint**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck silent, lint clean, every test passes.

- [ ] **Step 11: Commit**

```bash
git add src/english/vocab/components/SessionPlayer.tsx tests/integration/hearts-session.test.tsx && git commit -m "feat(vocab): end a session gently when the hearts run out"
```

---

### Task 7: The Settings control

The grown-up-facing half: a three-way Off / 3 ❤️ / 5 ❤️ radiogroup below the sound toggle, inside the existing math gate. The copy keys were added in Task 4.

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Test: `tests/integration/settings-hearts.test.tsx`

**Interfaces:**
- Consumes: `readHeartsMode`, `writeHeartsMode`, `HeartsMode` (Task 1); `HEARTS_CHOICES` (Task 1); `settings.hearts*` copy (Task 4).
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/settings-hearts.test.tsx`:

```tsx
/**
 * Integration test: the hearts control in Settings, behind the grown-ups gate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { SettingsPage } from '@/pages/SettingsPage';

function renderSettings() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

/**
 * The gate asks `a + b = ?` where each addend is `2 + floor(random * 6)`.
 * Pinning Math.random to 0 makes it 2 + 2.
 */
function passGate() {
  fireEvent.change(screen.getByLabelText(/grown-ups only/i), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
}

describe('Settings: hearts control', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.restoreAllMocks();
  });

  it('offers exactly three options and defaults to Off', () => {
    renderSettings();
    passGate();
    const group = screen.getByRole('radiogroup', { name: /challenge hearts/i });
    const radios = screen.getAllByRole('radio');
    expect(group).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(screen.getByRole('radio', { name: /off/i }).getAttribute('aria-checked')).toBe('true');
  });

  it('picking 3 hearts checks it and persists the choice', () => {
    renderSettings();
    passGate();
    fireEvent.click(screen.getByRole('radio', { name: '3 ❤️' }));
    expect(screen.getByRole('radio', { name: '3 ❤️' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /off/i }).getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem('heartsMode')).toBe('3');
  });

  it('picking 5 hearts, then Off, writes both choices through', () => {
    renderSettings();
    passGate();
    fireEvent.click(screen.getByRole('radio', { name: '5 ❤️' }));
    expect(localStorage.getItem('heartsMode')).toBe('5');
    fireEvent.click(screen.getByRole('radio', { name: /off/i }));
    expect(localStorage.getItem('heartsMode')).toBe('off');
  });

  it('reads the stored choice back on a fresh visit', () => {
    localStorage.setItem('heartsMode', '5');
    renderSettings();
    passGate();
    expect(screen.getByRole('radio', { name: '5 ❤️' }).getAttribute('aria-checked')).toBe('true');
  });

  it('every option keeps a 44 px touch target', () => {
    renderSettings();
    passGate();
    for (const radio of screen.getAllByRole('radio')) {
      expect(Number.parseInt(radio.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/integration/settings-hearts.test.tsx
```

Expected: FAIL — `Unable to find an accessible element with the role "radiogroup"`.

- [ ] **Step 3: Add the control**

In `src/pages/SettingsPage.tsx`, add the imports below the existing ones:

```tsx
import { HEARTS_CHOICES } from '@/shared/constants/game-constants';
import { readHeartsMode, writeHeartsMode } from '@/english/vocab/services/hearts-settings';
import type { HeartsMode } from '@/english/vocab/services/hearts-settings';
```

Add state beside the `audioEnabled` state (after line 13):

```tsx
  const [heartsMode, setHeartsMode] = useState<HeartsMode>(() => readHeartsMode());
```

Add the handler beside `toggleAudio`:

```tsx
  const chooseHearts = (mode: HeartsMode) => {
    setHeartsMode(mode);
    writeHeartsMode(mode);
  };
```

Then insert this card in the gated return, directly **after** the audio-toggle `<div className="card">…</div>` and before the `import.meta.env.DEV` block:

```tsx
      <div className="card" style={{ marginBottom: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t('settings.heartsLabel')}</span>
          <div role="radiogroup" aria-label={t('settings.heartsLabel')} style={{ display: 'flex', gap: 8 }}>
            {heartsOptions.map(({ mode, label }) => {
              const selected = heartsMode === mode;
              return (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseHearts(mode)}
                  style={{
                    minWidth: 64,
                    minHeight: 44,
                    borderRadius: 9999,
                    fontWeight: 800,
                    background: selected ? 'var(--primary)' : 'var(--border)',
                    color: selected ? 'var(--primary-fg)' : 'var(--muted-fg)',
                    boxShadow: selected ? 'var(--shadow-pop)' : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
          {t('settings.heartsHint')}
        </p>
      </div>
```

`heartsOptions` is derived from the constant, so the choices live in one place. Add it just above the gated `return` (after `unlockAllActivities`):

```tsx
  // Off first, then one option per HEARTS_CHOICES entry.
  const heartsOptions: Array<{ mode: HeartsMode; label: string }> = [
    { mode: 'off', label: t('settings.heartsOff') },
    ...HEARTS_CHOICES.map((n) => ({
      mode: String(n) as HeartsMode,
      label: t('settings.heartsOption', { n }),
    })),
  ];
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/integration/settings-hearts.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Check the Settings page for axe violations**

The radiogroup is new markup on an existing screen. Add this test to the end of `tests/integration/settings-hearts.test.tsx` (it uses the axe matcher already registered in `tests/setup.ts`):

```tsx
describe('A11y: Settings with the hearts control', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.restoreAllMocks();
  });

  it('has no axe violations once the gate is open', async () => {
    const { container } = renderSettings();
    passGate();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

Add the import at the top of the file:

```tsx
import { axe } from 'vitest-axe';
```

- [ ] **Step 6: Run it**

```bash
npx vitest run tests/integration/settings-hearts.test.tsx
```

Expected: PASS, 6 tests. If axe complains that a `radio` needs an accessible name, confirm each button renders its label text.

- [ ] **Step 7: Run the whole suite, typecheck and lint**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck silent, lint clean, every test passes.

- [ ] **Step 8: Commit**

```bash
git add src/pages/SettingsPage.tsx tests/integration/settings-hearts.test.tsx && git commit -m "feat(vocab): let a grown-up turn on 3 or 5 hearts in Settings"
```

---

### Task 8: Manual smoke test and documentation

The one thing tests cannot check: that this is pleasant for a six-year-old on a tablet.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-17-word-game-hearts-design.md` (status line only)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Start the dev server**

Use the preview tooling (never `npm run dev` in a shell). With `.claude/launch.json` configured for this project, start the `dev` server and open the preview.

- [ ] **Step 2: Walk the happy path**

1. Go to Settings, pass the gate, pick **3 ❤️**.
2. Start any vocab session that is not Listen & Learn (use the DEV "Unlock All Activities" button first if no activity is unlocked).
3. Confirm: three hearts sit centered under the progress dots; the exit ✕ and 🦉 are unmoved.
4. Fail a word twice — one heart greys out, the answer still reveals with Next.
5. Run the hearts down. The end screen appears only after Next.
6. Tap **Try again** — first word, three full hearts.

- [ ] **Step 3: Walk the off path**

Set the control back to **Off**, start a session, fail a word twice: no heart row anywhere, and the session continues exactly as before.

- [ ] **Step 4: Check the console**

Read the browser console. Expected: no errors and no React warnings from the new code.

- [ ] **Step 5: Mark the design doc implemented**

In `docs/superpowers/specs/2026-08-17-word-game-hearts-design.md`, change:

```markdown
**Status**: Approved, ready for planning
```

to:

```markdown
**Status**: Implemented — see `docs/superpowers/plans/2026-08-17-word-game-hearts.md`
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-17-word-game-hearts-design.md && git commit -m "docs: mark the hearts design implemented"
```

---

## Deviations from the design doc

Two, both deliberate, both flagged here so a reviewer can reject them cheaply:

1. **`HeartRow` announces through hidden text, not `aria-label`** (Task 3). The doc says the row "carries `role="status"` + `aria-live="polite"` with the label". Screen readers announce a live region's *content* on change; an `aria-label` that changes is not reliably announced, which would make the row silent at the one moment it matters. The visually-hidden-span pattern is what `UnscrambleActivity` already uses for its own announcements.
2. **`SHATTER_ANIM_MS` is extracted into `game-constants.ts`** (Task 5). The doc's ordering rule ("after the existing 500 ms shatter animation") requires `SessionPlayer` to know a duration that lived as a literal inside `UnscrambleActivity`. Duplicating `500` in two files would be the magic number Constitution VI forbids.

## Out of scope (YAGNI)

Earning hearts back mid-session; hearts in Memory Match, grammar or math; per-profile heart settings; streaks or scoring; heart-related achievements; keyboard arrow-key navigation inside the Settings radiogroup (the existing Settings controls are tap-first and do not implement it either).
