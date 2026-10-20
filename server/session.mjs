import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'family_admin';
const TTL = 60 * 60 * 12;
function secret() {
  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) throw new Error('ADMIN_SESSION_SECRET minimal 32 karakter wajib dikonfigurasi.');
  return process.env.ADMIN_SESSION_SECRET;
}
function sign(value) { return createHmac('sha256', secret()).update(value).digest('base64url'); }
function equal(a, b) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function validPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD belum dikonfigurasi.');
  return typeof password === 'string' && equal(password, expected);
}
export function hasSession(request) {
  const cookie = (request.headers.cookie || '').split(';').map((value) => value.trim()).find((value) => value.startsWith(`${COOKIE}=`));
  if (!cookie) return false;
  const [expires, signature] = cookie.slice(COOKIE.length + 1).split('.');
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) <= Date.now()) return false;
  return equal(signature, sign(expires));
}
export function sessionCookie(request, clear = false) {
  const expires = String(Date.now() + TTL * 1000);
  const secure = request.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL ? '; Secure' : '';
  return `${COOKIE}=${clear ? '' : `${expires}.${sign(expires)}`}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : TTL}${secure}`;
}
