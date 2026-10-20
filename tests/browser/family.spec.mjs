import { test, expect } from '@playwright/test';

const member = (id, fullName, generation, parentIds = [], spouses = []) => ({ id, fullName, nickname: fullName.split(' ')[0], gender: 'male', generation, isDeceased: false, avatar: '', gallery: [], parentIds, spouses, relationshipToParents: 'biological', residence: 'Bandung' });
const family = { id: 'family-test', treeId: 'family-test', slug: 'keluarga-contoh', familyTreeName: 'Keluarga Besar Bahagia', description: 'Merawat cerita, menghubungkan generasi.', updatedAt: '2026-10-11T00:00:00Z', members: {
  a: member('a', 'Hasan Pratama', 1, [], [{ spouseId: 'b', status: 'married' }]),
  b: { ...member('b', 'Aminah Pratama', 1, [], [{ spouseId: 'a', status: 'married' }]), gender: 'female' },
  c: member('c', 'Rizal Pratama', 2, ['a', 'b'], [{ spouseId: 'd', status: 'married' }]),
  d: { ...member('d', 'Sari Utami', 2, [], [{ spouseId: 'c', status: 'married' }]), gender: 'female' },
  e: { ...member('e', 'Alya Pratama', 3, ['c', 'd']), gender: 'female' },
  f: member('f', 'Dimas Pratama', 3, ['c', 'd']),
} };
async function mockApi(page, admin = false) {
  await page.route('**/api/data?**', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const body = action === 'session' ? { isAdmin: admin } : action === 'trees' ? [{ id: family.id, slug: family.slug, tree_name: family.familyTreeName }] : family;
    await route.fulfill({ json: body });
  });
}

test('landing and login use the warm theme without exposing family links', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 249, 241)');
  await expect(page.locator('a[href^="/keluarga"]')).toHaveCount(0);
  await page.screenshot({ animations: 'disabled', path: 'test-results/landing-desktop.png', fullPage: true });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Masuk admin' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/login-desktop.png' });
});

test('directory search and generation filter open a profile; Escape restores the map', async ({ page }) => {
  await mockApi(page);
  await page.goto('/keluarga-contoh');
  await page.getByRole('button', { name: 'Daftar anggota', exact: true }).click();
  const directory = page.getByRole('dialog', { name: 'Daftar anggota keluarga' });
  await expect(directory).toBeVisible();
  await directory.getByLabel('Cari anggota', { exact: true }).fill('Alya');
  await expect(directory.locator('.explorer-member')).toHaveCount(1);
  await directory.getByLabel('Generasi', { exact: true }).selectOption('1');
  await expect(directory.getByText('Belum menemukan yang dicari')).toBeVisible();
  await directory.getByLabel('Generasi', { exact: true }).selectOption('all');
  await directory.getByRole('button', { name: /Alya Pratama/ }).click();
  await expect(page.getByRole('dialog', { name: 'Profil Alya Pratama' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/profile-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Profil Alya Pratama' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/tree-desktop.png' });
});

test('dragging a person moves the map without opening their profile', async ({ page }) => {
  await mockApi(page);
  await page.goto('/keluarga-contoh');
  await expect(page.locator('.tree-node-wrapper').first()).toBeVisible();
  await page.waitForTimeout(450);
  const node = page.locator('.tree-node-wrapper').first();
  const box = await node.boundingBox();
  const original = await page.locator('.world-layer').getAttribute('style');
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 140, box.y + 80, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.modal-content-card')).toHaveCount(0);
  expect(await page.locator('.world-layer').getAttribute('style')).not.toBe(original);
});

test('mobile controls, member list, and help remain usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto('/keluarga-contoh');
  await expect(page.getByRole('button', { name: 'Daftar anggota', exact: true })).toBeVisible();
  await expect(page.locator('.control-zoom-indicator')).not.toHaveText('85%');
  await page.screenshot({ animations: 'disabled', path: 'test-results/tree-mobile.png' });
  const controls = await page.locator('.floating-controls-panel').boundingBox();
  const minimap = await page.locator('.minimap-pill-btn').boundingBox();
  expect(controls.x + controls.width).toBeLessThanOrEqual(minimap.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Cara menjelajahi silsilah' }).click();
  await expect(page.getByRole('dialog', { name: 'Panduan silsilah' })).toBeVisible();
  await page.getByRole('button', { name: 'Siap menjelajah' }).click();
  await page.getByRole('button', { name: 'Daftar anggota', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'test-results/directory-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('admin dashboard, management and forms share the light palette', async ({ page }) => {
  await mockApi(page, true);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard keluarga' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/admin-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Kelola keluarga' }).click();
  await page.getByRole('button', { name: 'Kelola', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah anggota', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tambah anggota keluarga' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/member-form-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Tambah anggota keluarga' })).toHaveCount(0);
});

test('small phones keep navigation controls separate', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await mockApi(page);
  await page.goto('/keluarga-contoh');
  await expect(page.locator('.control-zoom-indicator')).not.toHaveText('85%');
  const controls = await page.locator('.floating-controls-panel').boundingBox();
  const minimap = await page.locator('.minimap-pill-btn').boundingBox();
  expect(controls.x + controls.width).toBeLessThanOrEqual(minimap.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
