import { defineConfig } from 'vitest/config';

// Long-running balance and mission playtests. Kept out of `npm test` and CI.
export default defineConfig({
  test: { globals: true, environment: 'node', include: ['src/**/*.playtest.ts'], testTimeout: 1_800_000 },
});
