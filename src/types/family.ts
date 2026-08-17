/**
 * Family Tree Data Types & Interfaces
 */

export type Gender = 'male' | 'female' | 'other';

export type ParentRelationType = 'biological' | 'adopted' | 'foster' | 'step';

export type MarriageStatus = 'married' | 'divorced' | 'separated' | 'widowed';

export interface SpouseRelation {
  spouseId: string;
  status: MarriageStatus;
  marriageDate?: string;
  divorceDate?: string;
  note?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  date?: string;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  nickname?: string;
  title?: string; // Gelar (e.g. H., Hj., Dr., S.Kom)
  gender: Gender;
  generation: number; // 1 = Buyut/Leluhur, 2 = Kakek/Nenek, 3 = Orang Tua, 4 = Anak, 5 = Cucu, dst.
  
  // Birth & Life Status
  birthDate?: string; // YYYY-MM-DD or text
  birthPlace?: string;
  isDeceased: boolean;
  passedDate?: string;
  passedPlace?: string;
  burialPlace?: string;

  // Background Attributes
  education?: string;
  occupation?: string;
  workplace?: string;
  residence?: string;
  phone?: string;
  email?: string;
  socialMedia?: string;
  bio?: string;

  // Photos
  avatar: string; // URL or optimized DataURL
  thumbnail?: string; // 120px optimized version for canvas
  gallery?: GalleryPhoto[];

  // Tree Connections
  parentIds: string[]; // [fatherId, motherId] or single parent
  relationshipToParents: ParentRelationType;
  spouses: SpouseRelation[];
  order?: number; // Birth order among siblings (1 = anak pertama, 2 = anak kedua, etc.)
  
  // Custom metadata or tags
  tags?: string[];
}

export interface FamilyData {
  id?: string;
  treeId?: string;
  slug?: string;
  familyTreeName: string;
  description?: string;
  members: Record<string, FamilyMember>;
  updatedAt: string;
}

// Layout & Graph Rendering Types
export interface LayoutNode {
  id: string;
  member: FamilyMember;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
  isOldestGeneration: boolean;
  totalDescendants: number;
  spouses: LayoutNode[];
}

export type EdgeType = 
  | 'marriage-active' 
  | 'marriage-divorced' 
  | 'parent-child-bio' 
  | 'parent-child-adopted';

export interface LayoutEdge {
  id: string;
  fromId: string;
  toId: string;
  type: EdgeType;
  points: Array<{ x: number; y: number }>;
  label?: string;
  midpoint?: { x: number; y: number };
}

export interface TreeLayout {
  nodes: Record<string, LayoutNode>;
  edges: LayoutEdge[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  generationLevels: { generation: number; name: string; y: number; count: number; minX: number; maxX: number; centerX: number }[];
}

export type LODLevel = 'macro' | 'medium' | 'micro';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}
