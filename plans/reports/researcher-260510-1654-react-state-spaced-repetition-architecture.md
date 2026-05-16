# Research Report: React State Management & Spaced Repetition Architecture for Vocabulary PWA

**Date**: 2026-05-10  
**Context**: 6-year-old vocabulary learning PWA with multi-profile local-only persistence  
**Constraints**: Files <200 lines, English/Shared folder split, no external services

---

## 1. State Management: Zustand Recommended

**Winner: Zustand** — minimal boilerplate, native persistence hooks, PWA-friendly.

| Criterion | Zustand | Jotai | Redux Toolkit | React Context + useReducer |
|-----------|---------|-------|---------------|---------------------------|
| Boilerplate | Minimal (~20 lines/store) | Minimal atoms | High (actions/reducers/slices) | Medium (reducer + hooks) |
| Persistence Plugin | Native `persist` middleware | No native; requires custom | redux-persist add-on | Manual localStorage sync |
| IndexedDB Integration | Seamless via custom storage layer | Possible but awkward | redux-persist does this | Manual, fragile |
| DevTools | Built-in (optional) | Requires setup | Excellent | Limited |
| File Size Compliance | Yes (store ~50 lines) | Yes (atoms ~30 lines) | No (slice + actions ~150 lines min) | Yes, but fragile at scale |

**Zustand Rationale**:
- Zustand stores are functions returning an object — matches KISS principle
- `persist` middleware syncs to IndexedDB via custom storage layer (one config)
- No provider wrapper hell; direct hook consumption works in components <200 lines
- Scales well from single store to 3–4 specialized stores without code explosion

**Specific to Ongtopica**:
```typescript
// Store structure (fits <200 line requirement)
export const useSessionStore = create(
  persist(
    (set) => ({
      currentWord: null,
      retryCount: 0,
      // ... session state
      setWord: (word) => set({ currentWord: word }),
    }),
    { name: "session", storage: createDexieStorage() }
  )
);
```

---

## 2. Session Composer: Pure Function Service Module + Hook Wrapper

**Pattern**: Composition of pure function + custom hook + Dexie integration.

### Architecture:
```
src/english/vocab/
├── services/
│   └── session-composer.ts       # Pure algorithm, testable in isolation
├── hooks/
│   └── useSessionComposer.ts     # React hook wrapper + Dexie fetch
└── types/
    └── session.types.ts          # Session, WordProgress interfaces
```

### Session Composer Algorithm (pure function):
```typescript
// services/session-composer.ts (~80 lines)
export function composeSession(
  wordProgress: WordProgress[],
  newWords: Word[],
  capacity: number = 10
): Word[] {
  // 1. Sort by priority (incorrect × STRUGGLE_WEIGHT, correct ÷ CONFIDENCE_WEIGHT)
  const byPriority = [...wordProgress]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, capacity);

  // 2. Fill remaining slots with new Stage 1 words
  if (byPriority.length < capacity) {
    const remaining = capacity - byPriority.length;
    const unused = newWords.filter(w => !wordProgress.find(p => p.wordId === w.id));
    byPriority.push(...unused.slice(0, remaining));
  }

  return byPriority;
}
```

**Why**:
- Pure function enables unit testing without mocks or React-specific setup
- No side effects → deterministic, debuggable
- Hook wrapper (`useSessionComposer`) handles Dexie data fetching + composition
- Testable in isolation; hook integration tested separately

**Testing Strategy**:
- Unit test: `composeSession()` with fixed input arrays
- Integration test: hook + Dexie query behavior
- No need to mock Dexie at unit level

---

## 3. Word Progress Persistence: Dexie Schema + Normalized Tables

**Rationale**: IndexedDB is overkill for a single flat table; Dexie's typed API prevents schema drift.

### Schema Design:
```typescript
// db.ts (~120 lines)
import Dexie, { type Table } from "dexie";

export interface ChildProfile {
  id: string; // UUID
  name: string;
  avatar: string; // base64 or asset key
  createdAt: number;
}

export interface WordProgress {
  id: string; // UUID: `${childId}-${wordId}`
  childId: string;
  wordId: string;
  stage: 1 | 2 | 3 | 4;
  consecutiveCorrect: number;
  totalIncorrect: number;
  priorityScore: number; // Initially 1.0
  lastReviewedAt: number; // ms since epoch
  updatedAt: number;
}

export class OngtopicaDB extends Dexie {
  childProfiles!: Table<ChildProfile>;
  wordProgress!: Table<WordProgress>;

  constructor() {
    super("ongtopica");
    this.version(1).stores({
      childProfiles: "id",
      wordProgress: "id, childId, wordId, [childId+stage]",
    });
  }
}
```

### Queries (in hooks):
```typescript
// hooks/useWordProgress.ts
export function useWordProgressByChild(childId: string) {
  const [progress, setProgress] = useState<WordProgress[]>([]);

  useEffect(() => {
    db.wordProgress
      .where("childId")
      .equals(childId)
      .toArray()
      .then(setProgress);
  }, [childId]);

  return progress;
}
```

**Why This Schema**:
- One-to-many: child → word progress. Dexie handles indexed queries efficiently
- Composite index `[childId+stage]` supports: "give me all Stage 2 words for child X" queries
- No relational joins; flat denormalization matches IndexedDB constraints
- `id` = UUID prevents collisions across sessions/devices
- `lastReviewedAt` enables "time since review" scoring for future spaced repetition tuning

---

## 4. Architecture Pattern: Domain-Driven Feature Folders

