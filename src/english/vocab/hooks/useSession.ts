import { useState } from 'react';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { composeSession } from '@/english/vocab/services/session-composer';
import { SESSION_WORD_COUNT } from '@/shared/constants/game-constants';
import type { WordSet } from '@/shared/types';
import type { Session } from '@/english/vocab/types/vocab.types';

export interface UseSessionReturn {
  composeSession: (wordSet: WordSet, stageFilter?: 1 | 2 | 3 | 4) => Promise<Session>;
  isComposing: boolean;
}

export function useSession(): UseSessionReturn {
  const [isComposing, setIsComposing] = useState(false);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const setSession = useSessionStore((s) => s.setSession);

  const compose = async (wordSet: WordSet, stageFilter?: 1 | 2 | 3 | 4): Promise<Session> => {
    setIsComposing(true);
    try {
      const rows = activeProfileId
        ? await db.wordProgress
            .where('[childId+wordSetId]')
            .equals([activeProfileId, wordSet.id])
            .toArray()
        : [];
      const progressMap = Object.fromEntries(rows.map((r) => [r.wordId, r]));

      // Read rotation cursor for Listen & Learn sessions
      let rotationCursor: number | undefined;
      if (stageFilter === 1 && activeProfileId) {
        const stateId = `${activeProfileId}:${wordSet.id}`;
        const stateRow = await db.wordSetState.get(stateId);
        rotationCursor = stateRow?.rotationCursor ?? 0;
      }

      const items = composeSession(wordSet, progressMap, {
        sessionWordCount: SESSION_WORD_COUNT,
        stageFilter,
        rotationCursor,
      });

      const session: Session = {
        id: crypto.randomUUID(),
        wordSetId: wordSet.id,
        items,
        createdAt: Date.now(),
        stageFilter,
        wordSetTotalCount: wordSet.words.length,
      };
      setSession(session);
      return session;
    } finally {
      setIsComposing(false);
    }
  };

  return { composeSession: compose, isComposing };
}
