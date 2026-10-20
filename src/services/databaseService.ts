import type { FamilyData, FamilyMember } from '../types/family';

export function isDatabaseConfigured(): boolean { return true; }

export async function apiRequest<T>(action: string, options: RequestInit = {}, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ action, ...params });
  const response = await fetch(`/api/data?${query}`, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Permintaan database gagal.');
  return data as T;
}

export function fetchAllFamilyTrees(): Promise<Array<{ id: string; slug: string; tree_name: string }>> {
  return apiRequest('trees');
}

export async function fetchFamilyData(slug = 'keluargabanisukandi', _options: { readOnly?: boolean; treeId?: string } = {}): Promise<FamilyData | null> {
  const response = await fetch(`/api/data?${new URLSearchParams({ action: 'tree', slug })}`, { credentials: 'same-origin' });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Data keluarga tidak dapat dimuat.');
  return data;
}

export async function syncEntireTree(familyData: FamilyData, slug?: string): Promise<{ success: boolean; message: string; treeId?: string }> {
  try { return await apiRequest('tree', { method: 'POST', body: JSON.stringify({ ...familyData, slug: slug || familyData.slug }) }); }
  catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Gagal menyimpan data.' }; }
}

export async function saveMember(member: FamilyMember, treeId?: string): Promise<boolean> {
  try { await apiRequest('member', { method: 'POST', body: JSON.stringify({ member, treeId }) }); return true; }
  catch (error) { console.error('Gagal menyimpan anggota:', error); return false; }
}

export async function deleteMember(id: string, treeId?: string): Promise<boolean> {
  if (!treeId) return false;
  try { await apiRequest('member', { method: 'DELETE' }, { id, treeId }); return true; }
  catch (error) { console.error('Gagal menghapus anggota:', error); return false; }
}

export async function uploadImage(data: string | File | Blob, _folder?: 'avatars' | 'gallery', _filename?: string): Promise<string> {
  if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('/api/'))) return data;
  const dataUrl = typeof data === 'string' ? data : await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(data);
  });
  return (await apiRequest<{ url: string }>('asset', { method: 'POST', body: JSON.stringify({ dataUrl }) })).url;
}
