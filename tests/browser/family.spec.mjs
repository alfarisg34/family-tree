import { test, expect } from '@playwright/test';
import { LATEST_VERSION_LABEL } from '../../src/data/changelog.ts';

const member = (id, fullName, generation, parentIds = [], spouses = []) => ({ id, fullName, nickname: fullName.split(' ')[0], gender: 'male', generation, isDeceased: false, avatar: '', gallery: [], parentIds, spouses, relationshipToParents: 'biological', residence: 'Bandung' });
const family = { id: 'family-test', treeId: 'family-test', slug: 'keluarga-contoh', familyTreeName: 'Keluarga Besar Bahagia', description: 'Merawat cerita, menghubungkan generasi.', updatedAt: '2026-10-11T00:00:00Z', members: {
  a: member('a', 'Hasan Pratama', 1, [], [{ spouseId: 'b', status: 'married' }]),
  b: { ...member('b', 'Aminah Pratama', 1, [], [{ spouseId: 'a', status: 'married' }]), gender: 'female' },
  c: member('c', 'Rizal Pratama', 2, ['a', 'b'], [{ spouseId: 'd', status: 'married' }]),
  d: { ...member('d', 'Sari Utami', 2, [], [{ spouseId: 'c', status: 'married' }]), gender: 'female' },
  e: { ...member('e', 'Alya Pratama', 3, ['c', 'd']), gender: 'female' },
  f: member('f', 'Dimas Pratama', 3, ['c', 'd']),
} };
async function mockApi(page, admin = false, data = family) {
  await page.route('**/api/data?**', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const body = action === 'session' ? { isAdmin: admin } : action === 'trees' ? [{ id: data.id, slug: data.slug, tree_name: data.familyTreeName }] : data;
    await route.fulfill({ json: body });
  });
}

async function openFamilyOverview(page) {
  await page.goto('/keluarga-contoh');
  await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
}

for (const width of [1440, 390, 320]) {
  test(`homepage version links to a refreshable public changelog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await page.goto('/');
    const releaseLink = page.getByRole('contentinfo').getByRole('link', { name: `Catatan rilis ${LATEST_VERSION_LABEL}`, exact: true });
    await releaseLink.scrollIntoViewIfNeeded();
    await expect(releaseLink).toBeVisible();
    await expect(page.locator('.landing-version')).toHaveText(LATEST_VERSION_LABEL);
    await releaseLink.click();
    await expect(page).toHaveURL(/\/changelog$/);
    await expect(page.getByRole('heading', { name: 'Catatan rilis', exact: true })).toBeVisible();
    await expect(page.locator('.changelog-version').first()).toHaveText(LATEST_VERSION_LABEL);
    await expect(page.locator('.world-layer')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Catatan rilis', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Beranda', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/keluarga-contoh');
    await expect(page.locator('.world-layer')).toBeVisible();
    await expect(page.locator('.landing-version')).toHaveCount(0);
    await page.goto('/admin/login');
    await expect(page.locator('.landing-version')).toHaveCount(0);
  });
}

for (const width of [320, 390]) {
  test(`mobile generation labels remain readable while zooming and panning at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await page.goto('/keluarga-contoh');
    const pills = page.locator('.generation-level-pill');
    await expect(pills).toHaveCount(3);
    const checkLabels = async () => {
      const labels = await pills.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, width: rect.width, height: rect.height, display: getComputedStyle(element.parentElement).display };
      }));
      for (const label of labels) {
        expect(label.display).not.toBe('none');
        expect(label.left).toBeCloseTo(8, 0);
        expect(label.width).toBeLessThan(width - 16);
        expect(label.height).toBeGreaterThanOrEqual(16);
      }
    };
    await checkLabels();
    await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
    await checkLabels();
    const canvas = await page.locator('main').boundingBox();
    await page.mouse.move(30, canvas.y + canvas.height - 30);
    await page.mouse.down();
    await page.mouse.move(140, canvas.y + canvas.height - 80, { steps: 10 });
    await page.mouse.up();
    await checkLabels();
    await page.getByRole('button', { name: 'Perbesar peta', exact: true }).click();
    await checkLabels();
    await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
    await page.getByRole('button', { name: 'Buka Keluarga Rizal, 4 anggota', exact: true }).click();
    await page.getByRole('button', { name: 'Lihat peta keluarga', exact: true }).click();
    await expect(pills).toHaveCount(2);
    await expect(pills.locator('.count')).toHaveText(['2 Anggota', '2 Anggota']);
    await checkLabels();
  });
}

