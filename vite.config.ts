import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs work on both a user site and a project site such as
  // https://username.github.io/repository-name/.
  base: './',
  test: { globals: true, environment: 'node' },
});
