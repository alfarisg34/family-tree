import type { FamilyData } from '../types/family';

// 1. Template Keluarga Besar Bani Sukandi (/keluargabanisukandi)
export const sukandiFamilyData: FamilyData = {
  slug: "keluargabanisukandi",
  familyTreeName: "Keluarga Besar Bani Sukandi",
  description: "Silsilah Garis Keturunan Keluarga Besar Bani Sukandi",
  updatedAt: new Date().toISOString(),
  members: {
    // ==========================================
    // GENERASI 1: LELUHUR TERTUA (GEN 1)
    // ==========================================
    "mem-sukandi": {
      id: "mem-sukandi",
      fullName: "Sukandi",
      nickname: "Uyut Sukandi",
      gender: "male",
      generation: 1,
      isDeceased: true,
      bio: "Leluhur dan pendiri silsilah keluarga besar Bani Sukandi.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 1
    },

    // ==========================================
    // GENERASI 2: (GEN 2)
    // ==========================================
    "mem-maskanah": {
      id: "mem-maskanah",
      fullName: "Hj. Maskanah",
      nickname: "Mi'u",
      title: "Hj.",
      gender: "female",
      generation: 2,
      isDeceased: false,
      bio: "Putri dari Sukandi (Uyut Sukandi).",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-sukandi"],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 1
    },

    "mem-diah": {
      id: "mem-diah",
      fullName: "Hj. Diah",
      nickname: "Uyut Diah",
      title: "Hj.",
      gender: "female",
      generation: 2,
      isDeceased: false,
      bio: "Putri dari Sukandi (Uyut Sukandi).",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-sukandi"],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 2
    },

    // ==========================================
    // GENERASI 3: (GEN 3)
    // ==========================================
    "mem-komalasari": {
      id: "mem-komalasari",
      fullName: "Hj. Komalasari",
      nickname: "Mani",
      title: "Hj.",
      gender: "female",
      generation: 3,
      isDeceased: false,
      bio: "Putri dari Hj. Maskanah (Mi'u).",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-maskanah"],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 1
    },

    "mem-buni": {
      id: "mem-buni",
      fullName: "Buni",
      nickname: "Buni",
      gender: "male",
      generation: 3,
      isDeceased: false,
      bio: "Putra dari Hj. Maskanah (Mi'u).",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-maskanah"],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 2
    },

    // ==========================================
    // GENERASI 4: (GEN 4)
    // ==========================================
    // 1. Diyan Hikmayati & Siswantoro (Anak Pertama)
    "mem-diyan": {
      id: "mem-diyan",
      fullName: "Diyan Hikmayati",
      nickname: "Umi",
      gender: "female",
      generation: 4,
      isDeceased: false,
      bio: "Anak pertama dari Hj. Komalasari (Mani). Pasangan dari Siswantoro.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-komalasari"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-siswantoro",
          status: "married"
        }
      ],
      gallery: [],
      order: 1
    },

    "mem-siswantoro": {
      id: "mem-siswantoro",
      fullName: "Siswantoro",
      gender: "male",
      generation: 4,
      isDeceased: false,
      bio: "Suami / Pasangan dari Diyan Hikmayati (Umi).",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-diyan",
          status: "married"
        }
      ],
      gallery: [],
      order: 1
    },

    // 2. Yudhi Hikmayadi & Witha (Anak Kedua)
    "mem-yudhi": {
      id: "mem-yudhi",
      fullName: "Yudhi Hikmayadi",
      nickname: "Papap",
      gender: "male",
      generation: 4,
      isDeceased: false,
      bio: "Anak kedua dari Hj. Komalasari (Mani), adik dari Diyan Hikmayati. Pasangan dari Witha.",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-komalasari"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-witha",
          status: "married"
        }
      ],
      gallery: [],
      order: 2
    },

    "mem-witha": {
      id: "mem-witha",
      fullName: "Witha",
      gender: "female",
      generation: 4,
      isDeceased: false,
      bio: "Istri / Pasangan dari Yudhi Hikmayadi (Papap).",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-yudhi",
          status: "married"
        }
      ],
      gallery: [],
      order: 2
    },

    // 3. Ferry Hilman Purnama & Tante Ending (Anak Ketiga)
    "mem-ferry": {
      id: "mem-ferry",
      fullName: "Ferry Hilman Purnama",
      nickname: "Om Pei",
      gender: "male",
      generation: 4,
      isDeceased: false,
      bio: "Anak dari Hj. Komalasari (Mani). Pasangan dari Tante Ending.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80&auto=format&fit=crop",
      parentIds: ["mem-komalasari"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-ending",
          status: "married"
        }
      ],
      gallery: [],
      order: 3
    },

    "mem-ending": {
      id: "mem-ending",
      fullName: "Ending",
      nickname: "Tante Ending",
      gender: "female",
      generation: 4,
      isDeceased: false,
      bio: "Istri / Pasangan dari Ferry Hilman Purnama (Om Pei).",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "mem-ferry",
          status: "married"
        }
      ],
      gallery: [],
      order: 3
    }
  }
};

