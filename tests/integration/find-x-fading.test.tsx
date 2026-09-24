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

/**
 * Correction A: the guided chain opens on `read` when the current problem
 * carries a story, and on `role` otherwise (`deriveSteps` drops `read` when
 * `p.story` is undefined). Which one shows up for a given run is a generator
 * accident, not something this test should pin — so the regex admits both
 * prompts. Either is a decision ONLY the guided chain ever asks (`short`
 * starts at `operands`, `solo` at `compute`), so a stage that wrongly opened
 * on `operands` or `compute` still fails this loudly.
 */
const GUIDED_ONLY_DECISION = /Đâu là cả tổng|một phần hay là cả tổng/;

describe('Find X — fading scaffolding', () => {
  it('opens on a guided-only decision on the guided stage', async () => {
    renderStage('findxGuided');
    expect(await screen.findByRole('group', { name: GUIDED_ONLY_DECISION })).toBeInTheDocument();
  });

  it('starts the short stage at the operand choice', async () => {
    renderStage('findxShort');
    expect(await screen.findByRole('group', { name: /lấy số nào với số nào/i })).toBeInTheDocument();
  });

  it('starts the solo stage at the arithmetic', async () => {
    renderStage('findxSolo');
    expect(await screen.findByRole('group', { name: /bằng bao nhiêu/ })).toBeInTheDocument();
  });

  it('expands the full chain when the hint is asked for', async () => {
    const user = userEvent.setup();
    renderStage('findxSolo');
    await screen.findByRole('group', { name: /bằng bao nhiêu/ });
    await user.click(screen.getByRole('button', { name: 'Chỉ tôi cách làm' }));
    // Reveal always rebuilds the chain at 'guided', which restarts on the
    // same guided-only decision (read/role) as the pure guided stage above.
    expect(screen.getByRole('group', { name: GUIDED_ONLY_DECISION })).toBeInTheDocument();
    // One reveal per problem — the button is gone once used.
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });

  it('offers no hint on the guided stage, where nothing is hidden', async () => {
    renderStage('findxGuided');
    await screen.findByRole('group');
    expect(screen.queryByRole('button', { name: 'Chỉ tôi cách làm' })).toBeNull();
  });
});
