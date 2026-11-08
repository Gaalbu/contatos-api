import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/db/migrate.cli.ts'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
});
