/**
 * Integration test: Dexie v2 → v3 migration (FR-012 / SC-005).
 *
 * Adding the Math subject must not drop or alter any existing English table, and
 * must add exactly the `mathProgress` store. jsdom has no real IndexedDB, so we
 * assert the migration is purely additive against the exported schema definitions
 * (the same objects db.ts hands to Dexie.version().stores()).
 */
import { describe, it, expect } from 'vitest';
import { SCHEMA_V2, SCHEMA_V3 } from '@/shared/db/schema';

describe('Dexie v2 → v3 migration (additive, FR-012)', () => {
  it('preserves every v2 store with an identical index definition', () => {
    for (const [table, indexes] of Object.entries(SCHEMA_V2)) {
      expect(SCHEMA_V3[table]).toBe(indexes);
    }
  });

  it('does not alter the English progress tables', () => {
    expect(SCHEMA_V3.wordProgress).toBe(SCHEMA_V2.wordProgress);
    expect(SCHEMA_V3.wordSetState).toBe(SCHEMA_V2.wordSetState);
    expect(SCHEMA_V3.achievements).toBe(SCHEMA_V2.achievements);
    expect(SCHEMA_V3.childProfiles).toBe(SCHEMA_V2.childProfiles);
  });

  it('adds exactly the mathProgress store (and nothing else)', () => {
    const added = Object.keys(SCHEMA_V3).filter((k) => !(k in SCHEMA_V2));
    expect(added).toEqual(['mathProgress']);
    expect(SCHEMA_V3.mathProgress).toContain('[childId+topicId]');
  });

  it('declares no destructive change — v3 is a strict superset of v2', () => {
    const v2Tables = new Set(Object.keys(SCHEMA_V2));
    const v3Tables = new Set(Object.keys(SCHEMA_V3));
    for (const t of v2Tables) expect(v3Tables.has(t)).toBe(true);
    expect(v3Tables.size).toBe(v2Tables.size + 1);
  });
});
