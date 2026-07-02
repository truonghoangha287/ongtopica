import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// --- In-memory Dexie stand-in (no IndexedDB in jsdom). ---
const rows = { topic: new Map<string, unknown>(), profile: new Map<string, unknown>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: {
      get: async (id: string) => rows.profile.get(id),
      put: async (row: { id: string }) => void rows.profile.set(row.id, row),
    },
  },
}));

vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { MathQuizPage } from '@/math/pages/MathQuizPage';

function renderQuiz(topic: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/quiz/${topic}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/quiz/:id" element={<MathQuizPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/** Answer one question: click the option, Check, then Continue/Finish. */
async function answer(user: ReturnType<typeof userEvent.setup>, label: string, primary: RegExp) {
  await user.click(await screen.findByRole('button', { name: `Answer ${label}` }));
  await user.click(screen.getByRole('button', { name: 'Check' }));
  await user.click(await screen.findByRole('button', { name: primary }));
}

describe('Math quiz play-through (Add & Subtract)', () => {
  beforeEach(() => {
    rows.topic.clear();
    rows.profile.clear();
  });

  it('runs start → answer → completion → reward, and persists mastery + honey', async () => {
    const user = userEvent.setup();
    renderQuiz('addsub');

    // addsub answers: 7+5=12, 13−6=7, 9+▢=15 → 6 (all correct → 3 stars).
    await answer(user, '12', /Continue/);
    await answer(user, '7', /Continue/);
    await answer(user, '6', /Finish/);

    // Reward screen appears with a clean 3-star result.
    expect(await screen.findByText('Hive cleared!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument();

    // Progression + economy were written to the (mock) DB.
    const topicRow = rows.topic.get('test-child:addsub') as { stars: number } | undefined;
    expect(topicRow?.stars).toBe(3);
    const profileRow = rows.profile.get('test-child') as { honey: number; streak: number } | undefined;
    expect(profileRow?.honey).toBe(40);
    expect(profileRow?.streak).toBe(1);
  });

  it('spends a heart on a wrong answer', async () => {
    const user = userEvent.setup();
    renderQuiz('addsub');

    // First question 7+5=12; pick a wrong option (11).
    await user.click(await screen.findByRole('button', { name: 'Answer 11' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));

    // One heart lost → two full hearts remain.
    expect(await screen.findByLabelText('2 hearts left')).toBeInTheDocument();
  });
});
