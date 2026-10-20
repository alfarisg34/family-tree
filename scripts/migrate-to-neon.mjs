import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { loadEnvironment } from './load-env.mjs';
import { database, initializeDatabase, writeTree, readTree, writeAsset } from '../server/database.mjs';

loadEnvironment();
const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
function slugFor(tree) {
  if (tree.slug) return tree.slug;
  const normalized = tree.tree_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('sukandi')) return 'keluargabanisukandi';
  if (normalized.includes('harun')) return 'keluargaharunthaib';
  if (normalized.includes('robbanisah')) return 'keluargahajjahrobbanisah';
  return normalized;
}
export function convertMember(row) {
  const legacy = row.title || '';
  return {
    id: row.id, fullName: row.full_name, nickname: row.nickname || '',
    titlePrefix: row.title_prefix || (/^(S\.|M\.|Ph|B\.)/.test(legacy) ? '' : legacy),
    titleSuffix: row.title_suffix || (/^(S\.|M\.|Ph|B\.)/.test(legacy) ? legacy : ''),
    gender: row.gender || 'male', generation: row.generation || 1,
    birthDate: row.birth_date || '', birthPlace: row.birth_place || '', isDeceased: Boolean(row.is_deceased),
    passedDate: row.passed_date || '', passedPlace: row.passed_place || '', burialPlace: row.burial_place || '',
    education: row.education || '', occupation: row.occupation || '', workplace: row.workplace || '', residence: row.residence || '',
    phone: row.phone || '', email: row.email || '', socialMedia: row.social_media || '', bio: row.bio || '',
    avatar: row.avatar || '', thumbnail: row.thumbnail || '', gallery: row.gallery || [],
    parentIds: row.parent_ids || [], relationshipToParents: row.relationship_to_parents || 'biological', spouses: row.spouses || [],
    order: row.order_num || 1, tags: row.tags || [],
  };
}

async function sourceCredentials() {
  let url = process.env.SUPABASE_SOURCE_URL || process.env.VITE_SUPABASE_URL;
  let key = process.env.SUPABASE_SOURCE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const source = await readFile(resolve('src/utils/supabaseClient.ts'), 'utf8');
    url ||= source.match(/DEFAULT_SUPABASE_URL = '([^']+)'/)?.[1];
    key ||= source.match(/DEFAULT_SUPABASE_ANON_KEY = '([^']+)'/)?.[1];
  }
  if (!url || !key) throw new Error('Konfigurasi sumber Supabase belum tersedia.');
  return { url, key };
}

async function fetchSource(table, credentials) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${credentials.url}/rest/v1/${table}?select=*&order=id&offset=${offset}&limit=1000`, {
      headers: { apikey: credentials.key, Authorization: `Bearer ${credentials.key}` }, signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Sumber Supabase tidak dapat dibaca (${table}, HTTP ${response.status}). Pastikan proyek aktif dan akses baca tersedia.`);
    const data = await response.json(); rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function migrate() {
  if (process.argv.includes('--verify')) {
    const { verifyNeon } = await import('./verify-neon.mjs');
    await verifyNeon(); return;
  }
  const backup = argument('--backup');
  let snapshot;
  if (backup) snapshot = JSON.parse(await readFile(resolve(backup), 'utf8'));
  else {
    const credentials = await sourceCredentials();
    const [family_trees, family_members] = await Promise.all([fetchSource('family_trees', credentials), fetchSource('family_members', credentials)]);
    snapshot = { family_trees, family_members };
  }
  const families = Array.isArray(snapshot) ? snapshot : snapshot.members ? [snapshot] : snapshot.family_trees.map((tree) => ({
    slug: slugFor(tree), familyTreeName: tree.tree_name, description: tree.description || '', rootGenerationType: tree.root_generation_type || undefined,
    updatedAt: tree.updated_at, members: Object.fromEntries(snapshot.family_members.filter((member) => member.tree_id === tree.id).map((member) => [member.id, convertMember(member)])),
  }));
  if (!families.length) throw new Error('Sumber tidak memiliki keluarga. Migrasi dihentikan tanpa menulis data.');
  const unique = new Set(families.map((family) => family.slug));
  if (unique.size !== families.length) throw new Error('Ada keluarga dengan alamat sama di sumber. Tentukan slug unik sebelum migrasi agar data tidak tercampur.');
  if (snapshot.family_members) {
    const assigned = families.reduce((sum, family) => sum + Object.keys(family.members).length, 0);
    if (assigned !== snapshot.family_members.length) throw new Error('Ada anggota tanpa keluarga yang cocok. Perbaiki tree_id sumber sebelum migrasi.');
  }
  await mkdir(resolve('backups'), { recursive: true });
  const backupFile = resolve('backups', `supabase-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(backupFile, JSON.stringify(snapshot, null, 2));
  console.log(`Backup sumber tersimpan. ${families.length} keluarga, ${families.reduce((sum, family) => sum + Object.keys(family.members).length, 0)} anggota.`);
  if (process.argv.includes('--dry-run')) return;

  await initializeDatabase();
  for (const family of families) {
    const existing = await readTree(family.slug);
    if (existing && !process.argv.includes('--merge')) throw new Error(`Keluarga /${family.slug} sudah ada di Neon. Gunakan --merge hanya jika ingin menggabungkan data sumber.`);
  }
  const assets = new Map();
  async function migratePhoto(url) {
    if (!url || (!url.includes('.supabase.co/storage/') && !url.startsWith('data:image/'))) return url;
    if (assets.has(url)) return assets.get(url);
    let dataUrl = url;
    if (!url.startsWith('data:')) {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Foto sumber gagal dibaca (HTTP ${response.status}). Migrasi belum lengkap.`);
      dataUrl = `data:${response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
    }
    const newUrl = await writeAsset(dataUrl); assets.set(url, newUrl); return newUrl;
  }
  for (const family of families) {
    for (const member of Object.values(family.members)) {
      member.avatar = await migratePhoto(member.avatar);
      if (member.thumbnail) member.thumbnail = await migratePhoto(member.thumbnail);
      for (const photo of member.gallery || []) photo.url = await migratePhoto(photo.url);
    }
    await writeTree(family);
    const migrated = await readTree(family.slug);
    for (const [id, expected] of Object.entries(family.members)) {
      if (JSON.stringify(migrated.members[id]) !== JSON.stringify(expected)) {
        // PostgreSQL JSONB normalizes key order; compare canonical object forms.
        if (!isDeepStrictEqual(migrated.members[id], expected)) throw new Error(`Verifikasi anggota gagal: ${id}.`);
      }
    }
    console.log(`Terverifikasi /${family.slug}: ${Object.keys(family.members).length} anggota.`);
  }
  const counts = await database()`SELECT (SELECT count(*)::int FROM family_trees) AS families, (SELECT count(*)::int FROM family_members) AS members, (SELECT count(*)::int FROM family_assets) AS photos`;
  console.log(`Migrasi selesai. Neon: ${counts[0].families} keluarga, ${counts[0].members} anggota, ${counts[0].photos} foto tersimpan.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate().catch((error) => {
    const known = /^(Sumber|Konfigurasi|Ada |Keluarga |Foto |Verifikasi|Perbaiki)/.test(error.message);
    console.error(known ? error.message : `Migrasi gagal (${error.code || error.name}). Periksa jaringan dan konfigurasi; sumber Supabase tidak diubah.`);
    process.exitCode = 1;
  });
}
