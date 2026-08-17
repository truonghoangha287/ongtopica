import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/english/vocab/store/session-store';
import type { Session } from '@/english/vocab/types/vocab.types';

const session: Session = {
  id: 's1',
  wordSetId: 'animals',
  items: [],
  createdAt: 0,
};

describe('session-store hearts', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it('setSession seeds both heart counts', () => {
    useSessionStore.getState().setSession(session, 3);
    expect(useSessionStore.getState().heartsMax).toBe(3);
    expect(useSessionStore.getState().heartsRemaining).toBe(3);
  });

  it('loseHeart decrements remaining and leaves max alone', () => {
    useSessionStore.getState().setSession(session, 5);
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(4);
    expect(useSessionStore.getState().heartsMax).toBe(5);
  });

  it('loseHeart floors at 0', () => {
    useSessionStore.getState().setSession(session, 1);
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
  });

  it('loseHeart is a no-op when hearts are off', () => {
    useSessionStore.getState().setSession(session, 0);
    const before = useSessionStore.getState();
    useSessionStore.getState().loseHeart();
    const after = useSessionStore.getState();
    // A true no-op returns the same state object, so Zustand's Object.is
    // bail-out skips the notify — no listener should ever see a new reference.
    expect(after).toBe(before);
    expect(after.heartsRemaining).toBe(0);
    expect(after.heartsMax).toBe(0);
  });

  it('restart reseeds hearts to full and returns to the first item', () => {
    useSessionStore.getState().setSession(session, 3);
    useSessionStore.getState().advance();
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().restart();
    expect(useSessionStore.getState().heartsRemaining).toBe(3);
    expect(useSessionStore.getState().currentIndex).toBe(0);
    expect(useSessionStore.getState().retryCount).toBe(0);
  });

  it('clearSession clears hearts too', () => {
    useSessionStore.getState().setSession(session, 5);
    useSessionStore.getState().clearSession();
    expect(useSessionStore.getState().heartsMax).toBe(0);
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
    expect(useSessionStore.getState().session).toBeNull();
  });
});
