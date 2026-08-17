import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_SUPABASE_URL_KEY = 'family_tree_supabase_url';
const LOCAL_STORAGE_SUPABASE_KEY_KEY = 'family_tree_supabase_anon_key';

/**
 * Get active Supabase configuration (from .env or localStorage)
 */
export function getSupabaseCredentials(): { url: string; anonKey: string; isFromEnv: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.trim() !== '' && envKey.trim() !== '') {
    return { url: envUrl.trim(), anonKey: envKey.trim(), isFromEnv: true };
  }

  // Fallback to local storage configuration
  try {
    const localUrl = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL_KEY) || '';
    const localKey = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY_KEY) || '';
    return { url: localUrl.trim(), anonKey: localKey.trim(), isFromEnv: false };
  } catch {
    return { url: '', anonKey: '', isFromEnv: false };
  }
}

/**
 * Save custom Supabase credentials in browser storage
 */
export function setSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY_KEY, anonKey.trim());
  } catch (e) {
    console.error('Failed to save Supabase credentials', e);
  }
}

/**
 * Clear custom Supabase credentials
 */
export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY_KEY);
  } catch (e) {
    console.error('Failed to clear Supabase credentials', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}
