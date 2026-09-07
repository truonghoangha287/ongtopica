import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// --- In-memory Dexie stand-in (no IndexedDB in jsdom). ---
const rows = {
  topic: new Map<string, { id: string; stars: number; level: number; topicId: string; childId: string }>(),
  profile: new Map<string, unknown>(),
};
vi.mock('@/shared/db/db', () => ({
  db: {
    mathTopicProgress: {
      get: async (id: string) => rows.topic.get(id),
      put: async (row: { id: string }) => void rows.topic.set(row.id, row as never),
      where: () => ({ equals: () => ({ toArray: async () => [...rows.topic.values()] }) }),
    },
    mathProfileState: {
      get: async (id: string) => rows.profile.get(id),
      put: async (row: { id: string }) => void rows.profile.set(row.id, row),
    },
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

import { NumberLabQuizPage } from '@/math/pages/NumberLabQuizPage';
import { NumberLabPillar } from '@/math/components/NumberLabPillar';
import { getPracticeQuiz, PRACTICE_STAGES } from '@/math/data/number-lab';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { practiceTopicId } from '@/math/services/practice-progress';
import { PRACTICE_STAGE_SIZE } from '@/math/constants/math-constants';

/** Stage 4 — "Hidden in a minus", the form the Number Lab exists for. */
const TAKEAWAY = 4;

function renderStage(stage: string) {
  return render(
    <MemoryRouter initialEntries={[`/math/practice/${stage}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/math/practice/:stage" element={<NumberLabQuizPage />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

/** Tap a number tile, then Check, then Continue/Finish. */
async function answerWith(user: ReturnType<typeof userEvent.setup>, value: number, primary: RegExp) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^(Tap ${value}$|${value}, )`) }));
  await user.click(screen.getByRole('button', { name: /^Check$/ }));
  await user.click(screen.getByRole('button', { name: primary }));
}

/** The question currently on screen. */
function currentQuestion() {
  const { questions, qIndex } = useMathQuizStore.getState();
  return questions[qIndex];
}

/** The number that answers the question currently on screen. */
function currentAnswer(): number {
  return currentQuestion().answerValue as number;
}

beforeEach(() => {
  rows.topic.clear();
  rows.profile.clear();
  useMathQuizStore.getState().reset();
  localStorage.clear();
});

describe('Number Lab · a stage play-through', () => {
  it('asks a missing-number question and accepts the answer from the 0–10 tile strip', async () => {
    const user = userEvent.setup();
    renderStage('takeaway');
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    // The full 0–10 strip is available — this is not a four-option guess.
    for (let n = 0; n <= 10; n++) {
      expect(screen.getByRole('button', { name: `Tap ${n}` })).toBeTruthy();
    }
    // The unknown is drawn as an empty box she can see her own answer land in.
    expect(screen.getByLabelText('the hidden number').textContent).toBe('?');

    await user.click(screen.getByRole('button', { name: `Tap ${currentAnswer()}` }));
    await user.click(screen.getByRole('button', { name: /^Check$/ }));
    expect(screen.getByRole('status').textContent).toBe(i18n.t('quiz.correctMood', { ns: 'math' }));
  });

  it('never shows hearts or a game over, however many she gets wrong', async () => {
    const user = userEvent.setup();
    renderStage('takeaway');
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    expect(screen.queryByRole('img', { name: /hearts/i })).toBeNull();

    // Three wrong answers would end a hive quiz; here the run simply continues.
    for (let i = 0; i < 3; i++) {
      const wrong = currentAnswer() === 1 ? 2 : 1;
      await answerWith(user, wrong, /^Continue$/);
    }
    expect(screen.queryByText(/Out of hearts|Try again/i)).toBeNull();
    expect(screen.getByRole('group', { name: 'Numbers 0 to 10' })).toBeTruthy();
  });

  it('re-asks a missed question later in the set and credits the second try', async () => {
    const user = userEvent.setup();
    renderStage('takeaway');
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    const missedId = useMathQuizStore.getState().questions[0].id;
    const wrong = currentAnswer() === 1 ? 2 : 1;
    await answerWith(user, wrong, /^Continue$/);

    // The miss is appended once, so the set grows beyond the first pass.
    const { questions, originalTotal, requeuedIds } = useMathQuizStore.getState();
    expect(originalTotal).toBe(PRACTICE_STAGE_SIZE);
    expect(questions.length).toBe(PRACTICE_STAGE_SIZE + 1);
    expect(questions[questions.length - 1].id).toBe(missedId);
    expect(requeuedIds).toEqual([missedId]);

    // Answer the rest correctly, then the re-asked one, which counts as recovered.
    while (useMathQuizStore.getState().qIndex < PRACTICE_STAGE_SIZE) {
      await answerWith(user, currentAnswer(), /^Continue$/);
    }
    expect(screen.getByText(/Second look/)).toBeTruthy();
    await answerWith(user, currentAnswer(), /^Finish$/);

    expect(await screen.findByText('Nice thinking!')).toBeTruthy();
    expect(screen.getByText('fixed on the 2nd try')).toBeTruthy();
  });

  it('records best stars and advances the attempt cursor for the active child', async () => {
    const user = userEvent.setup();
    renderStage('takeaway');
    await screen.findByRole('group', { name: 'Numbers 0 to 10' });

    for (let i = 0; i < PRACTICE_STAGE_SIZE; i++) {
      await answerWith(user, currentAnswer(), i === PRACTICE_STAGE_SIZE - 1 ? /^Finish$/ : /^Continue$/);
    }
    await screen.findByText('Nice thinking!');

    const row = rows.topic.get(`test-child:${practiceTopicId(TAKEAWAY)}`);
    expect(row).toBeDefined();
    expect(row?.stars).toBe(3);
    expect(row?.level).toBe(2); // attempt cursor → next run gets a fresh window
  });

  it('does not leak practice rows into the hive progress map', async () => {
    rows.topic.set('test-child:numberlab:4', {
      id: 'test-child:numberlab:4', childId: 'test-child', topicId: 'numberlab:4', stars: 3, level: 2,
    });
    rows.topic.set('test-child:addsub', {
      id: 'test-child:addsub', childId: 'test-child', topicId: 'addsub', stars: 2, level: 3,
    });
    const { useMathProgress } = await import('@/math/hooks/useMathProgress');
    const { getTopicProgress } = useMathProgress();
    expect(await getTopicProgress()).toEqual({ addsub: { stars: 2, level: 3 } });
  });
});

describe('Number Lab · comparison questions', () => {
  it('reveals a glyph as a noun phrase, so the sentence still reads', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/math/practice/compare']}>
        <I18nextProvider i18n={i18n}>
          <Routes>
            <Route path="/math/practice/:stage" element={<NumberLabQuizPage />} />
            <Route path="/" element={<div>HOME</div>} />
          </Routes>
        </I18nextProvider>
      </MemoryRouter>,
    );
    await screen.findByRole('button', { name: /^Check$/ });

    // Stage 6 mixes glyph questions with one-more / one-less tiles, so walk the
    // run forward until a comparison is actually on screen.
    for (let step = 0; step < PRACTICE_STAGE_SIZE && currentQuestion().input !== 'symbols'; step++) {
      await answerWith(user, currentAnswer(), /^Continue$/);
    }
    expect(currentQuestion().input).toBe('symbols');

    // Deliberately tap the wrong glyph to force a reveal.
    const { questions, qIndex } = useMathQuizStore.getState();
    const wrongIndex = questions[qIndex].answer === 0 ? 1 : 0;
    const wrongName = ['is less than', 'is greater than', 'is equal to'][wrongIndex];
    await user.click(screen.getByRole('button', { name: wrongName }));
    await user.click(screen.getByRole('button', { name: /^Check$/ }));

    const mood = screen.getByRole('status').textContent ?? '';
    // The button is named with a verb phrase ("is greater than"); dropping it
    // straight into "it's {{answer}}" would read "it's is greater than".
    expect(mood).not.toMatch(/it's is /);
    expect(mood).toMatch(/it's (less|greater) than|it's equal to/);
  });
});

describe('Number Lab · the stage picker', () => {
  it('opens every stage, so she can go straight to the one she needs', async () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <NumberLabPillar />
        </I18nextProvider>
      </MemoryRouter>,
    );
    await screen.findByRole('button', { name: /Warm up, stage 1/ });

    for (const stage of PRACTICE_STAGES) {
      const card = screen.getByRole('button', {
        name: new RegExp(`${i18n.t(stage.nameKey, { ns: 'math' })}, stage ${stage.index}`),
      });
      expect((card as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it('serves a different window on the second attempt', () => {
    expect(getPracticeQuiz(TAKEAWAY, 2).map((q) => q.id)).not.toEqual(
      getPracticeQuiz(TAKEAWAY, 1).map((q) => q.id),
    );
  });
});
