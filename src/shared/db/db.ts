import Dexie from 'dexie';
import type {
  ChildProfileTable,
  WordProgressTable,
  WordSetStateTable,
  AchievementTable,
  MathProfileStateTable,
  MathTopicProgressTable,
  MathLevelResultTable,
  MathOlympiadStateTable,
} from './schema';

class VocabDatabase extends Dexie {
  childProfiles!: ChildProfileTable;
  wordProgress!: WordProgressTable;
  wordSetState!: WordSetStateTable;
  achievements!: AchievementTable;
  mathProfileState!: MathProfileStateTable;
  mathTopicProgress!: MathTopicProgressTable;
  mathLevelResults!: MathLevelResultTable;
  mathOlympiadState!: MathOlympiadStateTable;

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
    // v4: real progression — per-level results (journey map) + Olympiad state.
    // Additive tables only; existing math progress is untouched.
    this.version(4).stores({
      childProfiles: 'id, createdAt',
      wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
      wordSetState: 'id, childId, [childId+wordSetId]',
      achievements: 'id, childId, [childId+earnedAt]',
      mathProfileState: 'id, childId',
      mathTopicProgress: 'id, childId, [childId+topicId]',
      mathLevelResults: 'id, childId, [childId+topicId]',
      mathOlympiadState: 'id, childId',
    });
  }
}

export const db = new VocabDatabase();