test('a profile lists each child once and preserves relationship information', async ({ page }) => {
  const data = structuredClone(family);
  data.members.f.relationshipToParents = 'adopted';
  await mockApi(page, false, data);
  await page.goto('/keluarga-contoh');
  await page.getByRole('button', { name: 'Daftar anggota', exact: true }).click();
  const directory = page.getByRole('dialog', { name: 'Daftar anggota keluarga' });
  await directory.getByLabel('Cari anggota', { exact: true }).fill('Rizal');
  await directory.locator('.explorer-member').click();
  const profile = page.getByRole('dialog', { name: 'Profil Rizal Pratama', exact: true });
  for (const [name, relationship] of [['Alya Pratama', 'Anak Kandung'], ['Dimas Pratama', 'Anak Angkat']]) {
    const child = profile.locator('.relation-chip').filter({ hasText: name });
    await expect(child).toHaveCount(1);
    await expect(child).toContainText(relationship);
  }
  await expect(profile.getByText('Keturunan / Anak:', { exact: true })).toHaveCount(0);
  await profile.locator('.relation-chip').filter({ hasText: 'Dimas Pratama' }).click();
  await expect(page.getByRole('dialog', { name: 'Profil Dimas Pratama', exact: true })).toBeVisible();
});

test('landing and login use the warm theme without exposing family links', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 249, 241)');
  await expect(page.locator('a[href^="/keluarga"]')).toHaveCount(0);
  await page.screenshot({ animations: 'disabled', path: 'test-results/landing-desktop.png', fullPage: true });
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Masuk admin' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/login-desktop.png' });
});

