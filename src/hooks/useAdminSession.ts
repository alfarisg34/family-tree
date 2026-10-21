import { useEffect, useSyncExternalStore } from 'react';
import { apiRequest } from '../services/databaseService.ts';

const SESSION_EVENT = 'family-tree-admin-session';
let admin = false;
let ready = false;
let refreshing: Promise<void> | null = null;

export function getAdminRedirect(path: string, isAdmin: boolean): string | null {
  if (!isAdmin && ['admin', 'manage', 'admin/dashboard', 'admin/manage'].includes(path)) return '/admin/login';
  if (isAdmin && ['admin', 'admin/login'].includes(path)) return '/admin/dashboard';
  if (isAdmin && path === 'manage') return '/admin/manage';
  return null;
}

export function hasAdminSession(): boolean {
  return admin;
}

function subscribe(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

export async function refreshAdminSession() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try { admin = (await apiRequest<{ isAdmin: boolean }>('session')).isAdmin; }
    catch { admin = false; }
    finally { ready = true; refreshing = null; window.dispatchEvent(new Event(SESSION_EVENT)); }
  })();
  return refreshing;
}

export async function loginAdmin(password: string): Promise<boolean> {
  try {
    admin = (await apiRequest<{ isAdmin: boolean }>('session', { method: 'POST', body: JSON.stringify({ password }) })).isAdmin;
    ready = true; window.dispatchEvent(new Event(SESSION_EVENT)); return admin;
  } catch { return false; }
}

export async function logoutAdmin() {
  await apiRequest('session', { method: 'DELETE' });
  admin = false; ready = true; window.dispatchEvent(new Event(SESSION_EVENT));
}

export function useAdminSession() {
  const isAdmin = useSyncExternalStore(subscribe, hasAdminSession);
  const isSessionReady = useSyncExternalStore(subscribe, () => ready);
  useEffect(() => { if (!ready) void refreshAdminSession(); }, []);
  return { isAdmin, isSessionReady, loginAdmin, logoutAdmin };
}
