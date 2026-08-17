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

  sortedGenerations.forEach(gen => {
    const genMembers = generationsMap.get(gen) || [];
    const y = generationYMap.get(gen) || 140;
    
    const placedInGen = new Set<string>();
    const units: FamilyMember[][] = [];

    // Separate bloodline members (who have parentIds) vs others, sorted by birth order
    const bloodlineMembers = genMembers
      .filter(m => m.parentIds && m.parentIds.length > 0)
      .sort((a, b) => (a.order || 1) - (b.order || 1));

    const otherMembers = genMembers.filter(m => !m.parentIds || m.parentIds.length === 0);

    // Group couples: The bloodline member MUST be on the LEFT, spouse on the RIGHT
    [...bloodlineMembers, ...otherMembers].forEach(member => {
      if (placedInGen.has(member.id)) return;

      const unit: FamilyMember[] = [member];
      placedInGen.add(member.id);

      // Add spouses defined on this member
      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach(sp => {
          const spouseObj = members[sp.spouseId];
          if (spouseObj && !placedInGen.has(spouseObj.id)) {
            unit.push(spouseObj);
            placedInGen.add(spouseObj.id);
          }
        });
      }

      // Add spouses defined on other members
      genMembers.forEach(other => {
        if (!placedInGen.has(other.id) && other.spouses && other.spouses.some(s => s.spouseId === member.id)) {
          unit.push(other);
          placedInGen.add(other.id);
        }
      });

      // Strict Couple Rule: Bloodline / primary member ALWAYS at index 0 (LEFT), spouse at index 1 (RIGHT)
      unit.sort((a, b) => {
        const aHasParents = (a.parentIds && a.parentIds.length > 0) ? 1 : 0;
        const bHasParents = (b.parentIds && b.parentIds.length > 0) ? 1 : 0;
        if (aHasParents !== bHasParents) {
          return bHasParents - aHasParents; // 1 (has parents) comes before 0 (no parents)
        }
        return (a.order || 1) - (b.order || 1);
      });

      units.push(unit);
    });

    // Sort all units across the generation row:
    // 1. Grouped directly under their parents' X position
    // 2. Siblings under same parents are ordered strictly from left (Anak 1) to right (Anak terakhir)
    units.sort((unitA, unitB) => {
      const getUnitParentAvgX = (unit: FamilyMember[]): number => {
        let sumX = 0;
        let count = 0;
        unit.forEach(m => {
          if (m.parentIds && m.parentIds.length > 0) {
            m.parentIds.forEach(pId => {
              if (nodes[pId]) {
                sumX += nodes[pId].x;
                count++;
              }
            });
          }
        });
        return count > 0 ? sumX / count : 9999;
      };

      const parentXA = getUnitParentAvgX(unitA);
      const parentXB = getUnitParentAvgX(unitB);

      if (Math.abs(parentXA - parentXB) > 20) {
        return parentXA - parentXB;
      }

      // Same parents: sort strictly by birth order
      const primaryA = unitA.find(m => m.parentIds && m.parentIds.length > 0) || unitA[0];
      const primaryB = unitB.find(m => m.parentIds && m.parentIds.length > 0) || unitB[0];
      return (primaryA.order || 1) - (primaryB.order || 1);
    });

    let totalGenWidth = 0;
    const unitWidths = units.map(u => {
      const uWidth = u.length * NODE_SIZE + (u.length - 1) * SPOUSE_GAP;
      totalGenWidth += uWidth;
      return uWidth;
    });

    totalGenWidth += Math.max(0, units.length - 1) * HORIZONTAL_GAP;

    let currentX = 600 - totalGenWidth / 2;

    units.forEach((unit, uIdx) => {
      unit.forEach((m, mIdx) => {
        const x = currentX + mIdx * (NODE_SIZE + SPOUSE_GAP) + NODE_SIZE / 2;
        const totalDesc = countDescendants(m.id);
        
        nodes[m.id] = {
          id: m.id,
          member: m,
          x,
          y,
          width: NODE_SIZE,
          height: NODE_SIZE,
          generation: gen,
          isOldestGeneration: gen === 1,
          totalDescendants: totalDesc,
          spouses: []
        };
      });

      currentX += unitWidths[uIdx] + HORIZONTAL_GAP;
    });
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
