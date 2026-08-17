/**
 * Integration test: the hearts control in Settings, behind the grown-ups gate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { axe } from 'vitest-axe';
import i18n from '@/i18n';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { SettingsPage } from '@/pages/SettingsPage';

function renderSettings() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

/**
 * The gate asks `a + b = ?` where each addend is `2 + floor(random * 6)`.
 * Pinning Math.random to 0 makes it 2 + 2.
 */
function passGate() {
  fireEvent.change(screen.getByLabelText(/grown-ups only/i), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
}

describe('Settings: hearts control', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(async () => {
    // Unmount before tearing the database down: RTL's own cleanup runs after this
    // hook, so a still-mounted SettingsPage would react to db.delete() outside
    // act() and warn.
    cleanup();
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.restoreAllMocks();
  });

  it('offers exactly three options and defaults to Off', () => {
    renderSettings();
    passGate();
    const group = screen.getByRole('radiogroup', { name: /challenge hearts/i });
    const radios = screen.getAllByRole('radio');
    expect(group).toBeTruthy();
    expect(radios.length).toBe(3);
    expect(screen.getByRole('radio', { name: /off/i }).getAttribute('aria-checked')).toBe('true');
  });

  it('picking 3 hearts checks it and persists the choice', () => {
    renderSettings();
    passGate();
    fireEvent.click(screen.getByRole('radio', { name: '3 ❤️' }));
    expect(screen.getByRole('radio', { name: '3 ❤️' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: /off/i }).getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem('heartsMode')).toBe('3');
  });

  it('picking 5 hearts, then Off, writes both choices through', () => {
    renderSettings();
    passGate();
    fireEvent.click(screen.getByRole('radio', { name: '5 ❤️' }));
    expect(localStorage.getItem('heartsMode')).toBe('5');
    fireEvent.click(screen.getByRole('radio', { name: /off/i }));
    expect(localStorage.getItem('heartsMode')).toBe('off');
  });

  it('reads the stored choice back on a fresh visit', () => {
    localStorage.setItem('heartsMode', '5');
    renderSettings();
    passGate();
    expect(screen.getByRole('radio', { name: '5 ❤️' }).getAttribute('aria-checked')).toBe('true');
  });

  it('every option keeps a 44 px touch target', () => {
    renderSettings();
    passGate();
    for (const radio of screen.getAllByRole('radio')) {
      expect(Number.parseInt(radio.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('A11y: Settings with the hearts control', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
    localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(async () => {
    // Unmount before tearing the database down: RTL's own cleanup runs after this
    // hook, so a still-mounted SettingsPage would react to db.delete() outside
    // act() and warn.
    cleanup();
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.restoreAllMocks();
  });

  it('has no axe violations once the gate is open', async () => {
    const { container } = renderSettings();
    passGate();
    // axe walks the DOM asynchronously; let the page's mount-time progress read
    // land inside act() first rather than during the scan.
    await act(async () => {});
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
