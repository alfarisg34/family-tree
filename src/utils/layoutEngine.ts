import type {
  FamilyData,
  FamilyMember,
  LayoutNode,
  LayoutEdge,
  TreeLayout
} from '../types/family';
import { getGenerationLabel } from './dateUtils';

const NODE_SIZE = 120;
const HORIZONTAL_GAP = 140; // Space between different families/siblings
const SPOUSE_GAP = 90; // Space between married couples
const VERTICAL_LEVEL_GAP = 280; // Vertical space between generations

/**
 * Compute optimal coordinates for family tree nodes & edges
 */
export function computeFamilyTreeLayout(familyData: FamilyData): TreeLayout {
  const members = familyData.members;
  const memberList = Object.values(members);

  if (memberList.length === 0) {
    return {
      nodes: {},
      edges: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
      generationLevels: []
    };
  }

  // 1. Calculate generational levels topologically
  const effectiveGenMap = new Map<string, number>();

  memberList.forEach(m => {
    effectiveGenMap.set(m.id, m.generation || 1);
  });

  // Iterative topological resolution
  for (let pass = 0; pass < 6; pass++) {
    memberList.forEach(m => {
      if (m.parentIds && m.parentIds.length > 0) {
        let maxParentGen = 0;
        m.parentIds.forEach(pId => {
          if (effectiveGenMap.has(pId)) {
            maxParentGen = Math.max(maxParentGen, effectiveGenMap.get(pId)!);
          }
        });
        if (maxParentGen > 0) {
          const currentGen = effectiveGenMap.get(m.id) || 1;
          if (currentGen <= maxParentGen) {
            effectiveGenMap.set(m.id, maxParentGen + 1);
          }
        }
      }

      if (m.spouses && m.spouses.length > 0) {
        const mGen = effectiveGenMap.get(m.id) || 1;
        m.spouses.forEach(sp => {
          const spGen = effectiveGenMap.get(sp.spouseId);
          if (spGen !== undefined && spGen !== mGen) {
            const resolved = Math.max(mGen, spGen);
            effectiveGenMap.set(m.id, resolved);
            effectiveGenMap.set(sp.spouseId, resolved);
          }
        });
      }
    });
  }

  // Normalize so oldest generation starts at 1
  let minGenFound = Infinity;
  let maxGenFound = -Infinity;
  effectiveGenMap.forEach(g => {
    minGenFound = Math.min(minGenFound, g);
    maxGenFound = Math.max(maxGenFound, g);
  });

  const genOffset = minGenFound < 1 ? 1 - minGenFound : 0;
  if (genOffset !== 0) {
    memberList.forEach(m => {
      effectiveGenMap.set(m.id, (effectiveGenMap.get(m.id) || 1) + genOffset);
    });
  }

  // Group members into generations
  const generationsMap = new Map<number, FamilyMember[]>();
  memberList.forEach(m => {
    const gen = effectiveGenMap.get(m.id) || m.generation || 1;
    if (!generationsMap.has(gen)) {
      generationsMap.set(gen, []);
    }
    generationsMap.get(gen)!.push(m);
  });

  const nodes: Record<string, LayoutNode> = {};
  const edges: LayoutEdge[] = [];
  const processedSpousePairs = new Set<string>();

  // Count descendants for each member
  const countDescendants = (id: string, visited = new Set<string>()): number => {
    if (visited.has(id)) return 0;
    visited.add(id);
    let count = 0;
    memberList.forEach(m => {
      if (m.parentIds && m.parentIds.includes(id)) {
        count += 1 + countDescendants(m.id, visited);
      }
    });
    return count;
  };

  // 2. Position nodes layer by layer
  const sortedGenerations = Array.from(generationsMap.keys()).sort((a, b) => a - b);
  const generationYMap = new Map<number, number>();

  sortedGenerations.forEach((gen, idx) => {
    const yPos = 140 + idx * VERTICAL_LEVEL_GAP;
    generationYMap.set(gen, yPos);
  });

  // 2. Build Family Units Hierarchy
  interface FamilyUnit {
    id: string; // Primary member ID
    primaryMember: FamilyMember;
    spouse?: FamilyMember;
    generation: number;
    parentUnitId?: string;
    childrenUnits: FamilyUnit[];
    width: number;         // Visual width of [Primary, Spouse]
    subtreeWidth: number;  // Total width of this unit and all its descendants
    x: number;             // Center coordinate of this unit
    left: number;          // Left coordinate of node(s)
  }

  const unitMap = new Map<string, FamilyUnit>();
  const memberToUnitId = new Map<string, string>();
  const placedMemberIds = new Set<string>();

  // A. Group every member into an atomic FamilyUnit [Primary, Spouse?]
  sortedGenerations.forEach(gen => {
    const genMembers = generationsMap.get(gen) || [];
    const bloodline = genMembers
      .filter(m => m.parentIds && m.parentIds.length > 0)
      .sort((a, b) => (a.order || 1) - (b.order || 1));
    const others = genMembers.filter(m => !m.parentIds || m.parentIds.length === 0);

    [...bloodline, ...others].forEach(member => {
      if (placedMemberIds.has(member.id)) return;
      placedMemberIds.add(member.id);

      let foundSpouse: FamilyMember | undefined = undefined;
      if (member.spouses && member.spouses.length > 0) {
        for (const sp of member.spouses) {
          const sObj = members[sp.spouseId];
          if (sObj && !placedMemberIds.has(sObj.id)) {
            foundSpouse = sObj;
            placedMemberIds.add(sObj.id);
            break;
          }
        }
      }

      if (!foundSpouse) {
        for (const other of genMembers) {
          if (!placedMemberIds.has(other.id) && (!other.parentIds || other.parentIds.length === 0)) {
            if (other.spouses && other.spouses.some(s => s.spouseId === member.id)) {
              foundSpouse = other;
              placedMemberIds.add(other.id);
              break;
            }
          }
        }
      }

      const uWidth = foundSpouse ? (NODE_SIZE * 2 + SPOUSE_GAP) : NODE_SIZE;

      const unit: FamilyUnit = {
        id: member.id,
        primaryMember: member,
        spouse: foundSpouse,
        generation: gen,
        childrenUnits: [],
        width: uWidth,
        subtreeWidth: uWidth,
        x: 0,
        left: 0
      };

      unitMap.set(unit.id, unit);
      memberToUnitId.set(member.id, unit.id);
      if (foundSpouse) {
        memberToUnitId.set(foundSpouse.id, unit.id);
      }
    });
  });

  // B. Link parent units to children units
  unitMap.forEach(childUnit => {
    const pIds = childUnit.primaryMember.parentIds;
    if (pIds && pIds.length > 0) {
      for (const pId of pIds) {
        const parentUnitId = memberToUnitId.get(pId);
        if (parentUnitId && unitMap.has(parentUnitId)) {
          const parentUnit = unitMap.get(parentUnitId)!;
          if (!parentUnit.childrenUnits.includes(childUnit)) {
            parentUnit.childrenUnits.push(childUnit);
            childUnit.parentUnitId = parentUnit.id;
          }
          break;
        }
      }
    }
  });

  // Sort children units by birth order
  unitMap.forEach(unit => {
    unit.childrenUnits.sort((a, b) => (a.primaryMember.order || 1) - (b.primaryMember.order || 1));
  });

  // C. Bottom-up pass: calculate subtree width for every unit
  const computeSubtreeWidth = (unit: FamilyUnit): number => {
    if (unit.childrenUnits.length === 0) {
      unit.subtreeWidth = unit.width;
      return unit.subtreeWidth;
    }

    let totalChildrenW = 0;
    unit.childrenUnits.forEach((child, idx) => {
      const cW = computeSubtreeWidth(child);
      totalChildrenW += cW;
      if (idx > 0) totalChildrenW += HORIZONTAL_GAP;
    });

    unit.subtreeWidth = Math.max(unit.width, totalChildrenW);
    return unit.subtreeWidth;
  };

  // Find root units (units without parentUnitId)
  const rootUnits: FamilyUnit[] = [];
  unitMap.forEach(unit => {
    if (!unit.parentUnitId) {
      rootUnits.push(unit);
    }
  });

  rootUnits.sort((a, b) => (a.generation - b.generation) || (a.primaryMember.order || 1) - (b.primaryMember.order || 1));
  rootUnits.forEach(root => computeSubtreeWidth(root));

  // D. Top-down pass: assign horizontal X coordinates
  const positionUnitSubtree = (unit: FamilyUnit, startX: number) => {
    // Center the unit inside its allocated subtree block
    const blockCenter = startX + unit.subtreeWidth / 2;
    unit.x = blockCenter;
    unit.left = blockCenter - unit.width / 2;

    if (unit.childrenUnits.length > 0) {
      let childrenTotalW = 0;
      unit.childrenUnits.forEach((c, i) => {
        childrenTotalW += c.subtreeWidth;
        if (i > 0) childrenTotalW += HORIZONTAL_GAP;
      });

      let currentChildX = blockCenter - childrenTotalW / 2;
      unit.childrenUnits.forEach(child => {
        positionUnitSubtree(child, currentChildX);
        currentChildX += child.subtreeWidth + HORIZONTAL_GAP;
      });
    }
  };

  // Position all root units centered in the world
  let totalRootWidth = 0;
  rootUnits.forEach((root, idx) => {
    totalRootWidth += root.subtreeWidth;
    if (idx > 0) totalRootWidth += HORIZONTAL_GAP;
  });

  let currentRootX = 600 - totalRootWidth / 2;
  rootUnits.forEach(root => {
    positionUnitSubtree(root, currentRootX);
    currentRootX += root.subtreeWidth + HORIZONTAL_GAP;
  });

  // E. Convert placed FamilyUnits into LayoutNodes
  unitMap.forEach(unit => {
    const y = generationYMap.get(unit.generation) || (140 + (unit.generation - 1) * VERTICAL_LEVEL_GAP);
    const primaryX = unit.left + NODE_SIZE / 2;
    const totalDescPrimary = countDescendants(unit.primaryMember.id);

    nodes[unit.primaryMember.id] = {
      id: unit.primaryMember.id,
      member: unit.primaryMember,
      x: primaryX,
      y,
      width: NODE_SIZE,
      height: NODE_SIZE,
      generation: unit.generation,
      isOldestGeneration: unit.generation === 1,
      totalDescendants: totalDescPrimary,
      spouses: []
    };

    if (unit.spouse) {
      const spouseX = unit.left + NODE_SIZE + SPOUSE_GAP + NODE_SIZE / 2;
      const totalDescSpouse = countDescendants(unit.spouse.id);

      nodes[unit.spouse.id] = {
        id: unit.spouse.id,
        member: unit.spouse,
        x: spouseX,
        y,
        width: NODE_SIZE,
        height: NODE_SIZE,
        generation: unit.generation,
        isOldestGeneration: unit.generation === 1,
        totalDescendants: totalDescSpouse,
        spouses: []
      };
    }
  });

  // 3. Calculate straight vertical column X on the far left of the entire tree
  // Ensure a generous 100px+ clear margin between the longest generation label (~340px) and the leftmost node card:
  const allNodesList = Object.values(nodes);
  const overallMinX = allNodesList.length > 0 ? Math.min(...allNodesList.map(n => n.x - NODE_SIZE / 2)) : 600;
  const overallMaxX = allNodesList.length > 0 ? Math.max(...allNodesList.map(n => n.x + NODE_SIZE / 2)) : 600;
  const straightColumnX = overallMinX - 440; // Guaranteed safe clearance

  const generationLevels: TreeLayout['generationLevels'] = [];

  sortedGenerations.forEach((gen) => {
    const yPos = generationYMap.get(gen) || 140;
    const genNodes = Object.values(nodes).filter(n => (effectiveGenMap.get(n.id) || n.generation) === gen);

    generationLevels.push({
      generation: gen,
      name: getGenerationLabel(gen),
      y: yPos - 30, // Level with center of avatars
      count: genNodes.length,
      minX: straightColumnX,
      maxX: overallMaxX,
      centerX: (straightColumnX + overallMaxX) / 2
    });
  });

  // 4. Connect Spouses with Horizontal Marriage Lines
  memberList.forEach(member => {
    const nodeA = nodes[member.id];
    if (!nodeA) return;

    if (member.spouses && member.spouses.length > 0) {
      member.spouses.forEach(sp => {
        const nodeB = nodes[sp.spouseId];
        if (!nodeB) return;

        const pairKey = [member.id, sp.spouseId].sort().join('---');
        if (processedSpousePairs.has(pairKey)) return;
        processedSpousePairs.add(pairKey);

        const edgeType = sp.status === 'divorced' ? 'marriage-divorced' : 'marriage-active';
        
        // Avatar circle centers
        const isALeft = nodeA.x < nodeB.x;
        const leftNode = isALeft ? nodeA : nodeB;
        const rightNode = isALeft ? nodeB : nodeA;

        const startX = leftNode.x + 36;
        const endX = rightNode.x - 36;
        const lineY = nodeA.y - 30; // Center height of avatar image

        edges.push({
          id: `edge-spouse-${pairKey}`,
          fromId: leftNode.id,
          toId: rightNode.id,
          type: edgeType,
          points: [
            { x: startX, y: lineY },
            { x: endX, y: lineY }
          ],
          midpoint: { x: (startX + endX) / 2, y: lineY }
        });
      });
    }
  });

  // 5. Connect Parents to Children with 4-Point Orthogonal Bus Lines
  const parentGroups = new Map<string, string[]>();

  memberList.forEach(child => {
    if (child.parentIds && child.parentIds.length > 0) {
      const sortedParents = [...child.parentIds].sort().join('---');
      if (!parentGroups.has(sortedParents)) {
        parentGroups.set(sortedParents, []);
      }
      parentGroups.get(sortedParents)!.push(child.id);
    }
  });

  parentGroups.forEach((childrenIds, parentKey) => {
    const parentIdList = parentKey.split('---');
    const parentNodes = parentIdList.map(id => nodes[id]).filter(Boolean);
    if (parentNodes.length === 0) return;

    // Calculate marriage midpoint or parent center
    let sourceX: number;
    let sourceY: number;

    if (parentNodes.length >= 2) {
      sourceX = (parentNodes[0].x + parentNodes[1].x) / 2;
      sourceY = parentNodes[0].y - 30;
    } else {
      sourceX = parentNodes[0].x;
      sourceY = parentNodes[0].y + 40;
    }

    // Bus line runs in the clear horizontal gap between generations
    const busLineY = parentNodes[0].y + 125;

    childrenIds.forEach(childId => {
      const childNode = nodes[childId];
      if (!childNode) return;

      const child = members[childId];
      const edgeType = child?.relationshipToParents === 'adopted' 
        ? 'parent-child-adopted' 
        : 'parent-child-bio';

      const childTopY = childNode.y - 75; // Top of child avatar frame

      // 4-point orthogonal route:
      // Drop from marriage midpoint -> run through clear horizontal bus -> drop to child avatar top
      edges.push({
        id: `edge-child-${parentKey}-${childId}`,
        fromId: parentIdList[0],
        toId: childId,
        type: edgeType,
        points: [
          { x: sourceX, y: sourceY },
          { x: sourceX, y: busLineY },
          { x: childNode.x, y: busLineY },
          { x: childNode.x, y: childTopY }
        ]
      });
    });
  });

  // Calculate layout bounding box (including the straight generation column on left)
  let minX = straightColumnX;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  Object.values(nodes).forEach(n => {
    minX = Math.min(minX, n.x - NODE_SIZE / 2);
    maxX = Math.max(maxX, n.x + NODE_SIZE / 2);
    minY = Math.min(minY, n.y - 120);
    maxY = Math.max(maxY, n.y + 120);
  });

  if (minX === Infinity) {
    minX = 0;
    maxX = 800;
    minY = 0;
    maxY = 600;
  }

  const padding = 160;
  return {
    nodes,
    edges,
    bounds: {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    },
    generationLevels
  };
}
