import { useState, useEffect, useCallback, useRef } from 'react';
import type { FamilyData, FamilyMember, ParentRelationType, MarriageStatus } from '../types/family';
import { initialFamilyData } from '../data/sampleFamily';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import {
  fetchFamilyDataFromSupabase,
  saveMemberToSupabase,
  deleteMemberFromSupabase,
  syncEntireTreeToSupabase
} from '../services/supabaseService';

const STORAGE_KEY = 'family_tree_data_v1';
const ADMIN_STORAGE_KEY = 'family_tree_admin_session';

export function useFamilyData() {
  const [familyData, setFamilyData] = useState<FamilyData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load family data from localStorage', e);
    }
    return initialFamilyData;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isInitialSyncDone = useRef(false);

  // Automatic load & automatic initial sync with Supabase
  useEffect(() => {
    if (isSupabaseConfigured() && !isInitialSyncDone.current) {
      isInitialSyncDone.current = true;
      setIsCloudSyncing(true);

      fetchFamilyDataFromSupabase()
        .then(async (remoteData) => {
          if (remoteData && Object.keys(remoteData.members).length > 0) {
            // Load remote data from Supabase
            setFamilyData(remoteData);
          } else {
            // Supabase is empty: Automatically seed / sync current tree data to Supabase!
            console.log('Supabase is empty, automatically synchronizing initial family tree...');
            await syncEntireTreeToSupabase(familyData);
          }
        })
        .catch((e) => {
          console.warn('Could not sync with Supabase, using local data', e);
        })
        .finally(() => {
          setIsCloudSyncing(false);
        });
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(familyData));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [familyData]);

  // Admin login / logout
  const loginAdmin = (password: string): boolean => {
    if (password === 'admin' || password === 'keluarga123' || password === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  // Add / Update member with bidirectional relation synchronization
  const saveMember = (member: FamilyMember) => {
    setFamilyData((prev) => {
      const updatedMembers = { ...prev.members, [member.id]: member };
      
      // Synchronize bidirectional spouse relationships
      const currentSpouseIds = new Set((member.spouses || []).map((s) => s.spouseId));

      // 1. Update reciprocal spouse link in each spouse's record
      (member.spouses || []).forEach((sp) => {
        const spouseObj = updatedMembers[sp.spouseId];
        if (spouseObj) {
          const spouseList = spouseObj.spouses || [];
          const existingIdx = spouseList.findIndex((s) => s.spouseId === member.id);
          const reciprocalEntry = {
            spouseId: member.id,
            status: sp.status,
            marriageDate: sp.marriageDate,
            divorceDate: sp.divorceDate,
            note: sp.note
          };

          let newSpouseList = [...spouseList];
          if (existingIdx >= 0) {
            newSpouseList[existingIdx] = reciprocalEntry;
          } else {
            newSpouseList.push(reciprocalEntry);
          }

          updatedMembers[sp.spouseId] = {
            ...spouseObj,
            spouses: newSpouseList
          };

          if (isSupabaseConfigured()) {
            saveMemberToSupabase(updatedMembers[sp.spouseId]);
          }
        }
      });

      // 2. Remove reciprocal spouse link from removed spouses
      Object.keys(updatedMembers).forEach((otherId) => {
        if (otherId !== member.id && !currentSpouseIds.has(otherId)) {
          const otherMember = updatedMembers[otherId];
          if (otherMember.spouses && otherMember.spouses.some((s) => s.spouseId === member.id)) {
            const cleanedSpouses = otherMember.spouses.filter((s) => s.spouseId !== member.id);
            updatedMembers[otherId] = {
              ...otherMember,
              spouses: cleanedSpouses
            };
            if (isSupabaseConfigured()) {
              saveMemberToSupabase(updatedMembers[otherId]);
            }
          }
        }
      });

      const newData = {
        ...prev,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        saveMemberToSupabase(member);
      }

      return newData;
    });
  };

  // Quick Add Relative
  const addRelative = useCallback((
    sourceMemberId: string,
    relationDirection: 'parent' | 'child' | 'spouse' | 'sibling',
    partialData: Partial<FamilyMember>,
    extraOptions?: {
      relationshipType?: ParentRelationType;
      marriageStatus?: MarriageStatus;
      spouseIdForChild?: string;
    }
  ) => {
    setFamilyData((prev) => {
      const sourceMember = prev.members[sourceMemberId];
      if (!sourceMember) return prev;

      const newId = 'mem-' + Date.now();
      const updatedMembers = { ...prev.members };

      let generation = sourceMember.generation;
      let parentIds: string[] = [];
      let relationshipToParents: ParentRelationType = extraOptions?.relationshipType || 'biological';
      let calculatedSpouses: FamilyMember['spouses'] = [];

      if (relationDirection === 'parent') {
        generation = Math.max(1, sourceMember.generation - 1);
        const updatedSourceParents = Array.from(new Set([...(sourceMember.parentIds || []), newId]));
        updatedMembers[sourceMemberId] = {
          ...sourceMember,
          parentIds: updatedSourceParents
        };
      } else if (relationDirection === 'child') {
        generation = sourceMember.generation + 1;
        parentIds = [sourceMemberId];
        if (extraOptions?.spouseIdForChild) {
          parentIds.push(extraOptions.spouseIdForChild);
        } else if (sourceMember.spouses && sourceMember.spouses.length > 0) {
          const activeSpouse = sourceMember.spouses.find(s => s.status === 'married') || sourceMember.spouses[0];
          if (activeSpouse) {
            parentIds.push(activeSpouse.spouseId);
          }
        }
      } else if (relationDirection === 'spouse') {
        generation = sourceMember.generation;
        const marriageStatus: MarriageStatus = extraOptions?.marriageStatus || 'married';
        
        calculatedSpouses = [{
          spouseId: sourceMemberId,
          status: marriageStatus
        }];

        const sourceSpouses = [...(sourceMember.spouses || []).filter(s => s.spouseId !== newId), {
          spouseId: newId,
          status: marriageStatus
        }];
        updatedMembers[sourceMemberId] = {
          ...sourceMember,
          spouses: sourceSpouses
        };
      } else if (relationDirection === 'sibling') {
        generation = sourceMember.generation;
        parentIds = [...(sourceMember.parentIds || [])];
        relationshipToParents = sourceMember.relationshipToParents || 'biological';
      }

      const defaultAvatar = partialData.gender === 'female'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop';

      const finalSpouses = calculatedSpouses.length > 0 
        ? calculatedSpouses 
        : (partialData.spouses || []);

      const newMember: FamilyMember = {
        ...partialData,
        id: newId,
        fullName: partialData.fullName || 'Nama Anggota Baru',
        nickname: partialData.nickname || '',
        title: partialData.title || '',
        gender: partialData.gender || 'female',
        generation,
        birthDate: partialData.birthDate || '',
        birthPlace: partialData.birthPlace || '',
        isDeceased: partialData.isDeceased || false,
        passedDate: partialData.passedDate || '',
        passedPlace: partialData.passedPlace || '',
        burialPlace: partialData.burialPlace || '',
        education: partialData.education || '',
        occupation: partialData.occupation || '',
        workplace: partialData.workplace || '',
        residence: partialData.residence || '',
        phone: partialData.phone || '',
        email: partialData.email || '',
        bio: partialData.bio || '',
        avatar: partialData.avatar || defaultAvatar,
        gallery: partialData.gallery || [],
        parentIds: parentIds.length > 0 ? parentIds : (partialData.parentIds || []),
        relationshipToParents,
        spouses: finalSpouses,
        order: (sourceMember.order || 1) + 1
      };

      updatedMembers[newId] = newMember;

      if (isSupabaseConfigured()) {
        saveMemberToSupabase(newMember);
        if (updatedMembers[sourceMemberId]) {
          saveMemberToSupabase(updatedMembers[sourceMemberId]);
        }
      }

      return {
        ...prev,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  // Delete Member
  const deleteMember = (id: string) => {
    setFamilyData((prev) => {
      const updatedMembers = { ...prev.members };
      delete updatedMembers[id];

      Object.keys(updatedMembers).forEach((key) => {
        const m = updatedMembers[key];
        let changed = false;
        let newParentIds = m.parentIds;
        let newSpouses = m.spouses;

        if (m.parentIds && m.parentIds.includes(id)) {
          newParentIds = m.parentIds.filter(pId => pId !== id);
          changed = true;
        }

        if (m.spouses && m.spouses.some(s => s.spouseId === id)) {
          newSpouses = m.spouses.filter(s => s.spouseId !== id);
          changed = true;
        }

        if (changed) {
          updatedMembers[key] = {
            ...m,
            parentIds: newParentIds,
            spouses: newSpouses
          };
          if (isSupabaseConfigured()) {
            saveMemberToSupabase(updatedMembers[key]);
          }
        }
      });

      if (isSupabaseConfigured()) {
        deleteMemberFromSupabase(id);
      }

      return {
        ...prev,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };
    });
  };

  // Export JSON
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(familyData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `silsilah_keluarga_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.members && typeof parsed.members === 'object') {
        setFamilyData(parsed);
        if (isSupabaseConfigured()) {
          syncEntireTreeToSupabase(parsed);
        }
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON file', e);
    }
    return false;
  };

  // Reset to default sample
  const resetToSample = () => {
    setFamilyData(initialFamilyData);
    if (isSupabaseConfigured()) {
      syncEntireTreeToSupabase(initialFamilyData);
    }
  };

  const updateEntireFamilyData = (newData: FamilyData) => {
    setFamilyData(newData);
  };

  return {
    familyData,
    isAdmin,
    isCloudSyncing,
    loginAdmin,
    logoutAdmin,
    saveMember,
    addRelative,
    deleteMember,
    exportJSON,
    importJSON,
    resetToSample,
    updateEntireFamilyData
  };
}
