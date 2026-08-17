import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeartRow } from '@/english/vocab/components/heart-row';

describe('HeartRow', () => {
  it('renders nothing when hearts are off', () => {
    const { container } = render(<HeartRow remaining={0} max={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces how many hearts are left', () => {
    render(<HeartRow remaining={2} max={3} />);
    expect(screen.getByTestId('heart-row')).toHaveTextContent('2 of 3 hearts left');
  });

  it('is a polite live region so a lost heart is announced', () => {
    render(<HeartRow remaining={2} max={3} />);
    const row = screen.getByTestId('heart-row');
    expect(row.getAttribute('role')).toBe('status');
    expect(row.getAttribute('aria-live')).toBe('polite');
  });

  it('renders one glyph per heart, spent ones greyed', () => {
    render(<HeartRow remaining={2} max={5} />);
    const glyphs = Array.from(
      screen.getByTestId('heart-row').querySelectorAll('[aria-hidden="true"]'),
    ).map((el) => el.textContent);
    expect(glyphs.filter((g) => g === '❤️').length).toBe(2);
    expect(glyphs.filter((g) => g === '🤍').length).toBe(3);
  });

  it('renders every heart full at the start of a session', () => {
    render(<HeartRow remaining={3} max={3} />);
    const glyphs = Array.from(
      screen.getByTestId('heart-row').querySelectorAll('[aria-hidden="true"]'),
    ).map((el) => el.textContent);
    expect(glyphs).toEqual(['❤️', '❤️', '❤️']);
  });
});
