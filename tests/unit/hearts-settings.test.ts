import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  readHeartsMode,
  writeHeartsMode,
  heartsCountFor,
} from '@/english/vocab/services/hearts-settings';

describe('hearts-settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "off" when the key was never written', () => {
    expect(readHeartsMode()).toBe('off');
  });

  it('round-trips every mode', () => {
    writeHeartsMode('3');
    expect(readHeartsMode()).toBe('3');
    writeHeartsMode('5');
    expect(readHeartsMode()).toBe('5');
    writeHeartsMode('off');
    expect(readHeartsMode()).toBe('off');
  });

  it('writes the raw value under the "heartsMode" key', () => {
    writeHeartsMode('5');
    expect(localStorage.getItem('heartsMode')).toBe('5');
  });

  it('returns "off" for a corrupt stored value', () => {
    localStorage.setItem('heartsMode', '7');
    expect(readHeartsMode()).toBe('off');
    localStorage.setItem('heartsMode', 'yes please');
    expect(readHeartsMode()).toBe('off');
  });

  it('returns "off" when localStorage throws (private browsing)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    expect(readHeartsMode()).toBe('off');
  });

  it('does not throw when localStorage write fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeHeartsMode('3')).not.toThrow();
  });

  it('maps modes to session heart counts', () => {
    expect(heartsCountFor('off')).toBe(0);
    expect(heartsCountFor('3')).toBe(3);
    expect(heartsCountFor('5')).toBe(5);
  });
});
