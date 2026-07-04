import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// The child is on level 3 of Counting, having cleared level 1 (3★) and level 2 (2★).
const topicRows = [{ id: 'test-child:counting', childId: 'test-child', topicId: 'counting', stars: 2, level: 3 }];
const levelRows = [
  { id: 'test-child:counting:1', childId: 'test-child', topicId: 'counting', level: 1, stars: 3 },
  { id: 'test-child:counting:2', childId: 'test-child', topicId: 'counting', level: 2, stars: 2 },
];

vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => topicRows.find((r) => r.id === id),
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => topicRows }) }),
    },
    mathProfileState: { get: async () => ({ honey: 0, streak: 4, hivesToday: 0 }), put: async () => undefined },
    mathLevelResults: {
      get: async () => undefined,
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => levelRows }) }),
    },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));

vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { TopicJourneyPage } from '@/math/pages/TopicJourneyPage';

function renderJourney() {
  return render(
    <MemoryRouter initialEntries={['/math/topic/counting']}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/topic/:id" element={<TopicJourneyPage />} />
          <Route path="/math/quiz/:id" element={<div>QUIZ</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('Topic journey map (data-driven)', () => {
  it('renders cleared levels with their real stars, the current START node, and locked levels ahead', async () => {
    renderJourney();

    // Current level 3 is the pulsing START node.
    expect(await screen.findByRole('button', { name: 'Start Counting level 3' })).toBeInTheDocument();

    // Cleared levels show the stars actually earned (3★ on L1, 2★ on L2).
    expect(screen.getByRole('img', { name: 'Level cleared, 3 of 3 stars' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Level cleared, 2 of 3 stars' })).toBeInTheDocument();

    // Levels above the current one are locked (levels 4..12 → 9 locked nodes).
    expect(screen.getAllByRole('img', { name: 'Locked level' })).toHaveLength(9);

    // Header reflects the real level, not a fixed sample.
    expect(screen.getByText('Level 3 of 12 · keep going!')).toBeInTheDocument();
  });
});