**Pattern**: Per-feature folders under `english/` and `shared/`, aligned with Constitution Principle VI.

### Folder Structure:
```
src/
├── english/
│   ├── vocab/
│   │   ├── components/           # <200 lines each
│   │   │   ├── VocabSession.tsx
│   │   │   ├── Word4StageActivity.tsx
│   │   │   └── ProgressBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useSessionComposer.ts
│   │   │   ├── useWordProgress.ts
│   │   │   └── useSessionState.ts
│   │   ├── services/
│   │   │   ├── session-composer.ts
│   │   │   └── progress-calculator.ts
│   │   ├── store/
│   │   │   └── session.store.ts     # Zustand store
│   │   └── types/
│   │       └── vocab.types.ts
│   └── profile/
│       ├── components/
│       ├── hooks/
│       └── store/
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Mascot.tsx
│   │   └── AudioPlayer.tsx
│   ├── hooks/
│   │   ├── useChildProfile.ts
│   │   └── useDexieDb.ts
│   ├── db/
│   │   └── db.ts                   # Dexie instance
│   ├── constants/
│   │   └── learning-config.ts       # MASTERY_THRESHOLD, etc.
│   └── types/
│       └── common.types.ts

tests/
├── english/vocab/
│   ├── session-composer.test.ts
│   ├── progress-calculator.test.ts
│   └── VocabSession.integration.test.ts
└── shared/
    └── db.test.ts
```

**Why Domain-Driven (not Flat)**:
- Each feature (vocab, profile, etc.) is self-contained → easier to onboard contributors
- Shared services live in `shared/` → reusable across features
- Aligns with Constitution Principle VI (no cross-subject entanglement)
- Prevents "services/" or "utils/" dumping grounds
- <200 line constraint forces intentional component decomposition

**File Size Compliance**:
- Components: `VocabSession.tsx` orchestrates a session; sub-components handle individual activities
- Stores: Single Zustand store ~50 lines
- Services: `session-composer.ts` pure function ~80 lines; `progress-calculator.ts` scoring logic ~60 lines

---

## 5. Integration Points: Dexie + Zustand + Hooks

### Data Flow:
1. **Load**: `useWordProgress(childId)` queries Dexie, updates Zustand store
2. **Compose**: `useSessionComposer()` calls pure function on store data
3. **Update**: After activity, call Dexie mutator + store setter atomically
4. **Persist**: Zustand `persist` middleware writes store to IndexedDB automatically

### Example: Recording an Answer
```typescript
// In VocabSession component
const updateProgress = async (correct: boolean) => {
  const current = useSessionStore((s) => s.currentWord);
  
  // Update store immediately (optimistic)
  updateSessionState(current.id, correct);

  // Persist to Dexie (background)
  await db.wordProgress.update(current.id, {
    consecutiveCorrect: correct ? cc + 1 : 0,
    priorityScore: correct ? score / 1.5 : score * 2.0,
    totalIncorrect: !correct ? total + 1 : total,
    updatedAt: Date.now(),
  });
};
```

---

## 6. Testing Strategy

### Unit Tests (Pure Functions)
```typescript
// tests/english/vocab/session-composer.test.ts
describe("composeSession", () => {
  it("prioritizes struggling words first", () => {
    const words = [{ score: 1.0 }, { score: 4.0 }, { score: 2.0 }];
    const result = composeSession(words, [], 2);
    expect(result[0].score).toBe(4.0);
    expect(result[1].score).toBe(2.0);
  });

  it("fills remaining slots with new Stage 1 words", () => {
    const progress = [{ wordId: "w1", score: 2.0 }];
    const newWords = [{ id: "w2" }, { id: "w3" }];
    const result = composeSession(progress, newWords, 3);
    expect(result.length).toBe(3);
  });
});
```

### Integration Tests (Hook + Dexie)
```typescript
describe("useSessionComposer", () => {
  it("fetches word progress from Dexie and composes session", async () => {
    await db.wordProgress.add({ childId: "child1", score: 2.0 });
    const { result } = renderHook(() => useSessionComposer("child1"));
    await waitFor(() => expect(result.current.session).toBeDefined());
  });
});
```

**No Mocks**: Dexie runs in-memory during tests; IndexedDB fully functional.

---

## Unresolved Questions

1. **Audio asset caching strategy**: Should audio be pre-bundled in PWA manifest or downloaded on first session? Impacts session composer (time-to-interactive).
2. **Child profile avatar storage**: Base64 inline vs asset key + separate loader? Affects IndexedDB row size.
3. **Mastery threshold tuning**: Is 3 consecutive correct optimal for age 6? Recommend A/B test with parent dashboard visibility.
4. **Cloud sync (future scope)**: If v2 adds cloud sync, will schema change? Recommend versioning Dexie schema now.

---

## Summary Table

| Question | Recommendation | Rationale |
|----------|----------------|-----------|
| **State management** | Zustand + `persist` middleware | Minimal boilerplate, native IndexedDB sync, fits <200 line components |
| **Session composer** | Pure function (`session-composer.ts`) + hook wrapper | Testable in isolation, deterministic, no mocks needed |
| **Persistence schema** | Dexie with `WordProgress` + composite index `[childId+stage]` | Typed API, efficient queries, supports multi-profile at scale |
| **Architecture** | Domain-driven folders (`english/vocab/`, `shared/`) | Aligns with Constitution VI, prevents component dumping, scales to multi-subject |
| **Testing** | Unit tests on pure functions, integration tests with Dexie in-memory | No Dexie mocks; IndexedDB fully testable offline |

