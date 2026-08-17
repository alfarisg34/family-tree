import type { FamilyData, FamilyMember, LayoutNode, LayoutEdge, TreeLayout, EdgeType } from '../types/family';
import { getGenerationLabel } from './dateUtils';

const NODE_SIZE = 110;
const HORIZONTAL_GAP = 70;
const SPOUSE_GAP = 50;
const VERTICAL_LEVEL_GAP = 240;

/**
 * Calculates a clean hierarchical layout for the family tree
 */
export function computeFamilyTreeLayout(data: FamilyData): TreeLayout {
  const members = data.members;
  const memberList = Object.values(members);

  if (memberList.length === 0) {
    return {
      nodes: {},
      edges: [],
      bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 },
      generationLevels: []
    };
  }

  // 1. Group members by generation (1, 2, 3, 4, ...)
  const generationsMap = new Map<number, FamilyMember[]>();
  let minGen = Infinity;
  let maxGen = -Infinity;

  memberList.forEach(m => {
    const gen = m.generation || 1;
    minGen = Math.min(minGen, gen);
    maxGen = Math.max(maxGen, gen);
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
  const generationLevels: { generation: number; name: string; y: number; count: number }[] = [];

  sortedGenerations.forEach((gen, idx) => {
    const yPos = 120 + idx * VERTICAL_LEVEL_GAP;
    generationYMap.set(gen, yPos);
    generationLevels.push({
      generation: gen,
      name: getGenerationLabel(gen),
      y: yPos,
      count: generationsMap.get(gen)?.length || 0
    });
  });

  sortedGenerations.forEach(gen => {
    const genMembers = generationsMap.get(gen) || [];
    const y = generationYMap.get(gen) || 120;
    
    const placedInGen = new Set<string>();
    const units: FamilyMember[][] = [];

    genMembers.forEach(member => {
      if (placedInGen.has(member.id)) return;

      const unit: FamilyMember[] = [member];
      placedInGen.add(member.id);

      if (member.spouses && member.spouses.length > 0) {
        member.spouses.forEach(sp => {
          const spouseObj = members[sp.spouseId];
          if (spouseObj && !placedInGen.has(spouseObj.id)) {
            unit.push(spouseObj);
            placedInGen.add(spouseObj.id);
          }
        });
      }

      units.push(unit);
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
          isOldestGeneration: gen === minGen,
          totalDescendants: totalDesc,
          spouses: []
        };
      });

      currentX += unitWidths[uIdx] + HORIZONTAL_GAP;
    });
  });

  // 3. Connect Layout Edges
  memberList.forEach(m => {
    const nodeA = nodes[m.id];
    if (!nodeA || !m.spouses) return;

    m.spouses.forEach(sp => {
      const nodeB = nodes[sp.spouseId];
      if (!nodeB) return;

      const pairKey = [m.id, sp.spouseId].sort().join('::');
      if (processedSpousePairs.has(pairKey)) return;
      processedSpousePairs.add(pairKey);

      const edgeType: EdgeType = sp.status === 'divorced' || sp.status === 'separated' 
        ? 'marriage-divorced' 
        : 'marriage-active';

      const startX = Math.min(nodeA.x, nodeB.x) + NODE_SIZE / 2;
      const endX = Math.max(nodeA.x, nodeB.x) - NODE_SIZE / 2;
      const midY = nodeA.y;
      const midX = (nodeA.x + nodeB.x) / 2;

      edges.push({
        id: `marriage-${pairKey}`,
        fromId: m.id,
        toId: sp.spouseId,
        type: edgeType,
        points: [
          { x: startX, y: midY },
          { x: endX, y: midY }
        ],
        label: sp.status === 'divorced' ? 'Bercerai' : 'Menikah',
        midpoint: { x: midX, y: midY }
      });
    });
  });

  // Parent-Child Edges
  const parentPairsToChildren = new Map<string, FamilyMember[]>();
  
  memberList.forEach(m => {
    if (m.parentIds && m.parentIds.length > 0) {
      const parentKey = [...m.parentIds].sort().join('::');
      if (!parentPairsToChildren.has(parentKey)) {
        parentPairsToChildren.set(parentKey, []);
      }
      parentPairsToChildren.get(parentKey)!.push(m);
    }
  });

  parentPairsToChildren.forEach((children, parentKey) => {
    const pIds = parentKey.split('::');
    let originX = 0;
    let originY = 0;

    if (pIds.length >= 2 && nodes[pIds[0]] && nodes[pIds[1]]) {
      originX = (nodes[pIds[0]].x + nodes[pIds[1]].x) / 2;
      originY = (nodes[pIds[0]].y + nodes[pIds[1]].y) / 2;
    } else if (pIds.length === 1 && nodes[pIds[0]]) {
      originX = nodes[pIds[0]].x;
      originY = nodes[pIds[0]].y + NODE_SIZE / 2;
    } else {
      return;
    }

    const midDropY = originY + (VERTICAL_LEVEL_GAP - NODE_SIZE) / 2;

    children.forEach(child => {
      const childNode = nodes[child.id];
      if (!childNode) return;

      const targetX = childNode.x;
      const targetY = childNode.y - NODE_SIZE / 2;

      const edgeType: EdgeType = child.relationshipToParents === 'adopted' || child.relationshipToParents === 'foster'
        ? 'parent-child-adopted'
        : 'parent-child-bio';

      const points = [
        { x: originX, y: originY },
        { x: originX, y: midDropY },
        { x: targetX, y: midDropY },
        { x: targetX, y: targetY }
      ];

      edges.push({
        id: `parent-child-${parentKey}-${child.id}`,
        fromId: pIds[0],
        toId: child.id,
        type: edgeType,
        points,
        label: child.relationshipToParents === 'adopted' ? 'Anak Angkat' : undefined,
        midpoint: { x: targetX, y: midDropY }
      });
    });
  });

  // Calculate bounding box
  const allNodes = Object.values(nodes);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  if (allNodes.length > 0) {
    allNodes.forEach(n => {
      minX = Math.min(minX, n.x - NODE_SIZE);
      maxX = Math.max(maxX, n.x + NODE_SIZE);
      minY = Math.min(minY, n.y - NODE_SIZE);
      maxY = Math.max(maxY, n.y + NODE_SIZE);
    });
  } else {
    minX = 0;
    maxX = 800;
    minY = 0;
    maxY = 600;
  }

  const margin = 200;
  minX -= margin;
  maxX += margin;
  minY -= margin;
  maxY += margin;

  return {
    nodes,
    edges,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(1200, maxX - minX),
      height: Math.max(800, maxY - minY)
    },
    generationLevels
  };
}
