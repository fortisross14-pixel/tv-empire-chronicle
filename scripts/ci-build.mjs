// CI entry point: type-check, run engine tests, then build.
// Tools are run through node directly so a non-executable .bin shim can't break CI.
import { execFileSync } from 'node:child_process';

const run = (script, args) =>
  execFileSync(process.execPath, [script, ...args], { stdio: 'inherit' });

try {
  run('./node_modules/typescript/bin/tsc', ['--noEmit']);
  run('./node_modules/vitest/vitest.mjs', ['run']);
  run('./node_modules/vite/bin/vite.js', ['build']);
  console.log('\nCI validation passed.');
} catch {
  console.error('\nCI validation failed.');
  process.exitCode = 1;
}
