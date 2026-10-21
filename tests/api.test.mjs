import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createHandler } from '../api/data.mjs';
import { hasSession, sessionCookie } from '../server/session.mjs';
import { validSlug, removeTree } from '../server/database.mjs';
import { convertMember } from '../scripts/migrate-to-neon.mjs';

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.ADMIN_SESSION_SECRET = 'test-session-secret-at-least-32-characters';
});
const request = (action, method = 'GET', body = {}, cookie = '') => ({ url: `/api/data?action=${action}`, method, body, headers: { host: 'localhost', cookie } });
async function call(req, repository = {}) {
  const response = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(value) { this.body = JSON.parse(value); } };
  await createHandler(repository)(req, response);
  return response;
}
function adminCookie() { return sessionCookie({ headers: {} }).split(';')[0]; }

test('database writes and family listing require a server session', async () => {
  for (const [action, method] of [['tree', 'POST'], ['tree', 'DELETE'], ['member', 'POST'], ['member', 'DELETE'], ['asset', 'POST'], ['trees', 'GET']]) {
    const response = await call(request(action, method));
    assert.equal(response.statusCode, 401);
  }
});

test('forged and expired cookies cannot authenticate', () => {
  const cookie = adminCookie();
  assert.equal(hasSession({ headers: { cookie } }), true);
  assert.equal(hasSession({ headers: { cookie: cookie + 'tampered' } }), false);
  assert.equal(hasSession({ headers: { cookie: 'family_admin=0.fake' } }), false);
});

test('server login validates password and issues HttpOnly cookies; logout expires them', async () => {
  assert.equal((await call(request('session', 'POST', { password: 'wrong' }))).statusCode, 401);
  const response = await call(request('session', 'POST', { password: 'test-password' }));
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);
  const logout = await call(request('session', 'DELETE'));
  assert.match(logout.headers['Set-Cookie'], /Max-Age=0/);
});

test('cross-origin mutation is rejected before accessing the repository', async () => {
  const req = request('tree', 'POST', {}, adminCookie());
  req.headers.origin = 'https://another-site.example';
  assert.equal((await call(req)).statusCode, 403);
});

test('public readers can open a known family but not reserved or invalid slugs', async () => {
  const req = request('tree&slug=known-family');
  const data = { slug: 'known-family', familyTreeName: 'Known', members: {} };
  const response = await call(req, { readTree: async (slug) => { assert.equal(slug, data.slug); return data; } });
  assert.deepEqual(response.body, data);
  assert.equal((await call(request('tree&slug=admin'))).statusCode, 400);
  assert.equal((await call(request('tree&slug=changelog'))).statusCode, 400);
  assert.equal(validSlug('changelog'), false);
  assert.equal(validSlug('api'), false);
});

test('empty families can be saved; malformed members cannot be written', async () => {
  const data = { slug: 'empty-family', familyTreeName: 'Empty', members: {} };
  const response = await call(request('tree', 'POST', data, adminCookie()), { writeTree: async () => 'new-id' });
  assert.equal(response.body.treeId, 'new-id');
  data.members.bad = { id: 'another-id' };
  assert.equal((await call(request('tree', 'POST', data, adminCookie()))).statusCode, 400);
});

test('server errors do not expose database credentials', async () => {
  const response = await call(request('trees', 'GET', {}, adminCookie()), { listTrees: async () => { throw new Error('postgresql://user:secret@db'); } });
  assert.equal(response.statusCode, 500);
  assert.doesNotMatch(JSON.stringify(response.body), /secret|postgresql/);
});

test('admin deletion targets only the requested family and validates the slug', async () => {
  const deleted = [];
  const repository = { removeTree: async (slug) => { deleted.push(slug); } };
  const response = await call(request('tree&slug=known-family', 'DELETE', {}, adminCookie()), repository);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { success: true });
  for (const slug of ['', 'admin', 'invalid/slug']) {
    assert.equal((await call(request(`tree&slug=${slug}`, 'DELETE', {}, adminCookie()), repository)).statusCode, 400);
  }
  assert.deepEqual(deleted, ['known-family']);
});

test('failed deletion returns an error instead of reporting success', async () => {
  const response = await call(request('tree&slug=known-family', 'DELETE', {}, adminCookie()), {
    removeTree: async () => { throw new Error('Database unavailable'); },
  });
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, undefined);
});

test('repository permanently deletes the specified tree using a parameterized query', async () => {
  let queried = false;
  await removeTree('known-family', async (strings, ...values) => {
    queried = true;
    assert.match(strings.join('?'), /DELETE FROM family_trees WHERE slug = \?/);
    assert.deepEqual(values, ['known-family']);
    return [];
  });
  assert.equal(queried, true);
});

test('Supabase migration preserves dates, relationships, galleries and structured titles', () => {
  const row = { id: 'member', full_name: 'Name', title_prefix: 'Dr.', title_suffix: 'Ph.D.', generation: 3, is_deceased: true, passed_date: '2020-01-01', parent_ids: ['parent'], spouses: [{ spouseId: 'partner', status: 'married' }], gallery: [{ id: 'photo', url: 'image', caption: 'Memory' }], relationship_to_parents: 'adopted' };
  const member = convertMember(row);
  assert.equal(member.titlePrefix, 'Dr.'); assert.equal(member.titleSuffix, 'Ph.D.');
  assert.equal(member.passedDate, row.passed_date); assert.equal(member.isDeceased, true);
  assert.deepEqual(member.parentIds, row.parent_ids); assert.deepEqual(member.spouses, row.spouses);
  assert.deepEqual(member.gallery, row.gallery); assert.equal(member.relationshipToParents, 'adopted');
});
