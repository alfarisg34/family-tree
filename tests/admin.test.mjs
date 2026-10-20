import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { getAdminRedirect, hasAdminSession, loginAdmin, logoutAdmin } from '../src/hooks/useAdminSession.ts';
import { updateFamilyMembers } from '../src/utils/updateFamilyMembers.ts';

beforeEach(async () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = new EventTarget();
  globalThis.fetch = async (_url, options = {}) => {
    if (options.method === 'DELETE') return Response.json({ isAdmin: false });
    const password = JSON.parse(options.body || '{}').password;
    return password === 'admin' ? Response.json({ isAdmin: true }) : Response.json({ error: 'Incorrect password' }, { status: 401 });
  };
  await logoutAdmin();
});

test('dashboard and management require login; successful sessions can access both', () => {
  for (const path of ['admin', 'manage']) {
    assert.equal(getAdminRedirect(path, false), '/admin/login');
    assert.equal(getAdminRedirect(path, true), null);
  }
  assert.equal(getAdminRedirect('admin/login', false), null);
  assert.equal(getAdminRedirect('admin/login', true), '/admin');
  assert.equal(getAdminRedirect('keluargabanisukandi', false), null);
});

test('incorrect password cannot create an admin session', async () => {
  assert.equal(await loginAdmin('wrong-password'), false);
  assert.equal(hasAdminSession(), false);
});

test('server login creates a session and logout clears it', async () => {
  let changes = 0;
  window.addEventListener('family-tree-admin-session', () => changes++);
  for (const password of ['admin']) {
    assert.equal(await loginAdmin(password), true);
    assert.equal(hasAdminSession(), true);
    await logoutAdmin();
    assert.equal(hasAdminSession(), false);
  }
  assert.equal(changes, 2);
});

test('unavailable API does not report a successful login', async () => {
  globalThis.fetch = () => { throw new Error('Server unavailable'); };
  assert.equal(await loginAdmin('admin'), false);
  assert.equal(hasAdminSession(), false);
});

const makeMember = (id, extras = {}) => ({ id, fullName: id, gender: 'male', generation: 1, isDeceased: false, avatar: '', parentIds: [], spouses: [], relationshipToParents: 'biological', ...extras });

test('editing a spouse updates reciprocal relationships without mutating the old family', () => {
  const data = { familyTreeName: 'Test', slug: 'test', updatedAt: '', members: {
    a: makeMember('a', { spouses: [{ spouseId: 'b', status: 'married' }] }),
    b: makeMember('b', { spouses: [{ spouseId: 'a', status: 'married' }] }),
    c: makeMember('c'),
  } };
  const next = updateFamilyMembers(data, { ...data.members.a, fullName: 'Updated', spouses: [{ spouseId: 'c', status: 'married', marriageDate: '2020-01-01' }] });
  assert.deepEqual(next.members.b.spouses, []);
  assert.deepEqual(next.members.c.spouses, [{ spouseId: 'a', status: 'married', marriageDate: '2020-01-01' }]);
  assert.equal(data.members.a.fullName, 'a');
  assert.equal(data.members.b.spouses.length, 1);
  assert.equal(next.slug, 'test');
});

test('adding a member preserves existing relatives and reorders children without reverting profiles', () => {
  const child = makeMember('child', { fullName: 'Current name', order: 2, parentIds: ['parent'], generation: 2 });
  const data = { familyTreeName: 'Test', updatedAt: '', members: { child } };
  const next = updateFamilyMembers(data, makeMember('parent'), [{ ...child, fullName: 'Outdated name' }]);
  assert.equal(Object.keys(next.members).length, 2);
  assert.equal(next.members.child.order, 1);
  assert.equal(next.members.child.fullName, 'Current name');
  assert.deepEqual(next.members.child.parentIds, ['parent']);
});
