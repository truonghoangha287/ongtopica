import { describe, it, expect, afterEach, vi } from 'vitest';
import { readQuickReact, writeQuickReact } from '@/math/services/practice-settings';

describe('quick-react setting', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to off, so practice is untimed until a grown-up asks for a clock', () => {
    expect(readQuickReact()).toBe(false);
  });

  it('round-trips both states', () => {
    writeQuickReact(true);
    expect(readQuickReact()).toBe(true);
    writeQuickReact(false);
    expect(readQuickReact()).toBe(false);
  });

  it('treats a corrupt stored value as off', () => {
    localStorage.setItem('mathQuickReact', 'yes-please');
    expect(readQuickReact()).toBe(false);
  });

  it('falls back to off when storage throws, as it can in private browsing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readQuickReact()).toBe(false);
  });

  it('does not throw when storage refuses a write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => writeQuickReact(true)).not.toThrow();
  });
});