// 2. Template Keluarga Hajjah Robbanisah (/keluargahajjahrobbanisah)
export const robbanisahFamilyData: FamilyData = {
  slug: "keluargahajjahrobbanisah",
  familyTreeName: "Keluarga Besar Hajjah Robbanisah",
  description: "Silsilah Garis Keturunan Keluarga Besar Hajjah Robbanisah",
  updatedAt: new Date().toISOString(),
  members: {
    "mem-robbanisah": {
      id: "mem-robbanisah",
      fullName: "Hj. Robbanisah",
      nickname: "Hajjah Robbanisah",
      title: "Hj.",
      gender: "female",
      generation: 1,
      isDeceased: false,
      bio: "Leluhur dan pendiri silsilah keluarga besar Hajjah Robbanisah.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 1
    }
  }
};

// 3. Template Keluarga Harun Thaib (/keluargaharunthaib)
export const harunThaibFamilyData: FamilyData = {
  slug: "keluargaharunthaib",
  familyTreeName: "Keluarga Besar Harun Thaib",
  description: "Silsilah Garis Keturunan Keluarga Besar Harun Thaib",
  updatedAt: new Date().toISOString(),
  members: {
    "mem-harun-thaib": {
      id: "mem-harun-thaib",
      fullName: "Harun Thaib",
      nickname: "Uyut Harun",
      gender: "male",
      generation: 1,
      isDeceased: true,
      bio: "Leluhur dan pendiri silsilah Keluarga Besar Harun Thaib.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [],
      gallery: [],
      order: 1
    }
  }
};

export const initialFamilyData = sukandiFamilyData;

/**
 * Get initial template by slug
 */
export function getInitialFamilyDataBySlug(slug: string): FamilyData {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleanSlug === 'keluargaharunthaib') {
    return harunThaibFamilyData;
  }
  if (cleanSlug === 'keluargahajjahrobbanisah') {
    return robbanisahFamilyData;
  }
  if (cleanSlug === 'keluargabanisukandi') {
    return sukandiFamilyData;
  }

  // Generate generic template for any other custom family route
  const formattedTitle = cleanSlug
    .replace(/^keluarga/, 'Keluarga ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    slug: cleanSlug,
    familyTreeName: formattedTitle || 'Pohon Keluarga',
    description: `Silsilah Garis Keturunan ${formattedTitle || 'Pohon Keluarga'}`,
    updatedAt: new Date().toISOString(),
    members: {
      [`mem-${cleanSlug}-root`]: {
        id: `mem-${cleanSlug}-root`,
        fullName: `Leluhur Utama ${formattedTitle}`,
        gender: "male",
        generation: 1,
        isDeceased: false,
        bio: `Pendiri silsilah ${formattedTitle}`,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
        parentIds: [],
        relationshipToParents: "biological",
        spouses: [],
        gallery: [],
        order: 1
      }
    }
  };
}
