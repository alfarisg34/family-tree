import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFamilyExpansion } from '../src/utils/zoomSpacing.ts';

test('families reserve compact space when zoomed out and full space before children appear', () => {
  assert.equal(getFamilyExpansion(1, 0.08), 1);
  assert.equal(getFamilyExpansion(2, 0.27), 0);
  assert.equal(getFamilyExpansion(2, 0.5), 1);
  assert.equal(getFamilyExpansion(3, 0.5), 0);
  assert.equal(getFamilyExpansion(3, 0.85), 1);
});

test('spacing expands monotonically and reversibly without jumps at tier boundaries', () => {
  for (const generation of [2, 3, 4]) {
    let previous = 0;
    for (let scale = 0.08; scale <= 1; scale += 0.001) {
      const next = getFamilyExpansion(generation, scale);
      assert.ok(next >= previous && next - previous < 0.01);
      previous = next;
    }
    for (const boundary of [0.28, 0.5, 0.85]) {
      assert.ok(Math.abs(getFamilyExpansion(generation, boundary - 0.0001) - getFamilyExpansion(generation, boundary + 0.0001)) < 0.002);
    }
  }
});
