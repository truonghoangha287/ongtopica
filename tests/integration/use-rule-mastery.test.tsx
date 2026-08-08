import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { renderHook, act } from '@testing-library/react';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { useRuleMastery } from '@/english/grammar/hooks/useRuleMastery';

describe('useRuleMastery', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
  });

  it('starts with an empty mastery map', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await expect(result.current.getMastery()).resolves.toEqual({});
  });

  it('creates a row on the first attempt', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.es', true);
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.es']).toMatchObject({
      attempts: 1, correct: 1, streak: 1, gold: false,
    });
  });

  it('accumulates across attempts', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.es', true);
      await result.current.recordAttempt('plural.es', false);
      await result.current.recordAttempt('plural.es', true);
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.es']).toMatchObject({
      attempts: 3, correct: 2, streak: 1,
    });
  });

  it('goes gold after a long enough correct run', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.s', false);
      await result.current.recordAttempt('plural.s', false);
      for (let i = 0; i < 8; i++) {
        await result.current.recordAttempt('plural.s', true);
      }
    });
    const mastery = await result.current.getMastery();
    expect(mastery['plural.s']?.gold).toBe(true);
  });

  it('keeps each child\'s mastery separate', async () => {
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('letter.bd', true);
    });

    useProfileStore.setState({ activeProfileId: 'child-2' });
    const second = renderHook(() => useRuleMastery());
    await expect(second.result.current.getMastery()).resolves.toEqual({});
  });

  it('is a no-op when no profile is active', async () => {
    useProfileStore.setState({ activeProfileId: null });
    const { result } = renderHook(() => useRuleMastery());
    await act(async () => {
      await result.current.recordAttempt('plural.s', true);
    });
    expect(await db.ruleMastery.count()).toBe(0);
  });
});
