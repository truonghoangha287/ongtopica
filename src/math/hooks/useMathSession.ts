import { useState } from 'react';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useMathSessionStore } from '@/math/store/math-session-store';
import { composeMathSession } from '@/math/services/math-session-composer';
import { MATH_SESSION_SIZE } from '@/shared/constants/game-constants';
import type { MathTopic, MathSession, MathProgressMap } from '@/math/types/math.types';

export interface UseMathSessionReturn {
  composeSession: (topic: MathTopic) => Promise<MathSession>;
  isComposing: boolean;
}

export function useMathSession(): UseMathSessionReturn {
  const [isComposing, setIsComposing] = useState(false);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const setSession = useMathSessionStore((s) => s.setSession);

  const composeSession = async (topic: MathTopic): Promise<MathSession> => {
    setIsComposing(true);
    try {
      const rows = activeProfileId
        ? await db.mathProgress
            .where('[childId+topicId]')
            .equals([activeProfileId, topic.id])
            .toArray()
        : [];
      const progressMap: MathProgressMap = Object.fromEntries(rows.map((r) => [r.problemId, r]));

      const problems = composeMathSession(topic, progressMap, { sessionSize: MATH_SESSION_SIZE });
      const session: MathSession = {
        id: crypto.randomUUID(),
        topicId: topic.id,
        problems,
        createdAt: Date.now(),
      };
      setSession(session);
      return session;
    } finally {
      setIsComposing(false);
    }
  };

  return { composeSession, isComposing };
}
