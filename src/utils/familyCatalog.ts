import { fetchAllFamilyTrees, fetchFamilyData } from '../services/databaseService';
import type { FamilyData } from '../types/family';
import { isDatabaseConfigured } from '../services/databaseService';

export function getCachedFamily(slug: string): FamilyData | null {
  try {
    const value = JSON.parse(localStorage.getItem(`family_tree_data_${slug}`) || 'null');
    return value && typeof value.familyTreeName === 'string' && value.members && typeof value.members === 'object' ? value : null;
  } catch { return null; }
}

export async function loadFamilyCatalog(): Promise<FamilyData[]> {
  const families = new Map<string, FamilyData>();
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith('family_tree_data_')) continue;
    const slug = key.slice('family_tree_data_'.length);
    if (['admin', 'manage'].includes(slug)) continue;
    const cached = getCachedFamily(slug);
    if (cached) families.set(slug, { ...cached, slug });
  }
  if (isDatabaseConfigured()) {
    const trees = await fetchAllFamilyTrees();
    await Promise.all(trees.map(async (tree) => {
      const remote = await fetchFamilyData(tree.slug, { readOnly: true, treeId: tree.id });
      if (remote) families.set(tree.slug, remote);
    }));
  }
  return [...families.values()].sort((a, b) => a.familyTreeName.localeCompare(b.familyTreeName));
}
