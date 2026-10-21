import { database, validSlug, validateFamily, listTrees, readTree, writeTree, removeTree, writeMember, removeMember, writeAsset } from '../server/database.mjs';
import { hasSession, validPassword, sessionCookie } from '../server/session.mjs';

const LIMIT = 4_000_000;
async function readBody(request) {
  if (request.body !== undefined) {
    const value = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    if (Buffer.byteLength(JSON.stringify(value)) > LIMIT) throw new Error('Permintaan terlalu besar.');
    return value;
  }
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (Buffer.byteLength(text) > LIMIT) throw new Error('Permintaan terlalu besar.');
  }
  return text ? JSON.parse(text) : {};
}
function json(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export function createHandler(repository = { database, listTrees, readTree, writeTree, removeTree, writeMember, removeMember, writeAsset }) {
  return async function handler(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const action = url.searchParams.get('action') || 'health';
    const method = request.method;
    try {
      if (!['GET', 'POST', 'DELETE'].includes(method)) return json(response, 405, { error: 'Metode tidak didukung.' });
      if (method !== 'GET' && request.headers.origin) {
        const origin = new URL(request.headers.origin);
        if (origin.host !== request.headers.host) return json(response, 403, { error: 'Asal permintaan tidak diizinkan.' });
      }
      if (action === 'session') {
        if (method === 'GET') return json(response, 200, { isAdmin: hasSession(request) });
        if (method === 'DELETE') {
          response.setHeader('Set-Cookie', sessionCookie(request, true));
          return json(response, 200, { isAdmin: false });
        }
        const body = await readBody(request);
        if (!validPassword(body.password)) return json(response, 401, { error: 'Kata sandi salah.' });
        response.setHeader('Set-Cookie', sessionCookie(request));
        return json(response, 200, { isAdmin: true });
      }
      if (action === 'health' && method === 'GET') {
        await repository.database()`SELECT 1`;
        return json(response, 200, { provider: 'neon', connected: true });
      }
      const admin = hasSession(request);
      if ((method !== 'GET' || action === 'trees') && !admin) return json(response, 401, { error: 'Silakan masuk sebagai admin.' });
      if (action === 'trees' && method === 'GET') return json(response, 200, await repository.listTrees());
      if (action === 'tree' && method === 'GET') {
        const slug = url.searchParams.get('slug');
        if (!validSlug(slug)) return json(response, 400, { error: 'Alamat keluarga tidak valid.' });
        const data = await repository.readTree(slug);
        return json(response, data ? 200 : 404, data || { error: 'Keluarga tidak ditemukan.' });
      }
      if (action === 'tree' && method === 'DELETE') {
        const slug = url.searchParams.get('slug');
        if (!validSlug(slug)) return json(response, 400, { error: 'Alamat keluarga tidak valid.' });
        await repository.removeTree(slug);
        return json(response, 200, { success: true });
      }
      if (action === 'tree' && method === 'POST') {
        const data = await readBody(request);
        try { validateFamily(data); } catch (error) { return json(response, 400, { error: error.message }); }
        const treeId = await repository.writeTree(data);
        return json(response, 200, { success: true, treeId, message: 'Data keluarga berhasil disimpan ke Neon.' });
      }
      if (action === 'member') {
        if (method === 'POST') {
          const { member, treeId } = await readBody(request);
          await repository.writeMember(member, treeId);
          return json(response, 200, { success: true });
        }
        if (method === 'DELETE') {
          await repository.removeMember(url.searchParams.get('id'), url.searchParams.get('treeId'));
          return json(response, 200, { success: true });
        }
      }
      if (action === 'asset' && method === 'POST') {
        const { dataUrl } = await readBody(request);
        return json(response, 200, { url: await repository.writeAsset(dataUrl) });
      }
      if (action === 'asset' && method === 'GET') {
        const id = url.searchParams.get('id');
        if (!/^[0-9a-f-]{36}$/i.test(id || '')) return json(response, 400, { error: 'ID foto tidak valid.' });
        const rows = await repository.database()`SELECT data_url FROM family_assets WHERE id = ${id}`;
        if (!rows[0]) return json(response, 404, { error: 'Foto tidak ditemukan.' });
        const [metadata, content] = rows[0].data_url.split(',');
        response.setHeader('Content-Type', metadata.slice(5).split(';')[0]);
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return response.end(Buffer.from(content, 'base64'));
      }
      return json(response, 404, { error: 'Endpoint tidak ditemukan.' });
    } catch {
      return json(response, 500, { error: 'Permintaan gagal. Periksa koneksi dan konfigurasi server Neon.' });
    }
  };
}

export default createHandler();
