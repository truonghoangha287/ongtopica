import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// canvas-confetti uses HTMLCanvasElement which jsdom doesn't support — mock it globally
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
