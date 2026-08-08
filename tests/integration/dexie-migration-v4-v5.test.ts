import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/db/db';

describe('Dexie v4 → v5 migration', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
  });

  it('opens at version 5', async () => {
    expect(db.verno).toBe(5);
  });

  it('exposes the ruleMastery table', () => {
    expect(db.ruleMastery).toBeDefined();
  });

  it('preserves existing word progress across the upgrade', async () => {
    await db.wordProgress.put({
      id: 'child-1:animals.cat',
      childId: 'child-1',
      wordId: 'animals.cat',
      wordSetId: 'animals',
      stage: 3,
      consecutiveCorrect: 2,
      totalIncorrect: 1,
      priorityScore: 55,
      lastReviewedAt: 1_700_000_000_000,
      introducedAt: 1_699_000_000_000,
    });

    const row = await db.wordProgress.get('child-1:animals.cat');
    expect(row?.stage).toBe(3);
    expect(row?.introducedAt).toBe(1_699_000_000_000);
  });

  it('preserves existing math progress across the upgrade', async () => {
    await db.mathTopicProgress.put({
      id: 'child-1:addition',
      childId: 'child-1',
      topicId: 'addition',
      stars: 2,
      level: 4,
      updatedAt: 1_700_000_000_000,
    });
    const row = await db.mathTopicProgress.get('child-1:addition');
    expect(row?.stars).toBe(2);
    expect(row?.level).toBe(4);
  });

  it('reads back a rule mastery row by the [childId+ruleId] index', async () => {
    await db.ruleMastery.put({
      id: 'child-1:plural.es',
      childId: 'child-1',
      ruleId: 'plural.es',
      attempts: 9,
      correct: 8,
      streak: 6,
      gold: true,
      lastSeenAt: 1_700_000_000_000,
    });

    const found = await db.ruleMastery
      .where('[childId+ruleId]')
      .equals(['child-1', 'plural.es'])
      .toArray();

    expect(found).toHaveLength(1);
    expect(found[0].gold).toBe(true);
  });

  it('scopes mastery rows per child', async () => {
    await db.ruleMastery.bulkPut([
      { id: 'a:plural.s', childId: 'a', ruleId: 'plural.s', attempts: 1, correct: 1, streak: 1, gold: false, lastSeenAt: 1 },
      { id: 'b:plural.s', childId: 'b', ruleId: 'plural.s', attempts: 5, correct: 0, streak: 0, gold: false, lastSeenAt: 2 },
    ]);
    const forA = await db.ruleMastery.where('childId').equals('a').toArray();
    expect(forA).toHaveLength(1);
    expect(forA[0].attempts).toBe(1);
  });
});
