import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitTreeViewport } from '../src/utils/viewport.ts';

test('fit keeps a wide tree visible within the actual mobile canvas', () => {
  const bounds = { minX: -1000, maxX: 2000, minY: 100, maxY: 1400 };
  const size = { width: 390, height: 620 };
  const viewport = fitTreeViewport(bounds, size);
  assert.ok(viewport.x + bounds.minX * viewport.scale >= 0);
  assert.ok(viewport.x + bounds.maxX * viewport.scale <= size.width);
  assert.ok(viewport.y + bounds.minY * viewport.scale >= 0);
  assert.ok(viewport.y + bounds.maxY * viewport.scale <= size.height);
});

test('fit centres an offset family and handles an empty tree without NaN', () => {
  const bounds = { minX: 800, maxX: 1600, minY: 500, maxY: 900 };
  const viewport = fitTreeViewport(bounds, { width: 1200, height: 700 });
  assert.equal(viewport.x + 1200 * viewport.scale, 600);
  assert.equal(viewport.y + 700 * viewport.scale, 350);
  const empty = fitTreeViewport({ minX: 0, maxX: 0, minY: 0, maxY: 0 }, { width: 320, height: 500 });
  assert.ok(Object.values(empty).every(Number.isFinite));
});
