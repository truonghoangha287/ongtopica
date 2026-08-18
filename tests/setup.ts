import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// canvas-confetti uses HTMLCanvasElement which jsdom doesn't support — mock it
// globally. `reset()` hangs off the default export in the real library too.
vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));
