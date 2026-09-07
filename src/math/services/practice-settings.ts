/**
 * The optional "quick react" countdown setting. This module is the only place
 * that touches `localStorage.mathQuickReact`, so every failure mode — unset
 * key, corrupt value, private browsing — degrades to "off", i.e. untimed
 * practice, which is the gentler default for a child still building confidence.
 *
 * Mirrors the English side's `hearts-settings`, deliberately as its own math
 * module rather than an import: subjects do not depend on each other.
 */

const STORAGE_KEY = 'mathQuickReact';
const ON = 'on';

export function readQuickReact(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === ON;
  } catch {
    // Private browsing can throw on read — fall through to "off".
    return false;
  }
}

export function writeQuickReact(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? ON : 'off');
  } catch {
    // Nothing to do: the countdown is optional, and the caller keeps the value
    // in component state for this session.
  }
}
