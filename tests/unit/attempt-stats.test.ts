import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordWrongTap,
  recordCompletion,
  getStat,
} from '@/english/vocab/services/attempt-stats';

describe('attempt-stats', () => {
  beforeEach(() => localStorage.clear());

  it('starts at zero for an unseen word', () => {
    expect(getStat('child1', 'animals.bear')).toEqual({ completions: 0, wrongTaps: 0 });
  });

  it('accumulates wrong taps and completions', () => {
    recordWrongTap('child1', 'animals.bear');
    recordWrongTap('child1', 'animals.bear');
    recordCompletion('child1', 'animals.bear');
    expect(getStat('child1', 'animals.bear')).toEqual({ completions: 1, wrongTaps: 2 });
  });

  it('namespaces stats per profile', () => {
    recordCompletion('child1', 'animals.cat');
    recordCompletion('child2', 'animals.cat');
    recordCompletion('child2', 'animals.cat');
    expect(getStat('child1', 'animals.cat').completions).toBe(1);
    expect(getStat('child2', 'animals.cat').completions).toBe(2);
  });

  it('persists across reads (localStorage-backed)', () => {
    recordWrongTap('child1', 'animals.dog');
    // a fresh getStat call re-reads from storage
    expect(getStat('child1', 'animals.dog').wrongTaps).toBe(1);
  });
});
