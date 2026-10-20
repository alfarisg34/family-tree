import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { database, readTree } from '../server/database.mjs';
import handler from '../api/data.mjs';
import { convertMember } from './migrate-to-neon.mjs';

export async function verifyNeon() {
  const files = (await readdir('backups')).filter((name) => name.startsWith('supabase-') && name.endsWith('.json')).sort();
  const snapshot = JSON.parse(await readFile(`backups/${files.at(-1)}`, 'utf8'));
  const count = await database()`SELECT (SELECT count(*)::int FROM family_trees) AS families, (SELECT count(*)::int FROM family_members) AS members, (SELECT count(*)::int FROM family_assets) AS photos`;
  assert.equal(count[0].families, snapshot.family_trees.length);
  assert.equal(count[0].members, snapshot.family_members.length);
  const trees = await database()`SELECT slug, tree_name FROM family_trees`;
  let firstPhoto;
  for (const sourceTree of snapshot.family_trees) {
    const tree = trees.find((item) => item.tree_name === sourceTree.tree_name);
    assert.ok(tree, 'Keluarga sumber belum ada di Neon.');
    const migrated = await readTree(tree.slug);
    assert.equal(migrated.description, sourceTree.description || '');
    const sourceMembers = snapshot.family_members.filter((member) => member.tree_id === sourceTree.id);
    assert.equal(Object.keys(migrated.members).length, sourceMembers.length);
    for (const row of sourceMembers) {
      const expected = convertMember(row);
      const actual = migrated.members[row.id];
      for (const field of ['avatar', 'thumbnail']) {
        if (expected[field]?.includes('.supabase.co/storage/') || expected[field]?.startsWith('data:image/')) {
          assert.ok(actual[field].startsWith('/api/data?action=asset&id='));
          expected[field] = actual[field]; firstPhoto ||= actual[field];
        }
      }
      expected.gallery.forEach((photo, index) => {
        if (photo.url.includes('.supabase.co/storage/') || photo.url.startsWith('data:image/')) {
          assert.ok(actual.gallery[index].url.startsWith('/api/data?action=asset&id='));
          photo.url = actual.gallery[index].url; firstPhoto ||= photo.url;
        }
      });
      assert.deepEqual(actual, expected, `Profil/relasi anggota ${row.id} tidak cocok.`);
    }
    console.log(`Profil dan relasi cocok: /${tree.slug} (${sourceMembers.length} anggota).`);
  }
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/data?action=health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).provider, 'neon');
    assert.equal((await fetch(`${base}/api/data?action=trees`)).status, 401);
    const login = await fetch(`${base}/api/data?action=session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const list = await fetch(`${base}/api/data?action=trees`, { headers: { Cookie: cookie } });
    assert.equal(list.status, 200); assert.equal((await list.json()).length, 3);
    for (const tree of trees) assert.equal((await fetch(`${base}/api/data?${new URLSearchParams({ action: 'tree', slug: tree.slug })}`)).status, 200);
    if (firstPhoto) {
      const photo = await fetch(`${base}${firstPhoto}`);
      assert.equal(photo.status, 200); assert.ok(photo.headers.get('content-type').startsWith('image/'));
      assert.ok((await photo.arrayBuffer()).byteLength > 0);
    }
    const logout = await fetch(`${base}/api/data?action=session`, { method: 'DELETE', headers: { Cookie: cookie } });
    assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
    console.log(`API login, daftar keluarga, peta, foto, dan logout lulus. Neon: ${count[0].families} keluarga, ${count[0].members} anggota, ${count[0].photos} foto.`);
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
