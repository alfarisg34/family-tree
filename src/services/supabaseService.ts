import { getSupabaseClient } from '../utils/supabaseClient';
import type { FamilyData, FamilyMember } from '../types/family';
import { getInitialFamilyDataBySlug } from '../data/sampleFamily';

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
  const row: Record<string, any> = {
    id: member.id,
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

  if (treeId) {
    row.tree_id = treeId;
  }

  return row;
}

/**
 * Upload photo to Supabase Storage 'family-photos' bucket
 */
export async function uploadImageToSupabaseStorage(
  dataUrlOrFile: string | File | Blob,
  folder: 'avatars' | 'gallery' = 'avatars',
  filename?: string
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) return typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '';

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
 * Fetch all available family trees (for switcher dropdown)
 */
export async function fetchAllFamilyTreesFromSupabase(): Promise<Array<{ id: string; slug: string; tree_name: string }>> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('family_trees')
      .select('id, slug, tree_name')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Fetch tree data & members for a specific family slug from Supabase
 */
export async function fetchFamilyDataFromSupabase(slug: string = 'keluargabanisukandi'): Promise<FamilyData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const defaultTemplate = getInitialFamilyDataBySlug(slug);

    // 1. Fetch tree record by slug or tree_name
    let treeRecord: any = null;

    // Try matching slug column first
    const { data: treeBySlug } = await supabase
      .from('family_trees')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (treeBySlug) {
      treeRecord = treeBySlug;
    } else {
      // Try matching by tree_name
      const { data: treeByName } = await supabase
        .from('family_trees')
        .select('*')
        .ilike('tree_name', `%${slug.replace(/^keluarga(besar)?(bani)?/i, '')}%`)
        .maybeSingle();

      if (treeByName) {
        treeRecord = treeByName;
      }
    }

    // If tree does not exist yet in Supabase, create it!
    if (!treeRecord) {
      const insertPayload: Record<string, any> = {
        tree_name: defaultTemplate.familyTreeName,
        description: defaultTemplate.description || ''
      };
      
      // Attempt to include slug if supported
      try {
        insertPayload.slug = slug;
      } catch {}

      const { data: newTree, error: createTreeErr } = await supabase
        .from('family_trees')
        .insert(insertPayload)
        .select('*')
        .single();

      if (createTreeErr) {
        console.warn('Could not insert new tree in family_trees, trying fallback without slug:', createTreeErr.message);
        delete insertPayload.slug;
        const { data: fallbackTree } = await supabase
          .from('family_trees')
          .insert(insertPayload)
          .select('*')
          .single();
        treeRecord = fallbackTree;
      } else {
        treeRecord = newTree;
      }
    }

    if (!treeRecord) return null;

    const treeId = treeRecord.id;
    const treeName = treeRecord.tree_name || defaultTemplate.familyTreeName;
    const description = treeRecord.description || defaultTemplate.description || '';

    // 2. Fetch all members belonging to this specific tree_id
    const { data: membersRows, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('tree_id', treeId)
      .order('generation', { ascending: true })
      .order('order_num', { ascending: true });

    if (membersError) {
      console.error('Error fetching family_members from Supabase:', membersError.message);
      return null;
    }

    // If 0 members in Supabase for this tree, auto-seed default members!
    if (!membersRows || membersRows.length === 0) {
      console.log(`Tree ${slug} is empty in Supabase, auto-seeding initial members...`);
      const defaultMembers = Object.values(defaultTemplate.members);
      const rowsToInsert = defaultMembers.map(m => mapMemberToDbRow(m, treeId));
      
      await supabase.from('family_members').upsert(rowsToInsert);

      return {
        id: treeId,
        treeId,
        slug,
        familyTreeName: treeName,
        description,
        members: defaultTemplate.members,
        updatedAt: new Date().toISOString()
      };
    }

    const members: Record<string, FamilyMember> = {};
    membersRows.forEach((row) => {
      const mem = mapDbRowToMember(row);
      members[mem.id] = mem;
    });

    return {
      id: treeId,
      treeId,
      slug,
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
export async function saveMemberToSupabase(member: FamilyMember, treeId?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = mapMemberToDbRow(member, treeId);
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
export async function syncEntireTreeToSupabase(familyData: FamilyData, slug?: string): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum terkonfigurasi' };
  }

  try {
    const currentSlug = slug || familyData.slug || 'keluargabanisukandi';
    let treeId = familyData.treeId || familyData.id;

    if (!treeId) {
      const { data: newTree } = await supabase
        .from('family_trees')
        .insert({
          slug: currentSlug,
          tree_name: familyData.familyTreeName,
          description: familyData.description || ''
        })
        .select('id')
        .single();
      treeId = newTree?.id;
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
