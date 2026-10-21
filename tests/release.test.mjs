import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { CHANGELOG_DATA, LATEST_VERSION, LATEST_VERSION_LABEL } from '../src/data/changelog.ts';

test('published release data, package metadata and documentation share one version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.match(LATEST_VERSION, /^0\.\d+\.\d+$/);
  assert.equal(pkg.version, LATEST_VERSION);
  assert.equal(lock.version, LATEST_VERSION);
  assert.equal(lock.packages[''].version, LATEST_VERSION);
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
  assert.ok(changelog.includes(`## [${LATEST_VERSION_LABEL}] - ${CHANGELOG_DATA[0].date}`));
  for (const file of ['PRD.md', 'Design.md', 'Schema.md', 'Architecture.md']) {
    assert.ok(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').includes(`Versi aplikasi: \`${LATEST_VERSION}\``), file);
  }
});
