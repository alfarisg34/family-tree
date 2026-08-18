import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_SUPABASE_URL_KEY = 'family_tree_supabase_url';
const LOCAL_STORAGE_SUPABASE_KEY_KEY = 'family_tree_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://ywsssuptokbqkqjjihes.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3c3NzdXB0b2ticWtxamppaGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDgyOTIsImV4cCI6MjEwMjQ4NDI5Mn0.AFDNDAghgGAbewjaL-x_7yVLLvwiwvbxWn2u-o20OeM';

/**
 * Get active Supabase configuration (from .env, localStorage, or cloud default fallback)
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
    if (localUrl.trim() && localKey.trim()) {
      return { url: localUrl.trim(), anonKey: localKey.trim(), isFromEnv: false };
    }
  } catch {}

  // Fallback to cloud Supabase production credentials
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isFromEnv: false
  };
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
