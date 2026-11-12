import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * After the build, write dist/sw.js: the service worker from scripts/sw-template.js with
 * every built file listed (so the whole game is cached for offline play) and a version
 * that changes whenever any file changes (so players get an "update available" banner).
 */
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'tvec-service-worker',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = join(dir, name);
          if (statSync(p).isDirectory()) walk(p);
          else if (name !== 'sw.js' && !name.endsWith('.map') && !name.startsWith('.')) files.push(p);
        }
      };
      walk(outDir);
      const hash = createHash('sha256');
      const urls = files.sort().map((f) => {
        hash.update(f).update(readFileSync(f));
        return './' + relative(outDir, f).split(sep).join('/');
      });
      const list = ['./', ...urls.filter((u) => u !== './index.html'), './index.html'];
      const sw = readFileSync('scripts/sw-template.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('= __FILES__;', `= ${JSON.stringify(list)};`);
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`service worker: ${list.length} files cached for offline play`);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Relative asset URLs work on both a user site and a project site such as
  // https://username.github.io/repository-name/.
  base: './',
  test: { globals: true, environment: 'node' },
});
