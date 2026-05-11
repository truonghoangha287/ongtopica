import Dexie from 'dexie';
import type { ChildProfileTable, WordProgressTable } from './schema';

class VocabDatabase extends Dexie {
  childProfiles!: ChildProfileTable;
  wordProgress!: WordProgressTable;

  constructor() {
    super('ongtopica-vocab');
    this.version(1).stores({
      childProfiles: 'id, createdAt',
      wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
    });
  }
}

export const db = new VocabDatabase();
