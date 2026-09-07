import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Mock Dexie so no IndexedDB is needed in jsdom.
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async () => undefined,
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => [] }) }),
    },
    mathProfileState: { get: async () => undefined, put: async () => undefined },
    mathLevelResults: {
      get: async () => undefined,
      put: async () => undefined,
      where: () => ({ equals: () => ({ toArray: async () => [] }) }),
    },
    mathOlympiadState: { get: async () => undefined, put: async () => undefined },
  },
}));

vi.mock('@/shared/store/profile-store', () => ({
  useProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'test-child' }),
}));

import { MathHub } from '@/math/components/MathHub';
import { TopicJourneyPage } from '@/math/pages/TopicJourneyPage';
import { MathQuizPage } from '@/math/pages/MathQuizPage';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import { NumberLabPillar } from '@/math/components/NumberLabPillar';
import { NumberLabQuizPage } from '@/math/pages/NumberLabQuizPage';

function wrap(ui: React.ReactElement, path = '/', route = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path={route} element={ui} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('A11y: Math World screens', () => {
  it('MathHub has no axe violations', async () => {
    const { container } = wrap(<MathHub economy={{ honey: 320, streak: 5, hivesToday: 2 }} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TopicJourneyPage has no axe violations', async () => {
    const { container } = wrap(<TopicJourneyPage />, '/math/topic/counting', '/math/topic/:id');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('MathQuizPage has no axe violations', async () => {
    const { container } = wrap(<MathQuizPage />, '/math/quiz/counting', '/math/quiz/:id');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('NumberLabPillar has no axe violations', async () => {
    const { container, findByRole } = wrap(<NumberLabPillar />);
    await findByRole('button', { name: /Warm up, stage 1/ });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('NumberLabQuizPage has no axe violations on a number-tile question', async () => {
    const { container, findByRole } = wrap(
      <NumberLabQuizPage />, '/math/practice/takeaway', '/math/practice/:stage',
    );
    await findByRole('group', { name: /Numbers 0 to 10/ });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('NumberLabQuizPage has no axe violations on a comparison question', async () => {
    const { container, findAllByRole } = wrap(
      <NumberLabQuizPage />, '/math/practice/compare', '/math/practice/:stage',
    );
    // Stage 6 mixes glyph and tile questions; whichever widget shows must be
    // clean, and every glyph must carry a spoken name rather than a bare "<".
    const answers = await findAllByRole('button', {
      name: /is less than|is greater than|is equal to|^Tap /,
    });
    expect(answers.length).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('MathRewardScreen has no axe violations', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MathRewardScreen
          variant="hive"
          topicName="Counting"
          level={4}
          stars={3}
          streak={5}
          accuracy={100}
          onNext={() => {}}
          onBackToHive={() => {}}
        />
      </I18nextProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('MathRewardScreen has no axe violations in its practice variant', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MathRewardScreen
          variant="practice"
          topicName="Hidden in a minus"
          level={4}
          stars={2}
          streak={3}
          accuracy={90}
          recovered={2}
          onNext={() => {}}
          onBackToHive={() => {}}
        />
      </I18nextProvider>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
