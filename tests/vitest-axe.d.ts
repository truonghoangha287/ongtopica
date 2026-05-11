import type { AxeResults } from 'vitest-axe';

declare module 'vitest' {
  interface Assertion<R = unknown> {
    toHaveNoViolations(): R;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export type { AxeResults };
