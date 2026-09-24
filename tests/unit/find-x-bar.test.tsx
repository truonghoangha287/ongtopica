import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { PartWholeBar } from '@/math/components/PartWholeBar';
import type { FindXProblem } from '@/math/types/find-x.types';

const PART_UNKNOWN: FindXProblem = { id: 'b1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const WHOLE_UNKNOWN: FindXProblem = { id: 'b2', form: 'x-a=b', a: 8, b: 5, x: 13 };
const PART_UNKNOWN_A_MINUS_X: FindXProblem = { id: 'b3', form: 'a-x=b', a: 20, b: 12, x: 8 };
// x + 19 = 20 (a=19, b=20, x=1) — a problem the generator can really produce,
// where the known part (19) is a large fraction of the whole (20). This is
// what let the old two-sided-unclamped width arithmetic overflow the viewBox.
const NEAR_WHOLE: FindXProblem = { id: 'b4', form: 'x+a=b', a: 19, b: 20, x: 1 };

const VIEW_W = 400;
const MIN_BAR_W = 40;

describe('PartWholeBar', () => {
  it('states the relationship in words for a screen reader', () => {
    renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toBe(
      'Cả tổng 14, gồm một phần 6 và phần đang đi tìm',
    );
  });

  it('states the relationship in words for the whole-unknown form', () => {
    renderWithI18n(<PartWholeBar problem={WHOLE_UNKNOWN} solved={false} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toBe(
      'Hai phần 8 và 5, còn cả tổng là số đang đi tìm',
    );
  });

  it('hides the answer until the problem is solved', () => {
    const { rerender } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(screen.queryByText('8')).toBeNull();
    rerender(<PartWholeBar problem={PART_UNKNOWN} solved />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('draws the whole as the unknown in the x-minus form', () => {
    renderWithI18n(<PartWholeBar problem={WHOLE_UNKNOWN} solved={false} />);
    // Both parts are visible; the total is the one hidden.
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('13')).toBeNull();
  });

  it('draws the second part as the unknown in the a-minus-x form', () => {
    renderWithI18n(<PartWholeBar problem={PART_UNKNOWN_A_MINUS_X} solved={false} />);
    // The whole (20) and the known part (12) are visible; x (8) is hidden.
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.queryByText('8')).toBeNull();
  });

  it('marks itself vi so a screen reader does not read it as English', () => {
    const { container } = renderWithI18n(<PartWholeBar problem={PART_UNKNOWN} solved={false} />);
    expect(container.querySelector('[lang="vi"]')).not.toBeNull();
  });

  it('keeps both part bars within the whole bar above them, even when one part is nearly the whole', () => {
    const { container } = renderWithI18n(<PartWholeBar problem={NEAR_WHOLE} solved={false} />);
    const svg = container.querySelector('svg');
    // The whole bar is the first rect; the two part bars are the next two,
    // queried by position since they are decorative children of the labelled svg.
    const [, knownRect, otherRect] = Array.from(svg?.querySelectorAll('rect') ?? []);

    for (const rect of [knownRect, otherRect]) {
      const x = Number(rect.getAttribute('x'));
      const width = Number(rect.getAttribute('width'));
      expect(width).toBeGreaterThanOrEqual(MIN_BAR_W);
      expect(x + width).toBeLessThanOrEqual(VIEW_W);
    }
  });
});
