import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';

export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum dikonfigurasi di server.');
  return neon(process.env.DATABASE_URL);
}

export async function initializeDatabase(sql = database()) {
  await sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS family_trees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL,
      tree_name text NOT NULL, description text NOT NULL DEFAULT '', root_generation_type text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    sql`CREATE TABLE IF NOT EXISTS family_members (
      tree_id uuid NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
      id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY (tree_id, id)
    )`,
    sql`CREATE TABLE IF NOT EXISTS family_assets (
      id uuid PRIMARY KEY, data_url text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    )`,
  ]);
}

export function validSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug) && !['admin', 'manage', 'api', 'changelog'].includes(slug);
}

export function validateFamily(data) {
  if (!data || !validSlug(data.slug) || typeof data.familyTreeName !== 'string' || !data.familyTreeName.trim()) throw new Error('Nama dan alamat keluarga wajib diisi.');
  if (!data.members || Array.isArray(data.members) || typeof data.members !== 'object') throw new Error('Data anggota tidak valid.');
  for (const [id, member] of Object.entries(data.members)) {
    if (!member || member.id !== id || typeof member.fullName !== 'string' || !member.fullName.trim() || !Array.isArray(member.parentIds) || !Array.isArray(member.spouses)) throw new Error('Profil atau hubungan anggota tidak valid.');
  }
}

export async function listTrees(sql = database()) {
  return sql`SELECT id, slug, tree_name FROM family_trees ORDER BY tree_name`;
}

export async function readTree(slug, sql = database()) {
  const rows = await sql`SELECT t.*, COALESCE(jsonb_object_agg(m.id, m.payload) FILTER (WHERE m.id IS NOT NULL), '{}'::jsonb) AS members
    FROM family_trees t LEFT JOIN family_members m ON m.tree_id = t.id WHERE t.slug = ${slug} GROUP BY t.id`;
  const tree = rows[0];
  return tree ? { id: tree.id, treeId: tree.id, slug: tree.slug, familyTreeName: tree.tree_name, description: tree.description, rootGenerationType: tree.root_generation_type || undefined, updatedAt: tree.updated_at, members: tree.members } : null;
}

export async function writeTree(data, sql = database()) {
  validateFamily(data);
  const id = randomUUID();
  const members = JSON.stringify(Object.values(data.members));
  const result = await sql.transaction([
    sql`INSERT INTO family_trees (id, slug, tree_name, description, root_generation_type)
      VALUES (${id}, ${data.slug}, ${data.familyTreeName.trim()}, ${data.description || ''}, ${data.rootGenerationType || null})
      ON CONFLICT (slug) DO UPDATE SET tree_name = EXCLUDED.tree_name, description = EXCLUDED.description,
      root_generation_type = EXCLUDED.root_generation_type, updated_at = now() RETURNING id`,
    sql`INSERT INTO family_members (tree_id, id, payload)
      SELECT t.id, member->>'id', member FROM family_trees t CROSS JOIN jsonb_array_elements(${members}::jsonb) member WHERE t.slug = ${data.slug}
      ON CONFLICT (tree_id, id) DO UPDATE SET payload = EXCLUDED.payload`,
  ]);
  return result[0][0].id;
}

export async function writeMember(member, treeId, sql = database()) {
  if (!treeId || !member?.id || !member.fullName?.trim() || !Array.isArray(member.parentIds) || !Array.isArray(member.spouses)) throw new Error('Anggota atau ID keluarga tidak valid.');
  await sql.transaction([
    sql`INSERT INTO family_members (tree_id, id, payload) VALUES (${treeId}, ${member.id}, ${JSON.stringify(member)}::jsonb)
      ON CONFLICT (tree_id, id) DO UPDATE SET payload = EXCLUDED.payload`,
    sql`UPDATE family_trees SET updated_at = now() WHERE id = ${treeId}`,
  ]);
}

export async function removeMember(id, treeId, sql = database()) {
  if (!id || !treeId) throw new Error('ID anggota dan keluarga wajib diisi.');
  await sql.transaction([
    sql`DELETE FROM family_members WHERE id = ${id} AND tree_id = ${treeId}`,
    sql`UPDATE family_members SET payload = jsonb_set(jsonb_set(payload, '{parentIds}',
      COALESCE((SELECT jsonb_agg(p) FROM jsonb_array_elements(payload->'parentIds') p WHERE p #>> '{}' <> ${id}), '[]'::jsonb)), '{spouses}',
      COALESCE((SELECT jsonb_agg(s) FROM jsonb_array_elements(payload->'spouses') s WHERE s->>'spouseId' <> ${id}), '[]'::jsonb)) WHERE tree_id = ${treeId}`,
    sql`UPDATE family_trees SET updated_at = now() WHERE id = ${treeId}`,
  ]);
}

export async function writeAsset(dataUrl, sql = database()) {
  if (typeof dataUrl !== 'string' || !/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(dataUrl) || dataUrl.length > 3_500_000) throw new Error('Foto tidak valid atau melebihi batas ukuran.');
  const id = randomUUID();
  await sql`INSERT INTO family_assets (id, data_url) VALUES (${id}, ${dataUrl})`;
  return `/api/data?action=asset&id=${id}`;
}
