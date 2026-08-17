import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    useSessionStore.getState().loseHeart();
    expect(useSessionStore.getState().heartsRemaining).toBe(0);
    expect(useSessionStore.getState().heartsMax).toBe(0);
  });

  it('loseHeart with hearts off keeps the same state object, so nothing re-renders', () => {
    useSessionStore.getState().setSession(session, 0);
    const before = useSessionStore.getState();
    const listener = vi.fn();
    const unsubscribe = useSessionStore.subscribe(listener);
    try {
      useSessionStore.getState().loseHeart();
    } finally {
      unsubscribe();
    }
    // Identity, not just equality: a fresh object would wake every subscriber
    // (SessionPlayer subscribes with no selector) on a path that must not exist
    // when hearts are off.
    expect(useSessionStore.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('advance keeps the hearts already spent', () => {
    useSessionStore.getState().setSession(session, 3);
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().advance();
    expect(useSessionStore.getState().heartsRemaining).toBe(2);
    useSessionStore.getState().loseHeart();
    useSessionStore.getState().advance();
    expect(useSessionStore.getState().heartsRemaining).toBe(1);
    expect(useSessionStore.getState().heartsMax).toBe(3);
    expect(useSessionStore.getState().currentIndex).toBe(2);
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
