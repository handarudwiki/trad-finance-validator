import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    root: '.',
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
