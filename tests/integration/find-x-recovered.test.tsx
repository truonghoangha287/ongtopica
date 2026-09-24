import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const rows = { topic: new Map<string, unknown>() };
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: { get: async () => undefined, put: async () => undefined, where: () => ({ equals: () => ({ toArray: async () => [] }) }) },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));
vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { FindXPage } from '@/math/pages/FindXPage';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { deriveSteps } from '@/math/services/find-x-steps';
import type { FindXProblem } from '@/math/types/find-x.types';

beforeEach(() => rows.topic.clear());

function renderStage(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/findx/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/findx/:stage" element={<FindXPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

const tileName = (value: number) => i18n.t('findx.tile.tap', { ns: 'math', value });

type User = ReturnType<typeof userEvent.setup>;

/**
 * Play one solo problem (compute, then check) and press on. `miss` taps tile 0
 * on the compute strip first — never the answer, since the generator keeps x ≥ 1.
 */
async function playProblem(user: User, problem: FindXProblem, miss: boolean) {
  if (miss) await user.click(screen.getByRole('button', { name: tileName(0) }));
  for (const step of deriveSteps(problem, 'solo')) {
    const right = step.options.find((o) => o.correct)!;
    const name = step.input === 'tiles' ? tileName(right.value!) : right.label!;
    await user.click(screen.getAllByRole('button', { name })[0]);
  }
  await user.click(screen.getByRole('button', { name: /Tiếp tục|Xong rồi/ }));
}

describe('Find X — the 💪 tile the parent reads', () => {
  /**
   * The counter only diverges from the shipped `mastered − masteredClean` when some
   * problem is missed TWICE: that expression is R+D, while the rest of the app
   * (`math-quiz-store.recoveredCount`) means R−D. So the run below misses two
   * problems on the first pass and recovers only one of them — R=2, D=1, and
   * the tile must read 1, not 3.
   *
   * Driven through `FindXPage` rather than the reducer alone, because the wrong
   * expression lived in the page's reward effect, not in the run state.
   */
  it('counts only the problem that was missed and then put right', async () => {
    const user = userEvent.setup();
    const problems = composeFindXRun('solo', 1);
    renderStage('findxSolo');
    await screen.findByRole('group', { name: /bằng bao nhiêu/ });

    // First pass: miss the first two, answer the rest cleanly.
    for (const [i, problem] of problems.entries()) await playProblem(user, problem, i < 2);
    // The re-asks, appended in order: the first is put right, the second missed again.
    await playProblem(user, problems[0], false);
    await playProblem(user, problems[1], true);

    await screen.findByRole('heading', { level: 1 });
    const label = screen.getByText(i18n.t('reward.recovered', { ns: 'math' }));
    expect(label.parentElement?.textContent).toBe(`💪1${label.textContent}`);
  });
});
