import Dexie from 'dexie';
import type {
  ChildProfileTable,
  WordProgressTable,
  WordSetStateTable,
  AchievementTable,
  MathProfileStateTable,
  MathTopicProgressTable,
} from './schema';

class VocabDatabase extends Dexie {
  childProfiles!: ChildProfileTable;
  wordProgress!: WordProgressTable;
  wordSetState!: WordSetStateTable;
  achievements!: AchievementTable;
  mathProfileState!: MathProfileStateTable;
  mathTopicProgress!: MathTopicProgressTable;

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
    // v3: Math World subject — additive tables only, no data motion.
    this.version(3).stores({
      childProfiles: 'id, createdAt',
      wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
      wordSetState: 'id, childId, [childId+wordSetId]',
      achievements: 'id, childId, [childId+earnedAt]',
      mathProfileState: 'id, childId',
      mathTopicProgress: 'id, childId, [childId+topicId]',
    });
  }
}

export const db = new VocabDatabase();
