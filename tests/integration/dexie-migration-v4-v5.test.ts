import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { db } from '@/shared/db/db';

const DB_NAME = 'ongtopica-vocab';

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

  it('declares all nine expected object stores at v5', () => {
    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual([
      'achievements',
      'childProfiles',
      'mathLevelResults',
      'mathOlympiadState',
      'mathProfileState',
      'mathTopicProgress',
      'ruleMastery',
      'wordProgress',
      'wordSetState',
    ]);
  });

  describe('real upgrade from a v4-only database', () => {
    it('preserves seeded v4 rows and adds the v5 store when the real db opens on top', async () => {
      // The outer beforeEach may have already opened the singleton at v5 (a
      // fresh create against an empty IDB, since fake-indexeddb starts each
      // file with nothing). Close it and wipe the underlying database so we
      // start this test from a clean slate that only knows about v4.
      if (db.isOpen()) db.close();
      await Dexie.delete(DB_NAME);

      // A separate, plain Dexie instance that only ever declares up through
      // v4 — this is what "an existing installation before the v5 update"
      // looks like on disk.
      const v4Db = new Dexie(DB_NAME);
      v4Db.version(4).stores({
        childProfiles: 'id, createdAt',
        wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
        wordSetState: 'id, childId, [childId+wordSetId]',
        achievements: 'id, childId, [childId+earnedAt]',
        mathProfileState: 'id, childId',
        mathTopicProgress: 'id, childId, [childId+topicId]',
        mathLevelResults: 'id, childId, [childId+topicId]',
        mathOlympiadState: 'id, childId',
      });
      await v4Db.open();
      expect(v4Db.verno).toBe(4);

      const seedWordProgress = {
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
      };
      const seedMathTopicProgress = {
        id: 'child-1:addition',
        childId: 'child-1',
        topicId: 'addition',
        stars: 2,
        level: 4,
        updatedAt: 1_700_000_000_000,
      };
      const seedChildProfile = {
        id: 'child-1',
        name: 'Test Child',
        avatarId: 'fox',
        createdAt: 1_690_000_000_000,
      };

      await v4Db.table('wordProgress').put(seedWordProgress);
      await v4Db.table('mathTopicProgress').put(seedMathTopicProgress);
      await v4Db.table('childProfiles').put(seedChildProfile);

      // Fully close the seeding connection before the real singleton opens
      // the same underlying database — otherwise the upgrade transaction
      // never fires.
      v4Db.close();

      // Now open the app's real db singleton, which declares through v5.
      // Against this on-disk v4 database, Dexie must run a genuine version
      // upgrade (4 -> 5), not a fresh single-shot create.
      await db.open();

      expect(db.verno).toBe(5);
      expect(db.ruleMastery).toBeDefined();

      const wordProgressRow = await db.wordProgress.get('child-1:animals.cat');
      expect(wordProgressRow).toEqual(seedWordProgress);

      const mathTopicProgressRow = await db.mathTopicProgress.get('child-1:addition');
      expect(mathTopicProgressRow).toEqual(seedMathTopicProgress);

      const childProfileRow = await db.childProfiles.get('child-1');
      expect(childProfileRow).toEqual(seedChildProfile);

      const tableNames = db.tables.map((t) => t.name).sort();
      expect(tableNames).toEqual([
        'achievements',
        'childProfiles',
        'mathLevelResults',
        'mathOlympiadState',
        'mathProfileState',
        'mathTopicProgress',
        'ruleMastery',
        'wordProgress',
        'wordSetState',
      ]);
    });
  });
});
