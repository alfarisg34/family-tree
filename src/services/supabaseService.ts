import { getSupabaseClient } from '../utils/supabaseClient';
import type { FamilyData, FamilyMember } from '../types/family';

// Map database row to FamilyMember TypeScript model
function mapDbRowToMember(row: any): FamilyMember {
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname || undefined,
    title: row.title || undefined,
    gender: row.gender || 'male',
    generation: row.generation || 1,
    birthDate: row.birth_date || undefined,
    birthPlace: row.birth_place || undefined,
    isDeceased: Boolean(row.is_deceased),
    passedDate: row.passed_date || undefined,
    passedPlace: row.passed_place || undefined,
    burialPlace: row.burial_place || undefined,
    education: row.education || undefined,
    occupation: row.occupation || undefined,
    workplace: row.workplace || undefined,
    residence: row.residence || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    bio: row.bio || undefined,
    avatar: row.avatar || '',
    thumbnail: row.thumbnail || undefined,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    parentIds: Array.isArray(row.parent_ids) ? row.parent_ids : [],
    relationshipToParents: row.relationship_to_parents || 'biological',
    spouses: Array.isArray(row.spouses) ? row.spouses : [],
    order: row.order_num || 1
  };
}

// Map FamilyMember TypeScript model to database row
function mapMemberToDbRow(member: FamilyMember, treeId?: string): Record<string, any> {
  return {
    id: member.id,
    ...(treeId ? { tree_id: treeId } : {}),
    full_name: member.fullName,
    nickname: member.nickname || null,
    title: member.title || null,
    gender: member.gender,
    generation: member.generation,
    birth_date: member.birthDate || null,
    birth_place: member.birthPlace || null,
    is_deceased: member.isDeceased,
    passed_date: member.passedDate || null,
    passed_place: member.passedPlace || null,
    burial_place: member.burialPlace || null,
    education: member.education || null,
    occupation: member.occupation || null,
    workplace: member.workplace || null,
    residence: member.residence || null,
    phone: member.phone || null,
    email: member.email || null,
    bio: member.bio || null,
    avatar: member.avatar,
    thumbnail: member.thumbnail || null,
    gallery: member.gallery || [],
    parent_ids: member.parentIds || [],
    relationship_to_parents: member.relationshipToParents || 'biological',
    spouses: member.spouses || [],
    order_num: member.order || 1,
    updated_at: new Date().toISOString()
  };
}

/**
 * Upload photo to Supabase Storage 'family-photos' bucket
 * Returns CDN public URL or fallback DataURL
 */
export async function uploadImageToSupabaseStorage(
  dataUrlOrFile: string | File | Blob,
  folder: 'avatars' | 'gallery' = 'avatars',
  filename?: string
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '';

  // If it is already an external HTTP link, keep as is
  if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.startsWith('http')) {
    return dataUrlOrFile;
  }

  try {
    let blob: Blob;
    let contentType = 'image/webp';

    if (typeof dataUrlOrFile === 'string') {
      const parts = dataUrlOrFile.split(',');
      const match = dataUrlOrFile.match(/data:([^;]+);/);
      if (match) contentType = match[1];
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      blob = new Blob([ab], { type: contentType });
    } else {
      blob = dataUrlOrFile;
      contentType = dataUrlOrFile.type || 'image/jpeg';
    }

    const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
    const cleanFilename = filename 
      ? `${filename}-${Date.now()}.${ext}` 
      : `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `${folder}/${cleanFilename}`;

    const { error } = await supabase.storage
      .from('family-photos')
      .upload(filePath, blob, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn('Supabase Storage notice (using optimized fallback):', error.message);
      return typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('family-photos')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (e) {
    console.warn('Storage upload notice (using fallback):', e);
    return typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '';
  }
}

/**
 * Fetch tree data & all family members from Supabase
 */
export async function fetchFamilyDataFromSupabase(): Promise<FamilyData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Fetch first tree or create default
    let treeName = 'Bani Sastrowardoyo & Siti Aminah';
    let description = 'Silsilah Keluarga Besar Trah Sastrowardoyo';

    const { data: treeData, error: treeError } = await supabase
      .from('family_trees')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (treeError) {
      console.warn('Could not fetch family_trees table:', treeError.message);
    } else if (treeData) {
      treeName = treeData.tree_name || treeName;
      description = treeData.description || description;
    }

    // 2. Fetch all members
    const { data: membersRows, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .order('generation', { ascending: true })
      .order('order_num', { ascending: true });

    if (membersError) {
      console.error('Error fetching family_members from Supabase:', membersError.message);
      return null;
    }

    if (!membersRows || membersRows.length === 0) {
      return null;
    }

    const members: Record<string, FamilyMember> = {};
    membersRows.forEach((row) => {
      const mem = mapDbRowToMember(row);
      members[mem.id] = mem;
    });

    return {
      familyTreeName: treeName,
      description,
      members,
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to communicate with Supabase:', err);
    return null;
  }
}

/**
 * Save / Upsert a single family member to Supabase
 */
export async function saveMemberToSupabase(member: FamilyMember): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = mapMemberToDbRow(member);
    const { error } = await supabase.from('family_members').upsert(row);
    if (error) {
      console.error('Error saving member to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save member to Supabase:', err);
    return false;
  }
}

/**
 * Delete a family member from Supabase
 */
export async function deleteMemberFromSupabase(memberId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('family_members').delete().eq('id', memberId);
    if (error) {
      console.error('Error deleting member from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete member from Supabase:', err);
    return false;
  }
}

/**
 * Sync entire FamilyData (all members & tree info) to Supabase in one batch
 */
export async function syncEntireTreeToSupabase(familyData: FamilyData): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum terkonfigurasi' };
  }

  try {
    // 1. Ensure tree record exists
    const { data: existingTree } = await supabase
      .from('family_trees')
      .select('id')
      .limit(1)
      .maybeSingle();

    let treeId = existingTree?.id;

    if (!treeId) {
      const { data: newTree, error: createTreeErr } = await supabase
        .from('family_trees')
        .insert({
          tree_name: familyData.familyTreeName,
          description: familyData.description || ''
        })
        .select('id')
        .single();

      if (createTreeErr) {
        return { success: false, message: 'Gagal membuat tree di Supabase: ' + createTreeErr.message };
      }
      treeId = newTree.id;
    } else {
      await supabase
        .from('family_trees')
        .update({
          tree_name: familyData.familyTreeName,
          description: familyData.description || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', treeId);
    }

    // 2. Batch upsert members
    const membersList = Object.values(familyData.members);
    const rows = membersList.map((m) => mapMemberToDbRow(m, treeId));

    const { error: upsertError } = await supabase.from('family_members').upsert(rows);
    if (upsertError) {
      return { success: false, message: 'Gagal mengunggah anggota ke Supabase: ' + upsertError.message };
    }

    return {
      success: true,
      message: `Berhasil sinkronisasi ${membersList.length} anggota keluarga ke database Supabase!`
    };
  } catch (err: any) {
    return { success: false, message: 'Error sinkronisasi: ' + (err?.message || 'Unknown error') };
  }
}