test('directory search and generation filter open a profile; Escape restores the map', async ({ page }) => {
  await mockApi(page);
  await openFamilyOverview(page);
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
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
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
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Daftar anggota', exact: true })).toBeVisible();
  await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
  await page.screenshot({ animations: 'disabled', path: 'test-results/tree-mobile.png' });
  const controls = await page.locator('.map-control-actions').boundingBox();
  const minimap = await page.locator('.minimap-pill-btn').boundingBox();
  expect(controls.x + controls.width <= minimap.x || controls.y + controls.height <= minimap.y || minimap.y + minimap.height <= controls.y || minimap.x + minimap.width <= controls.x).toBe(true);
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
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard keluarga' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/admin-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Kelola keluarga' }).click();
  await expect(page).toHaveURL(/\/admin\/manage$/);
  await page.getByRole('button', { name: 'Kelola', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah anggota', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tambah anggota keluarga' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/member-form-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Tambah anggota keluarga' })).toHaveCount(0);
  await page.goto('/keluarga-contoh');
  await page.getByRole('link', { name: 'Kembali ke dashboard admin', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard keluarga' })).toBeVisible();
  await expect(page.locator('.admin-table')).toHaveCount(0);
});

test('small phones keep navigation controls separate', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await mockApi(page);
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
  await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
  const minimap = await page.locator('.minimap-pill-btn').boundingBox();
  const zoomButtons = await page.locator('.map-controls .control-icon-btn').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
  expect(zoomButtons.every(button => button.width >= 44 && button.height >= 44)).toBe(true);
  const actions = await page.locator('.map-control-actions').boundingBox();
  expect(actions.y + actions.height <= minimap.y || minimap.y + minimap.height <= actions.y).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

for (const width of [1440, 390, 320]) {
  test(`overview and branch navigation fit the screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await openFamilyOverview(page);
    await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toBeVisible();
    const branch = page.getByRole('button', { name: 'Buka Keluarga Rizal, 4 anggota', exact: true });
    await expect(branch).toBeVisible();
    expect(await branch.locator('strong').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(18);
    await branch.scrollIntoViewIfNeeded();
    const scrollBefore = await page.locator('.family-overview').evaluate(node => node.scrollTop);
    await branch.click();
    if (width < 768) {
      await expect(page.getByRole('region', { name: 'Ringkasan Keluarga Rizal', exact: true })).toBeVisible();
      await expect(page.locator('.overview-members .overview-person')).toHaveCount(4);
      await page.getByRole('button', { name: 'Lihat peta keluarga', exact: true }).click();
    }
    await expect(page.locator('.tree-node-card')).toHaveCount(4);
    await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
    await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
    // Automatic loading must not overwrite an explicit fit.
    await page.waitForTimeout(500);
    const outside = await page.locator('.tree-node-card').evaluateAll(cards => {
      const canvas = document.querySelector('main').getBoundingClientRect();
      return cards.filter(card => {
        const box = card.getBoundingClientRect();
        return box.left < canvas.left || box.right > canvas.right || box.top < canvas.top + 68 || box.bottom > canvas.bottom;
      }).length;
    });
    expect(outside).toBe(0);
    const initial = await page.locator('.world-layer').getAttribute('style');
    await page.getByRole('button', { name: 'Perbesar peta', exact: true }).click();
    expect(await page.locator('.world-layer').getAttribute('style')).not.toBe(initial);
    await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toBeVisible();
    expect(await page.locator('.family-overview').evaluate(node => node.scrollTop)).toBe(scrollBefore);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

for (const width of [1440, 320]) {
  test(`zoom limits and recovery controls remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await openFamilyOverview(page);
    await expect(page.getByRole('button', { name: 'Buka Keluarga Rizal, 4 anggota', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
    const minus = page.getByRole('button', { name: 'Perkecil peta', exact: true });
    const plus = page.getByRole('button', { name: 'Perbesar peta', exact: true });
    for (let step = 0; step < 25 && !(await minus.isDisabled()); step++) await minus.click();
    await expect(minus).toBeDisabled();
    await expect(page.getByRole('status')).toContainText('Sudah paling jauh');
    for (let step = 0; step < 25 && !(await plus.isDisabled()); step++) await plus.click();
    await expect(plus).toBeDisabled();
    await expect(page.getByRole('status')).toContainText('Sudah paling dekat');
    await page.getByLabel('Opsi peta', { exact: true }).click();
    const menu = page.getByRole('group', { name: 'Opsi peta lainnya', exact: true });
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await menu.getByRole('button', { name: 'Tengah peta · 85%', exact: true }).click();
    await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
    await expect(minus).toBeEnabled();
    await expect(plus).toBeEnabled();
    await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
    await page.getByLabel('Opsi peta', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.map-options')).not.toHaveAttribute('open');
    await page.getByLabel('Opsi peta', { exact: true }).click();
    await menu.getByRole('button', { name: 'Ringkasan keluarga besar', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toBeVisible();
  });
}

test('a tall family fits after the overview canvas shrinks to make room for controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await mockApi(page, false, { ...family, members: { ...family.members,
    g: member('g', 'Farhan Pratama', 4, ['e']),
    h: member('h', 'Gilang Pratama', 4, ['f']),
    i: member('i', 'Hana Pratama', 5, ['g']),
  } });
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Buka Keluarga Rizal, 7 anggota', exact: true }).click();
  await expect(page.locator('.tree-node-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
  await page.waitForTimeout(250);
  expect(await page.locator('.tree-node-card').evaluateAll(cards => {
    const area = document.querySelector('main').getBoundingClientRect();
    return cards.every(card => { const r = card.getBoundingClientRect(); return r.top >= area.top + 68 && r.bottom <= area.bottom && r.left >= area.left && r.right <= area.right; });
  })).toBe(true);
});

test('shared photo tags follow the open profile in the gallery and lightbox', async ({ page }) => {
  const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="tan"/%3E%3C/svg%3E';
  const groupPhoto = { id: 'shared', url: `${image}#shared`, taggedMemberIds: ['d', 'e', 'f'] };
  const data = structuredClone(family);
  for (const [id, name] of [['c', 'Danti'], ['d', 'Koko'], ['e', 'Nenis'], ['f', 'Zidan']]) {
    data.members[id] = { ...data.members[id], fullName: name, nickname: name, avatar: `${image}#avatar` };
  }
  data.members.c.gallery = [{ id: 'older', url: `${image}#older` }, { id: 'other', url: `${image}#other` }, groupPhoto];
  await mockApi(page, false, data);
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Daftar anggota', exact: true }).click();
  const directory = page.getByRole('dialog', { name: 'Daftar anggota keluarga', exact: true });
  await directory.getByLabel('Cari anggota', { exact: true }).fill('Zidan');
  await directory.getByRole('button', { name: /Zidan/ }).click();
  const people = ['Danti', 'Koko', 'Nenis', 'Zidan'];
  for (const [name, next] of [['Zidan', 'Danti'], ['Danti', 'Koko'], ['Koko', 'Nenis'], ['Nenis', null]]) {
    await expect(page.getByRole('dialog', { name: `Profil ${name}`, exact: true })).toBeVisible();
    for (let step = 0; step < 5 && await page.locator('.carousel-slide-img').getAttribute('src') !== groupPhoto.url; step++) {
      await page.getByRole('button', { name: 'Next photo', exact: true }).click();
    }
    await expect(page.locator('.carousel-slide-img')).toHaveAttribute('src', groupPhoto.url);
    const expected = people.filter(person => person !== name).map(person => `Lihat profil ${person}`);
    await expect.poll(() => page.locator('.carousel-slide-box [title^="Lihat profil"]').evaluateAll(chips => chips.map(chip => chip.title))).toEqual(expected);
    await page.locator('.carousel-slide-img').click();
    await expect(page.locator('button[title="Tutup (Esc)"]')).toBeVisible();
    await expect.poll(() => page.locator('.modal-backdrop').last().locator('[title^="Lihat profil"]').evaluateAll(chips => chips.map(chip => chip.title))).toEqual(expected);
    await page.locator('button[title="Tutup (Esc)"]').click();
    if (next) await page.locator('.carousel-slide-box').getByTitle(`Lihat profil ${next}`, { exact: true }).click();
  }
});

test('collapsed families pack together and expand smoothly before revealing descendants', async ({ page }) => {
  const data = structuredClone(family);
  data.members = { a: family.members.a, b: family.members.b };
  for (let index = 1; index <= 3; index++) {
    const id = `family-${index}`;
    const spouseId = `spouse-${index}`;
    data.members[id] = member(id, `Kepala${index}`, 2, ['a', 'b'], [{ spouseId, status: 'married' }]);
    data.members[spouseId] = member(spouseId, `Pasangan${index}`, 2, [], [{ spouseId: id, status: 'married' }]);
    for (let child = 1; child <= 4; child++) {
      const childId = `${id}-child-${child}`;
      data.members[childId] = member(childId, `Anak${index}${child}`, 3, [id, spouseId]);
    }
  }
  await mockApi(page, false, data);
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
  while (Number((await page.locator('.control-zoom-indicator').innerText()).replace('%', '')) > 28) {
    await page.getByRole('button', { name: 'Perkecil peta', exact: true }).click();
  }
  const positions = () => page.locator('.tree-cluster-wrapper').evaluateAll(nodes => nodes.map(node => parseFloat(node.style.left)).sort((a, b) => a - b));
  const compact = await positions();
  expect(compact).toHaveLength(3);
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Perbesar peta', exact: true }).click();
  const expanded = await positions();
  expect(expanded).toHaveLength(3);
  expect(expanded[2] - expanded[0]).toBeGreaterThan((compact[2] - compact[0]) * 1.2);
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Perkecil peta', exact: true }).click();
  const restored = await positions();
  restored.forEach((x, index) => expect(x).toBeCloseTo(compact[index], 2));
  const fullDetailMatches = await page.evaluate(async (data) => {
    const { computeFamilyTreeLayout } = await import('/src/utils/layoutEngine.ts');
    const full = computeFamilyTreeLayout(data);
    const detailed = computeFamilyTreeLayout(data, { scale: .85 });
    return Object.keys(full.nodes).every(id => full.nodes[id].x === detailed.nodes[id].x && full.nodes[id].y === detailed.nodes[id].y);
  }, data);
  expect(fullDetailMatches).toBe(true);
  await page.getByRole('button', { name: 'Cluster Keluarga Kepala2: 6 anggota keluarga. Klik untuk memperbesar.', exact: true }).click();
  await expect(page.locator('.tree-node-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
  await page.waitForTimeout(250);
  expect(await page.locator('.tree-node-card').evaluateAll(cards => {
    const area = document.querySelector('main').getBoundingClientRect();
    return cards.every(card => { const r = card.getBoundingClientRect(); return r.left >= area.left && r.right <= area.right && r.top >= area.top + 68 && r.bottom <= area.bottom; });
  })).toBe(true);
});

for (const width of [1440, 390]) {
  test(`a spouse-only adopted child appears in the family card, summary and map at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const data = structuredClone(family);
    data.members.nela = { ...member('nela', 'Nela', 3, ['d']), relationshipToParents: 'adopted' };
    data.members.c.spouses[0].status = 'divorced';
    data.members.d.spouses[0].status = 'divorced';
    for (let index = 0; index < 8; index++) {
      const id = `relative-${index}`;
      data.members[id] = member(id, `Kerabat${index}`, 2, ['a', 'b']);
    }
    await mockApi(page, false, data);
    await openFamilyOverview(page);
    await page.getByRole('button', { name: 'Buka Keluarga Rizal, 5 anggota', exact: true }).click();
    if (width >= 768) await page.getByRole('button', { name: 'Ringkasan keluarga', exact: true }).click();
    await expect(page.locator('.overview-members .overview-person')).toHaveCount(5);
    await expect(page.locator('.overview-members .overview-person').filter({ hasText: 'Nela' })).toBeVisible();
    await page.getByRole('button', { name: 'Lihat peta keluarga', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Anggota keluarga: Nela, Generasi 3', exact: true })).toBeVisible();
    await expect(page.locator('.tree-edge.parent-child-adopted')).toHaveCount(1);
    await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
    await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
    while (parseInt(await page.locator('.control-zoom-indicator').innerText()) >= 50) {
      await page.getByRole('button', { name: 'Perkecil peta', exact: true }).click();
    }
    await expect(page.getByRole('button', { name: 'Cluster Keluarga Rizal: 5 anggota keluarga. Klik untuk memperbesar.', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anggota keluarga: Nela, Generasi 3', exact: true })).toHaveCount(0);
  });
}

test('family hover preview stays open across the gap and scrolls without zooming the map', async ({ page }) => {
  const data = structuredClone(family);
  for (let index = 0; index < 8; index++) {
    const id = `child-${index}`;
    data.members[id] = member(id, `Anggota${index}`, 3, ['c', 'd']);
  }
  await mockApi(page, false, data);
  await openFamilyOverview(page);
  await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
  while (parseInt(await page.locator('.control-zoom-indicator').innerText()) >= 45) {
    await page.getByRole('button', { name: 'Perkecil peta', exact: true }).click();
  }
  const card = page.getByRole('button', { name: 'Cluster Keluarga Rizal: 12 anggota keluarga. Klik untuk memperbesar.', exact: true });
  await card.hover();
  const preview = card.locator('.cluster-hover-tooltip');
  await expect(preview).toBeVisible();
  await page.waitForTimeout(300);
  const labelBox = await card.locator('.cluster-labels-box').boundingBox();
  const previewBox = await preview.boundingBox();
  await page.mouse.move(labelBox.x + labelBox.width / 2, labelBox.y + labelBox.height - 1);
  await page.mouse.move(labelBox.x + labelBox.width / 2, (labelBox.y + labelBox.height + previewBox.y) / 2, { steps: 6 });
  await page.waitForTimeout(450);
  await expect(preview).toBeVisible();
  const list = preview.locator('.cluster-tooltip-list');
  const box = await list.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 20, { steps: 6 });
  const before = await page.locator('.world-layer').getAttribute('style');
  await page.mouse.wheel(0, 800);
  await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.mouse.wheel(0, 800);
  await expect(preview).toBeVisible();
  await expect(list.locator('.cluster-tooltip-member-item')).toHaveCount(12);
  expect(await page.locator('.world-layer').getAttribute('style')).toBe(before);
  await page.mouse.move(20, 20);
  await expect(preview).toHaveCount(0);
  await card.hover();
  await expect(preview).toBeVisible();
  await preview.getByRole('button', { name: 'Perbesar & Tampilkan Semua', exact: true }).click();
  await expect(page.locator('.tree-node-card')).toHaveCount(12);
});

for (const width of [1440, 390]) {
  test(`back navigation responds to the first click after dragging at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await openFamilyOverview(page);
    for (let round = 0; round < 2; round++) {
      await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
      const canvas = await page.locator('main').boundingBox();
      await page.mouse.move(40, canvas.y + canvas.height - 35);
      await page.mouse.down();
      await page.mouse.move(140, canvas.y + canvas.height - 65, { steps: 10 });
      await page.mouse.up();
      await expect(page.locator('.modal-content-card')).toHaveCount(0);
      await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toBeVisible();
    }
  });
}

for (const width of [1440, 390]) {
  test(`both map entry points share readable node dimensions and spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const data = structuredClone(family);
    for (let index = 0; index < 8; index++) {
      const id = `extra-child-${index}`;
      data.members[id] = member(id, `Anak${index}`, 3, ['c', 'd']);
    }
    await mockApi(page, false, data);
    await openFamilyOverview(page);
    await page.getByRole('button', { name: 'Buka Keluarga Rizal, 12 anggota', exact: true }).click();
    if (width < 768) await page.getByRole('button', { name: 'Lihat peta keluarga', exact: true }).click();
    const measure = async () => {
      await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
      await page.waitForTimeout(250);
      const first = await page.getByRole('button', { name: 'Anggota keluarga: Rizal Pratama, Generasi 2', exact: true }).locator('.tree-node-card').boundingBox();
      const second = await page.getByRole('button', { name: 'Anggota keluarga: Sari Utami, Generasi 2', exact: true }).locator('.tree-node-card').boundingBox();
      return { width: first.width, height: first.height, distance: second.x + second.width / 2 - first.x - first.width / 2 };
    };
    const scoped = await measure();
    await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
    await page.getByRole('button', { name: 'Jelajahi peta', exact: true }).click();
    const entire = await measure();
    expect(entire.width).toBeCloseTo(scoped.width, 1);
    expect(entire.height).toBeCloseTo(scoped.height, 1);
    expect(entire.distance).toBeCloseTo(scoped.distance, 1);
    await expect(page.locator('.tree-cluster-wrapper')).toHaveCount(0);
    await page.getByRole('button', { name: 'Lihat seluruh keluarga', exact: true }).click();
    expect(parseInt(await page.locator('.control-zoom-indicator').innerText())).toBeLessThan(85);
    await expect(page.locator('.tree-cluster-wrapper')).not.toHaveCount(0);
  });
}

for (const width of [1440, 390]) {
  test(`opening or refreshing a family URL starts directly in the readable map at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await page.goto('/keluarga-contoh');
    await expect(page.locator('.world-layer')).toBeVisible();
    await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
    await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Lokasi dalam silsilah', exact: true })).toContainText('Peta seluruh keluarga');
    await page.reload();
    await expect(page.locator('.world-layer')).toBeVisible();
    await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
    await page.getByRole('button', { name: 'Kembali ke overview', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Ringkasan keluarga besar', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Buka Keluarga Rizal, 4 anggota', exact: true }).click();
    if (width < 768) await page.getByRole('button', { name: 'Lihat peta keluarga', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Lokasi dalam silsilah', exact: true })).toContainText('Keluarga Rizal');
    await expect(page.locator('.control-zoom-indicator')).toHaveText('85%');
  });
}
