import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** All .html pages of a fixture directory, sorted (index.html first). */
export function listFixturePages(fixtureDir) {
  const dir = resolve(fixtureDir);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
    .map((f) => join(dir, f));
}

/** All fixture directories under fixtures/, sorted by number prefix. */
export function listFixtures(fixturesRoot) {
  const root = resolve(fixturesRoot);
  return readdirSync(root)
    .filter((f) => statSync(join(root, f)).isDirectory())
    .sort()
    .map((f) => join(root, f));
}
