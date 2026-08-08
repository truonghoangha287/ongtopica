import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';

vi.mock('@/shared/utils/speak', () => ({ speak: vi.fn() }));
vi.mock('@/shared/utils/sfx', () => ({
  playWin: vi.fn(), playCorrect: vi.fn(), playBuzz: vi.fn(),
}));

const renderGame = (gameId: string) =>
  render(
    <MemoryRouter initialEntries={[`/grammar/${gameId}`]}>
      <Routes>
        <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
      </Routes>
    </MemoryRouter>,
  );

/** Tap the correct option for the round currently on screen. */
async function answerCorrectly() {
  const buttons = await screen.findAllByTestId('drill-option');
  const correct = buttons.find((b) => b.getAttribute('data-correct') === 'true');
  if (!correct) throw new Error('no correct option rendered');
  await userEvent.click(correct);
}

describe('GrammarDrillPage', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open();
    useProfileStore.setState({ activeProfileId: 'child-1' });
  });

  afterEach(async () => {
    await db.delete();
    await db.open();
    useProfileStore.setState({ activeProfileId: null });
    vi.clearAllMocks();
  });

  it('renders a question with options', async () => {
    renderGame('plurals');
    expect((await screen.findAllByTestId('drill-option')).length).toBeGreaterThanOrEqual(2);
  });

  it('shows an unknown-game message for a bad id', async () => {
    renderGame('nope');
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it('records a first-attempt correct answer', async () => {
    renderGame('plurals');
    await answerCorrectly();
    await waitFor(async () => {
      expect(await db.ruleMastery.count()).toBe(1);
    });
    const rows = await db.ruleMastery.toArray();
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].correct).toBe(1);
  });

  it('records a wrong first attempt and does not advance', async () => {
    renderGame('plurals');
    const buttons = await screen.findAllByTestId('drill-option');
    const wrong = buttons.find((b) => b.getAttribute('data-correct') === 'false')!;
    await userEvent.click(wrong);

    await waitFor(async () => {
      expect(await db.ruleMastery.count()).toBe(1);
    });
    const rows = await db.ruleMastery.toArray();
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].correct).toBe(0);
    expect(screen.getByTestId('drill-progress')).toHaveTextContent('0 of 10');
  });

  it('records only the first attempt, not the retry', async () => {
    renderGame('plurals');
    const buttons = await screen.findAllByTestId('drill-option');
    const wrong = buttons.find((b) => b.getAttribute('data-correct') === 'false')!;
    await userEvent.click(wrong);
    await answerCorrectly();

    await waitFor(async () => {
      const rows = await db.ruleMastery.toArray();
      const total = rows.reduce((n, r) => n + r.attempts, 0);
      expect(total).toBe(1);
    });
  });

  it('reaches a celebration after ten rounds', async () => {
    renderGame('plurals');
    for (let i = 0; i < 10; i++) await answerCorrectly();
    expect(await screen.findByText(/great job/i)).toBeInTheDocument();
  });

  it('opens the bed anchor before the first b/d round', async () => {
    renderGame('bd');
    expect(await screen.findByText(/make a bed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect((await screen.findAllByTestId('drill-option')).length).toBe(2);
  });

  it('does not show the bed anchor in the plurals game', async () => {
    renderGame('plurals');
    await screen.findAllByTestId('drill-option');
    expect(screen.queryByText(/make a bed/i)).not.toBeInTheDocument();
  });
});
