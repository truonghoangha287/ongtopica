import Dexie from 'dexie';
import type {
  ChildProfileTable,
  WordProgressTable,
  WordSetStateTable,
  AchievementTable,
} from './schema';

class VocabDatabase extends Dexie {
  childProfiles!: ChildProfileTable;
  wordProgress!: WordProgressTable;
  wordSetState!: WordSetStateTable;
  achievements!: AchievementTable;

  constructor() {
    super('ongtopica-vocab');
    this.version(1).stores({
      childProfiles: 'id, createdAt',
      wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
    });
    this.version(2)
      .stores({
        childProfiles: 'id, createdAt',
        wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
        wordSetState: 'id, childId, [childId+wordSetId]',
        achievements: 'id, childId, [childId+earnedAt]',
      })
      .upgrade(async (tx) => {
        // FR-013 back-fill: any word past stage 1 was implicitly heard at some point.
        const wp = tx.table('wordProgress');
        await wp.toCollection().modify((row) => {
          if (row.stage > 1 && row.introducedAt == null) {
            row.introducedAt = row.lastReviewedAt ?? Date.now();
          }
        });
      });
  }
}

export const db = new VocabDatabase();
