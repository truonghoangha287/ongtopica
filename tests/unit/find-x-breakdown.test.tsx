import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithI18n } from '../i18n-test-utils';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { FindXStats } from '@/math/services/find-x-run';

const STATS: FindXStats = {
  asked: { read: 0, role: 10, operation: 10, operands: 10, compute: 10, check: 10 },
  missed: { read: 0, role: 1, operation: 2, operands: 4, compute: 1, check: 0 },
  reveals: 0,
};

const base = {
  variant: 'practice' as const,
  topicName: 'Tìm X từng bước',
  level: 7,
  stars: 2 as const,
  streak: 3,
  accuracy: 80,
  onNext: vi.fn(),
  onBackToHive: vi.fn(),
};

describe('reward breakdown', () => {
  it('reports right-first-time per decision, so a parent can tell the two failures apart', () => {
    renderWithI18n(<MathRewardScreen {...base} breakdown={STATS} />);
    // operation 10 asked / 2 missed -> 8/10; operands -> 6/10; compute -> 9/10
    const line = screen.getByTestId('findx-breakdown');
    expect(line.textContent).toBe('Chọn đúng phép tính 8/10 · Lấy đúng số 6/10 · Tính đúng 9/10');
    expect(line).toHaveAttribute('lang', 'vi');
  });

  it('is absent when no breakdown is passed, so every other pillar is untouched', () => {
    renderWithI18n(<MathRewardScreen {...base} />);
    expect(screen.queryByTestId('findx-breakdown')).toBeNull();
  });

  it('omits a decision the stage never asked', () => {
    const soloStats: FindXStats = {
      asked: { read: 0, role: 0, operation: 0, operands: 0, compute: 10, check: 10 },
      missed: { read: 0, role: 0, operation: 0, operands: 0, compute: 3, check: 0 },
      reveals: 2,
    };
    renderWithI18n(<MathRewardScreen {...base} breakdown={soloStats} />);
    const line = screen.getByTestId('findx-breakdown');
    expect(line.textContent).toBe('Tính đúng 7/10');
    expect(line.textContent).not.toContain('0/0');
  });
});
