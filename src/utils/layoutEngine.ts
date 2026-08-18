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
  interface MarriageSegment {
    spouseIndex: number; // 0 for primary + spouse1, 1 for spouse2, etc.
    children: FamilyUnit[];
    subtreeWidth: number;
  }

  interface FamilyUnit {
    id: string; // Primary member ID
    primaryMember: FamilyMember;
    spouses: FamilyMember[];
    generation: number;
    parentUnitId?: string;
    childrenUnits: FamilyUnit[];
    marriageSegments: MarriageSegment[];
    subtreeWidth: number;
  }

  const unitMap = new Map<string, FamilyUnit>();
  const memberToUnitId = new Map<string, string>();
  const placedMemberIds = new Set<string>();

  // A. Group every member into an atomic FamilyUnit [Primary, ...Spouses]
  sortedGenerations.forEach(gen => {
    const genMembers = generationsMap.get(gen) || [];
    const bloodline = genMembers
      .filter(m => m.parentIds && m.parentIds.length > 0)
      .sort((a, b) => (a.order || 1) - (b.order || 1));
    const others = genMembers.filter(m => !m.parentIds || m.parentIds.length === 0);

    [...bloodline, ...others].forEach(member => {
      if (placedMemberIds.has(member.id)) return;
      placedMemberIds.add(member.id);

      const foundSpouses: FamilyMember[] = [];
      if (member.spouses && member.spouses.length > 0) {
        for (const sp of member.spouses) {
          const sObj = members[sp.spouseId];
          if (sObj && !placedMemberIds.has(sObj.id)) {
            foundSpouses.push(sObj);
            placedMemberIds.add(sObj.id);
          }
        }
      }

      for (const other of genMembers) {
        if (!placedMemberIds.has(other.id) && (!other.parentIds || other.parentIds.length === 0)) {
          if (other.spouses && other.spouses.some(s => s.spouseId === member.id)) {
            foundSpouses.push(other);
            placedMemberIds.add(other.id);
          }
        }
      }

      const unit: FamilyUnit = {
        id: member.id,
        primaryMember: member,
        spouses: foundSpouses,
        generation: gen,
        childrenUnits: [],
        marriageSegments: [],
        subtreeWidth: 0
      };

      unitMap.set(unit.id, unit);
      memberToUnitId.set(member.id, unit.id);
      foundSpouses.forEach(sp => {
        memberToUnitId.set(sp.id, unit.id);
      });
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

  // C. Bottom-up pass: calculate subtree widths for each marriage segment
  const computeSubtreeWidth = (unit: FamilyUnit): number => {
    const numMarriages = Math.max(1, unit.spouses.length);
    const segments: MarriageSegment[] = [];

    for (let sIdx = 0; sIdx < numMarriages; sIdx++) {
      const spouseObj = unit.spouses[sIdx];
      const assignedChildren = unit.childrenUnits.filter(c => {
        const cParents = c.primaryMember.parentIds || [];
        if (sIdx === 0) {
          // Marriage 0: matched with spouse 0, OR has no second parent specified, OR is child of primary
          if (spouseObj && cParents.includes(spouseObj.id)) return true;
          if (!spouseObj) return true;
          // If child does not match any subsequent spouse, assign to marriage 0
          const otherSpouseIds = unit.spouses.slice(1).map(s => s.id);
          return !cParents.some(pId => otherSpouseIds.includes(pId));
        } else {
          // Subsequent marriage: must match this specific spouse
          return spouseObj && cParents.includes(spouseObj.id);
        }
      });

      let childrenTotalW = 0;
      assignedChildren.forEach((child, cIdx) => {
        const cW = computeSubtreeWidth(child);
        childrenTotalW += cW;
        if (cIdx > 0) childrenTotalW += HORIZONTAL_GAP;
      });

      const baseWidth = sIdx === 0 
        ? (unit.spouses.length > 0 ? (NODE_SIZE * 2 + SPOUSE_GAP) : NODE_SIZE)
        : NODE_SIZE;

      const segSubtreeW = Math.max(baseWidth, childrenTotalW);

      segments.push({
        spouseIndex: sIdx,
        children: assignedChildren,
        subtreeWidth: segSubtreeW
      });
    }

    unit.marriageSegments = segments;

    let totalW = 0;
    segments.forEach((seg, idx) => {
      totalW += seg.subtreeWidth;
      if (idx > 0) totalW += HORIZONTAL_GAP;
    });

    unit.subtreeWidth = totalW;
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

  // D. Top-down pass: assign horizontal X coordinates for nodes and children
  const positionUnitSubtree = (unit: FamilyUnit, startX: number) => {
    const y = generationYMap.get(unit.generation) || (140 + (unit.generation - 1) * VERTICAL_LEVEL_GAP);
    let curSegLeft = startX;

    unit.marriageSegments.forEach((seg, sIdx) => {
      const segMid = curSegLeft + seg.subtreeWidth / 2;

      if (sIdx === 0) {
        if (unit.spouses.length === 0) {
          // Single person
          nodes[unit.primaryMember.id] = {
            id: unit.primaryMember.id,
            member: unit.primaryMember,
            x: segMid,
            y,
            width: NODE_SIZE,
            height: NODE_SIZE,
            generation: unit.generation,
            isOldestGeneration: unit.generation === 1,
            totalDescendants: countDescendants(unit.primaryMember.id),
            spouses: []
          };
        } else {
          // If 1 spouse: Primary on left, Spouse 0 on right: [Primary, Spouse 0]
          // If 2+ spouses: Spouse 0 on left, Primary in middle: [Spouse 0, Primary]
          // so Primary connects to Spouse 0 on left and Spouse 1 on right without lines crossing!
          const hasMultipleSpouses = unit.spouses.length >= 2;
          const leftX = segMid - (NODE_SIZE + SPOUSE_GAP) / 2;
          const rightX = segMid + (NODE_SIZE + SPOUSE_GAP) / 2;

          const primaryX = hasMultipleSpouses ? rightX : leftX;
          const spouse0X = hasMultipleSpouses ? leftX : rightX;

          nodes[unit.primaryMember.id] = {
            id: unit.primaryMember.id,
            member: unit.primaryMember,
            x: primaryX,
            y,
            width: NODE_SIZE,
            height: NODE_SIZE,
            generation: unit.generation,
            isOldestGeneration: unit.generation === 1,
            totalDescendants: countDescendants(unit.primaryMember.id),
            spouses: []
          };

          const sp0 = unit.spouses[0];
          nodes[sp0.id] = {
            id: sp0.id,
            member: sp0,
            x: spouse0X,
            y,
            width: NODE_SIZE,
            height: NODE_SIZE,
            generation: unit.generation,
            isOldestGeneration: unit.generation === 1,
            totalDescendants: countDescendants(sp0.id),
            spouses: []
          };
        }
      } else {
        // Subsequent spouse (sIdx >= 1): place directly above its children
        const spK = unit.spouses[sIdx];
        if (spK) {
          nodes[spK.id] = {
            id: spK.id,
            member: spK,
            x: segMid,
            y,
            width: NODE_SIZE,
            height: NODE_SIZE,
            generation: unit.generation,
            isOldestGeneration: unit.generation === 1,
            totalDescendants: countDescendants(spK.id),
            spouses: []
          };
        }
      }

      // Position children of this marriage segment
      if (seg.children.length > 0) {
        let segChildrenTotalW = 0;
        seg.children.forEach((c, i) => {
          segChildrenTotalW += c.subtreeWidth;
          if (i > 0) segChildrenTotalW += HORIZONTAL_GAP;
        });

        let childLeft = segMid - segChildrenTotalW / 2;
        seg.children.forEach(child => {
          positionUnitSubtree(child, childLeft);
          childLeft += child.subtreeWidth + HORIZONTAL_GAP;
        });
      }

      curSegLeft += seg.subtreeWidth + HORIZONTAL_GAP;
    });
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
  unitMap.forEach(unit => {
    const primaryNode = nodes[unit.primaryMember.id];
    if (!primaryNode) return;

    if (unit.spouses.length === 1) {
      // 1 spouse: connect Primary directly to Spouse 0
      const sp0Node = nodes[unit.spouses[0].id];
      if (sp0Node) {
        const isALeft = primaryNode.x < sp0Node.x;
        const leftNode = isALeft ? primaryNode : sp0Node;
        const rightNode = isALeft ? sp0Node : primaryNode;

        const startX = leftNode.x + 36;
        const endX = rightNode.x - 36;
        const lineY = primaryNode.y - 30;

        const spObj = unit.primaryMember.spouses?.find(s => s.spouseId === unit.spouses[0].id);
        const edgeType = spObj?.status === 'divorced' ? 'marriage-divorced' : 'marriage-active';

        edges.push({
          id: `edge-spouse-${unit.primaryMember.id}-${unit.spouses[0].id}`,
          fromId: leftNode.id,
          toId: rightNode.id,
          type: edgeType,
          points: [
            { x: startX, y: lineY },
            { x: endX, y: lineY }
          ],
          midpoint: { x: (startX + endX) / 2, y: lineY }
        });
      }
    } else if (unit.spouses.length >= 2) {
      // 2+ spouses:
      // Node order: [ Spouse 0 (left) <== Primary (center) ==> Spouse 1 (right) ==> Spouse 2 (further right) ... ]
      // Line 0: Spouse 0 <==> Primary
      const sp0Node = nodes[unit.spouses[0].id];
      if (sp0Node) {
        const leftNode = sp0Node.x < primaryNode.x ? sp0Node : primaryNode;
        const rightNode = sp0Node.x < primaryNode.x ? primaryNode : sp0Node;
        const startX = leftNode.x + 36;
        const endX = rightNode.x - 36;
        const lineY = primaryNode.y - 30;

        const spObj = unit.primaryMember.spouses?.find(s => s.spouseId === unit.spouses[0].id);
        const edgeType = spObj?.status === 'divorced' ? 'marriage-divorced' : 'marriage-active';

        edges.push({
          id: `edge-spouse-${unit.primaryMember.id}-${unit.spouses[0].id}`,
          fromId: leftNode.id,
          toId: rightNode.id,
          type: edgeType,
          points: [
            { x: startX, y: lineY },
            { x: endX, y: lineY }
          ],
          midpoint: { x: (startX + endX) / 2, y: lineY }
        });
      }

      // Line 1: Primary <==> Spouse 1
      const sp1Node = nodes[unit.spouses[1].id];
      if (sp1Node) {
        const leftNode = primaryNode.x < sp1Node.x ? primaryNode : sp1Node;
        const rightNode = primaryNode.x < sp1Node.x ? sp1Node : primaryNode;
        const startX = leftNode.x + 36;
        const endX = rightNode.x - 36;
        const lineY = primaryNode.y - 30;

        const spObj = unit.primaryMember.spouses?.find(s => s.spouseId === unit.spouses[1].id);
        const edgeType = spObj?.status === 'divorced' ? 'marriage-divorced' : 'marriage-active';

        edges.push({
          id: `edge-spouse-${unit.primaryMember.id}-${unit.spouses[1].id}`,
          fromId: leftNode.id,
          toId: rightNode.id,
          type: edgeType,
          points: [
            { x: startX, y: lineY },
            { x: endX, y: lineY }
          ],
          midpoint: { x: (startX + endX) / 2, y: lineY }
        });
      }

      // Line k (k >= 2): Direct overhead bridge from Primary to Spouse [k]
      for (let k = 2; k < unit.spouses.length; k++) {
        const currSpNode = nodes[unit.spouses[k].id];
        if (currSpNode) {
          const bridgeY = primaryNode.y - 56 - (k - 2) * 18;
          const startX = primaryNode.x + 15 + (k - 2) * 8;
          const endX = currSpNode.x;

          const spObj = unit.primaryMember.spouses?.find(s => s.spouseId === unit.spouses[k].id);
          const edgeType = spObj?.status === 'divorced' ? 'marriage-divorced' : 'marriage-active';

          edges.push({
            id: `edge-spouse-${unit.primaryMember.id}-${unit.spouses[k].id}`,
            fromId: primaryNode.id,
            toId: currSpNode.id,
            type: edgeType,
            points: [
              { x: startX, y: primaryNode.y - 42 },
              { x: startX, y: bridgeY },
              { x: endX, y: bridgeY },
              { x: endX, y: currSpNode.y - 42 }
            ],
            midpoint: { x: (startX + endX) / 2, y: bridgeY }
          });
        }
      }
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
      // Find if parentNodes belong to a unit with multiple spouses
      const unit0 = unitMap.get(memberToUnitId.get(parentIdList[0]) || '');
      if (unit0 && unit0.spouses.length > 1) {
        // If one of the parents is a subsequent spouse (index >= 1), drop directly from that spouse
        const subSpouse = unit0.spouses.slice(1).find(s => parentIdList.includes(s.id));
        if (subSpouse && nodes[subSpouse.id]) {
          sourceX = nodes[subSpouse.id].x;
          sourceY = nodes[subSpouse.id].y + 40;
        } else {
          // Drop from marriage 0 midpoint (primary & spouse[0])
          const sp0 = unit0.spouses[0];
          if (nodes[unit0.primaryMember.id] && sp0 && nodes[sp0.id]) {
            sourceX = (nodes[unit0.primaryMember.id].x + nodes[sp0.id].x) / 2;
            sourceY = nodes[unit0.primaryMember.id].y - 30;
          } else {
            sourceX = (parentNodes[0].x + parentNodes[1].x) / 2;
            sourceY = parentNodes[0].y - 30;
          }
        }
      } else {
        sourceX = (parentNodes[0].x + parentNodes[1].x) / 2;
        sourceY = parentNodes[0].y - 30;
      }
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
