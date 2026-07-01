import Dexie from 'dexie';
import {
  SCHEMA_V1,
  SCHEMA_V2,
  SCHEMA_V3,
} from './schema';
import type {
  ChildProfileTable,
  WordProgressTable,
  WordSetStateTable,
  AchievementTable,
  MathProgressTable,
} from './schema';

class VocabDatabase extends Dexie {
  childProfiles!: ChildProfileTable;
  wordProgress!: WordProgressTable;
  wordSetState!: WordSetStateTable;
  achievements!: AchievementTable;
  mathProgress!: MathProgressTable;

  constructor() {
    super('ongtopica-vocab');
    this.version(1).stores(SCHEMA_V1);
    this.version(2)
      .stores(SCHEMA_V2)
      .upgrade(async (tx) => {
        // FR-013 back-fill: any word past stage 1 was implicitly heard at some point.
        const wp = tx.table('wordProgress');
        await wp.toCollection().modify((row) => {
          if (row.stage > 1 && row.introducedAt == null) {
            row.introducedAt = row.lastReviewedAt ?? Date.now();
          }
        });
      });
    // No data motion needed for v3; adding a store preserves all existing rows (FR-012).
    this.version(3).stores(SCHEMA_V3);
  }
}

export const db = new VocabDatabase();
