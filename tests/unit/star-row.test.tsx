import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarRow, starCount } from '@/english/vocab/components/star-row';
import type { WordProgressRow } from '@/shared/db/schema';

describe('StarRow component', () => {
  it('renders 0 of 4 stars with correct aria-label', () => {
    render(<StarRow stars={0} />);
    expect(screen.getByLabelText('0 of 4 stars earned')).toBeTruthy();
  });

  it('renders 2 of 4 stars with correct aria-label', () => {
    render(<StarRow stars={2} />);
    expect(screen.getByLabelText('2 of 4 stars earned')).toBeTruthy();
  });

  it('renders 4 of 4 stars with correct aria-label', () => {
    render(<StarRow stars={4} />);
    expect(screen.getByLabelText('4 of 4 stars earned')).toBeTruthy();
  });

  it('renders correct number of filled star characters', () => {
    const { container } = render(<StarRow stars={3} />);
    const spans = container.querySelectorAll('[aria-hidden="true"]');
    const filled = Array.from(spans).filter((s) => s.textContent === '★');
    const empty = Array.from(spans).filter((s) => s.textContent === '☆');
    expect(filled.length).toBe(3);
    expect(empty.length).toBe(1);
  });

  it('respects custom max prop', () => {
    render(<StarRow stars={2} max={3} />);
    expect(screen.getByLabelText('2 of 3 stars earned')).toBeTruthy();
  });
});

describe('starCount helper', () => {
  const base: WordProgressRow = {
    id: 'c:w',
    childId: 'c',
    wordId: 'w',
    wordSetId: 'test',
    stage: 1,
    consecutiveCorrect: 0,
    totalIncorrect: 0,
    priorityScore: 1.0,
    lastReviewedAt: 0,
    introducedAt: null,
  };

  it('returns 0 when progress is undefined', () => {
    expect(starCount(undefined)).toBe(0);
  });

  it('returns 0 when stage=1 and not introduced', () => {
    expect(starCount({ ...base, stage: 1, introducedAt: null })).toBe(0);
  });

  it('returns 1 when stage=1 and introducedAt is set', () => {
    expect(starCount({ ...base, stage: 1, introducedAt: 1000 })).toBe(1);
  });

  it('returns 2 when stage=2', () => {
    expect(starCount({ ...base, stage: 2, introducedAt: 1000 })).toBe(2);
  });

  it('returns 3 when stage=3', () => {
    expect(starCount({ ...base, stage: 3, introducedAt: 1000 })).toBe(3);
  });

  it('returns 4 when stage=4 (fully mastered)', () => {
    expect(starCount({ ...base, stage: 4, introducedAt: 1000 })).toBe(4);
  });

  it('legacy fully-mastered word (stage=4) shows 4 stars — no regression', () => {
    // Back-filled word from v1: has stage 4, introducedAt back-filled
    expect(starCount({ stage: 4, introducedAt: 999 })).toBe(4);
  });
});
