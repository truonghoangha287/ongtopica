import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // `.claude/worktrees/` holds abandoned checkouts whose stale test copies
    // resolve `@/` back to this repo's src, so they fail against current code
    // and drown out real results. Only this checkout's tests should run.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
