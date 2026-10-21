import type { LayoutNode, LayoutEdge, ClusterNode, ViewportState, ZoomTier } from '../types/family';

export interface ClusterEngineResult {
  visibleClusters: ClusterNode[];
  visibleNodes: LayoutNode[];
  visibleEdges: LayoutEdge[];
  zoomTier: ZoomTier;
  totalVisibleCount: number;
}

export interface ClusterEngineOptions {
  nodes: Record<string, LayoutNode>;
  edges: LayoutEdge[];
  viewport: ViewportState;
  containerWidth: number;
  containerHeight: number;
  isMobile?: boolean;
}

/**
 * Determine active zoom tier based on viewport scale
 */
export function getZoomTier(scale: number): ZoomTier {
  if (scale < 0.50) return 'macro';
  if (scale < 0.85) return 'medium';
  return 'micro';
}

/**
 * Compute the world-space bounding box for the visible screen viewport with buffer margin
 */
export function getViewportWorldBounds(
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number,
  bufferPx = 300
) {
  const w = containerWidth > 0 ? containerWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const h = containerHeight > 0 ? containerHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);

  return {
    minX: (-viewport.x - bufferPx) / viewport.scale,
    maxX: (-viewport.x + w + bufferPx) / viewport.scale,
    minY: (-viewport.y - bufferPx) / viewport.scale,
    maxY: (-viewport.y + h + bufferPx) / viewport.scale,
  };
}

/**
 * Check if a rectangular box overlaps with viewport world bounds
 */
export function isBoxInViewport(
  box: { minX: number; maxX: number; minY: number; maxY: number },
  vpBounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  return !(
    box.maxX < vpBounds.minX ||
    box.minX > vpBounds.maxX ||
    box.maxY < vpBounds.minY ||
    box.minY > vpBounds.maxY
  );
}

/**
 * Helper to build genealogical ancestry and branch relationships
 */
function buildFamilyLineageTree(allNodes: LayoutNode[]) {
  const nodeById = new Map<string, LayoutNode>();
  const childrenMap = new Map<string, string[]>();
  const spouseMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  allNodes.forEach(node => {
    nodeById.set(node.id, node);
    childrenMap.set(node.id, []);
    spouseMap.set(node.id, []);
    parentMap.set(node.id, node.member.parentIds || []);
  });

  allNodes.forEach(node => {
    // Register children
    if (node.member.parentIds && node.member.parentIds.length > 0) {
      node.member.parentIds.forEach(pId => {
        if (childrenMap.has(pId)) {
          childrenMap.get(pId)!.push(node.id);
        }
      });
    }

    // Register spouses
    if (node.member.spouses && node.member.spouses.length > 0) {
      node.member.spouses.forEach(sp => {
        if (spouseMap.has(node.id) && !spouseMap.get(node.id)!.includes(sp.spouseId)) {
          spouseMap.get(node.id)!.push(sp.spouseId);
        }
        if (spouseMap.has(sp.spouseId) && !spouseMap.get(sp.spouseId)!.includes(node.id)) {
          spouseMap.get(sp.spouseId)!.push(node.id);
        }
      });
    }
  });

  // Recursively collect all descendants & their spouses for a given branch root
  const getBranchMembers = (rootId: string, assignedIds: Set<string>): LayoutNode[] => {
    const branchNodes: LayoutNode[] = [];
    const queue: string[] = [rootId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodeById.get(currentId);
      if (node && !assignedIds.has(node.id)) {
        branchNodes.push(node);
        assignedIds.add(node.id);

        // Include the spouse and children linked only to that spouse in the same family.
        const familyParentIds = [currentId];
        const spouses = spouseMap.get(currentId) || [];
        spouses.forEach(sId => {
          const spNode = nodeById.get(sId);
          if (spNode && !assignedIds.has(spNode.id) && (!spNode.member.parentIds || spNode.member.parentIds.length === 0)) {
            branchNodes.push(spNode);
            assignedIds.add(spNode.id);
            familyParentIds.push(spNode.id);
          }
        });

        // Add children to queue
        familyParentIds.forEach(parentId => {
          (childrenMap.get(parentId) || []).forEach(cId => {
            if (!visited.has(cId)) queue.push(cId);
          });
        });
      }
    }

    return branchNodes;
  };

  return {
    nodeById,
    childrenMap,
    spouseMap,
    parentMap,
    getBranchMembers
  };
}

/**
 * Main Clustering and Spatial Culling Engine
 * - Lineage-aware family clustering (groups branches according to true genealogical lineage)
 * - Dynamic zoom tiers (Macro: major branch clusters, Medium: sub-branch clusters, Micro: full reveal)
 * - Viewport spatial distance culling for 60fps performance
 * - Lineage-aware clean edge routing connecting parent leaders/clusters to descendant clusters
 */
export function computeClusteredTree({
  nodes,
  edges,
  viewport,
  containerWidth,
  containerHeight
}: ClusterEngineOptions): ClusterEngineResult {
  const allNodes = Object.values(nodes);
  if (allNodes.length === 0) {
    return {
      visibleClusters: [],
      visibleNodes: [],
      visibleEdges: [],
      zoomTier: 'micro',
      totalVisibleCount: 0
    };
  }

  const zoomTier = getZoomTier(viewport.scale);
  const vpBounds = getViewportWorldBounds(viewport, containerWidth, containerHeight);

  const { getBranchMembers, childrenMap, spouseMap } = buildFamilyLineageTree(allNodes);

  const clusters: ClusterNode[] = [];
  const individualNodes: LayoutNode[] = [];
  const nodeToClusterId = new Map<string, string>();
  const assignedNodeIds = new Set<string>();

  // Helper to create a cluster object from a group of family members
  const createCluster = (leader: LayoutNode, group: LayoutNode[]) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minGen = Infinity;
    let maxGen = -Infinity;

    group.forEach(n => {
      minX = Math.min(minX, n.x - n.width / 2);
      maxX = Math.max(maxX, n.x + n.width / 2);
      minY = Math.min(minY, n.y - n.height / 2);
      maxY = Math.max(maxY, n.y + n.height / 2);
      minGen = Math.min(minGen, n.generation);
      maxGen = Math.max(maxGen, n.generation);
    });

    const clusterId = `cluster-${leader.id}`;
    group.forEach(n => nodeToClusterId.set(n.id, clusterId));

    const leaderName = leader.member.nickname || leader.member.fullName.split(' ')[0];
    const label = `Keluarga ${leaderName}`;

    clusters.push({
      id: clusterId,
      leaderNode: leader,
      memberNodes: group,
      count: group.length,
      x: leader.x,
      y: leader.y,
      generation: leader.generation,
      bounds: {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      },
      generationSpread: {
        minGen,
        maxGen
      },
      label
    });
  };

  if (zoomTier === 'macro') {
    // =========================================================================
    // MACRO TIER (< 0.50x Zoom Out):
    // Lineage-based Major Branch Clustering:
    // - Gen 1 (Leluhur) remains an individual node at the top.
    // - Each Gen 2 child (Branch Ancestor) collapses with ALL their descendants & spouses
    //   into a distinct Family Branch Cluster (e.g. "Keluarga Hj. Maskanah", "Keluarga Hj. Diah").
    // - Lineage lines clearly connect Gen 1 -> each Gen 2 Branch Cluster.
    // =========================================================================
    const sortedNodes = [...allNodes].sort((a, b) => a.generation - b.generation || a.x - b.x);
    const gen1Nodes = sortedNodes.filter(n => n.generation === 1);

    // Keep Gen 1 ancestors visible as individual leader nodes
    gen1Nodes.forEach(g1 => {
      individualNodes.push(g1);
      assignedNodeIds.add(g1.id);
    });

    // Group each Gen 2+ lineage branch
    const gen2Candidates = sortedNodes.filter(n => n.generation === 2);

    gen2Candidates.forEach(gen2Node => {
      if (assignedNodeIds.has(gen2Node.id)) return;

      const branchMembers = getBranchMembers(gen2Node.id, assignedNodeIds);
      if (branchMembers.length > 1) {
        createCluster(gen2Node, branchMembers);
      } else if (branchMembers.length === 1) {
        individualNodes.push(branchMembers[0]);
      }
    });

    // Any remaining unassigned lower-generation branches
    sortedNodes.forEach(node => {
      if (assignedNodeIds.has(node.id)) return;
      const branchMembers = getBranchMembers(node.id, assignedNodeIds);
      if (branchMembers.length > 1) {
        createCluster(node, branchMembers);
      } else if (branchMembers.length === 1) {
        individualNodes.push(branchMembers[0]);
      }
    });

  } else if (zoomTier === 'medium') {
    // =========================================================================
    // MEDIUM TIER (0.50x - 0.85x Zoom):
    // Sub-Branch Family Unit Clustering:
    // - Gen 1 & Gen 2 are fully expanded as individual nodes.
    // - Gen 3+ or Gen 4+ family units with children collapse their sub-branches into
    //   compact family unit clusters (e.g. "Keluarga Diyan Hikmayati +2 Anak").
    // =========================================================================
    const sortedNodes = [...allNodes].sort((a, b) => a.generation - b.generation || a.x - b.x);

    // Keep Gen 1 and Gen 2 visible as individual cards
    sortedNodes.filter(n => n.generation <= 2).forEach(node => {
      individualNodes.push(node);
      assignedNodeIds.add(node.id);
    });

    // For Gen 3+, if they have children, group their immediate children & descendants
    const gen3AndBelow = sortedNodes.filter(n => n.generation >= 3);

    gen3AndBelow.forEach(node => {
      if (assignedNodeIds.has(node.id)) return;

      // If this node has descendants, cluster this sub-branch
      const hasFamilyChildren = (childrenMap.get(node.id)?.length || 0) > 0
        || (spouseMap.get(node.id) || []).some(id => (childrenMap.get(id)?.length || 0) > 0);
      if (hasFamilyChildren) {
        const branchMembers = getBranchMembers(node.id, assignedNodeIds);
        if (branchMembers.length > 1) {
          createCluster(node, branchMembers);
        } else if (branchMembers.length === 1) {
          individualNodes.push(branchMembers[0]);
        }
      } else {
        individualNodes.push(node);
        assignedNodeIds.add(node.id);
      }
    });

  } else {
    // =========================================================================
    // MICRO TIER (>= 0.85x Zoom In):
    // Progressive Disclosure Full Reveal: Zero clustering, 100% individual cards.
    // =========================================================================
    individualNodes.push(...allNodes);
  }

  // 3. Viewport Distance Culling (Spatial Virtualization)
  const visibleNodes = individualNodes.filter(node => {
    const box = {
      minX: node.x - node.width / 2 - 40,
      maxX: node.x + node.width / 2 + 40,
      minY: node.y - node.height / 2 - 40,
      maxY: node.y + node.height / 2 + 40
    };
    return isBoxInViewport(box, vpBounds);
  });

  const visibleClusters = clusters.filter(cluster => {
    const box = {
      minX: cluster.x - 140,
      maxX: cluster.x + 140,
      minY: cluster.y - 140,
      maxY: cluster.y + 140
    };
    return isBoxInViewport(box, vpBounds);
  });

  // Map for fast position lookups of visible entities (either node or cluster)
  const entityPositionMap = new Map<string, { x: number; y: number; isCluster: boolean }>();

  visibleNodes.forEach(node => {
    entityPositionMap.set(node.id, { x: node.x, y: node.y, isCluster: false });
  });

  visibleClusters.forEach(cluster => {
    // All members in this cluster map to the cluster's coordinate
    cluster.memberNodes.forEach(m => {
      entityPositionMap.set(m.id, { x: cluster.x, y: cluster.y, isCluster: true });
    });
  });

  // 4. Lineage-Aware Edge Generation & Resolution
  const visibleEdges: LayoutEdge[] = [];
  const addedEdgeKeys = new Set<string>();

  edges.forEach(edge => {
    const fromClusterId = nodeToClusterId.get(edge.fromId);
    const toClusterId = nodeToClusterId.get(edge.toId);

    // If both source and target are inside the exact same cluster, suppress internal edge
    if (fromClusterId && toClusterId && fromClusterId === toClusterId) {
      return;
    }

    const fromPos = entityPositionMap.get(edge.fromId);
    const toPos = entityPositionMap.get(edge.toId);

    // Both endpoints must resolve to visible entities on screen
    if (!fromPos || !toPos) return;

    // Edge key to prevent duplicate visual lines between the same entities
    const edgeKey = `${fromClusterId || edge.fromId}===>${toClusterId || edge.toId}`;
    if (addedEdgeKeys.has(edgeKey)) return;
    addedEdgeKeys.add(edgeKey);

    // Determine clean connection points:
    // Case 1: Marriage Line between two individual spouse nodes
    if (edge.type === 'marriage-active' || edge.type === 'marriage-divorced') {
      if (!fromPos.isCluster && !toPos.isCluster) {
        // Standard horizontal marriage line
        const leftX = Math.min(fromPos.x, toPos.x) + 36;
        const rightX = Math.max(fromPos.x, toPos.x) - 36;
        const lineY = fromPos.y - 30;

        visibleEdges.push({
          id: `edge-marriage-${edge.fromId}-${edge.toId}`,
          fromId: edge.fromId,
          toId: edge.toId,
          type: edge.type,
          points: [
            { x: leftX, y: lineY },
            { x: rightX, y: lineY }
          ],
          midpoint: { x: (leftX + rightX) / 2, y: lineY }
        });
      }
      return;
    }

    // Case 2: Parent-to-Child Lineage Line:
    // Determine whether the child has BOTH parents or a SINGLE parent
    const childNode = nodes[edge.toId];
    const childParentIds = childNode?.member?.parentIds || [edge.fromId];
    const childParentNodes = childParentIds.map(pId => nodes[pId]).filter(Boolean);

    let sourceX: number;
    let sourceY: number;

    if (childParentNodes.length >= 2) {
      // Child has BOTH parents (Father & Mother)
      const p0Cluster = nodeToClusterId.get(childParentNodes[0].id);
      const p1Cluster = nodeToClusterId.get(childParentNodes[1].id);

      if (p0Cluster && p1Cluster && p0Cluster === p1Cluster) {
        // Both parents collapsed in the same cluster
        const pClust = entityPositionMap.get(childParentNodes[0].id)!;
        sourceX = pClust.x;
        sourceY = pClust.y + 45;
      } else if (!p0Cluster && !p1Cluster) {
        // Both parents are visible individual cards:
        // Source drops EXACTLY from the middle of the marriage line between them!
        sourceX = (childParentNodes[0].x + childParentNodes[1].x) / 2;
        sourceY = childParentNodes[0].y - 30; // Level with marriage line and ring icon
      } else {
        // One parent is clustered or fallback
        sourceX = fromPos.isCluster ? fromPos.x : fromPos.x;
        sourceY = fromPos.isCluster ? fromPos.y + 45 : fromPos.y - 30;
      }
    } else if (childParentNodes.length === 1) {
      // Child has ONLY ONE parent (Single Father or Single Mother)
      const singleParent = childParentNodes[0];
      const pCluster = nodeToClusterId.get(singleParent.id);

      if (pCluster) {
        const pClust = entityPositionMap.get(singleParent.id)!;
        sourceX = pClust.x;
        sourceY = pClust.y + 45;
      } else {
        // Drops DIRECTLY from under this single parent's avatar
        sourceX = singleParent.x;
        sourceY = singleParent.y + 40;
      }
    } else {
      sourceX = fromPos.x;
      sourceY = fromPos.isCluster ? fromPos.y + 45 : fromPos.y + 40;
    }

    // Target point (Child node or Child cluster)
    const targetX = toPos.x;
    const targetY = toPos.isCluster ? toPos.y - 50 : toPos.y - 75;

    // Horizontal bus line in clear gap between generations
    const busLineY = childParentNodes[0] 
      ? childParentNodes[0].y + 125 
      : sourceY + Math.max(25, (targetY - sourceY) / 2);

    // 4-Point Orthogonal Route:
    // Drop from marriage midpoint (or single parent bottom) -> down to bus -> across to child -> down to child avatar top
    const points = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: busLineY },
      { x: targetX, y: busLineY },
      { x: targetX, y: targetY }
    ];

    visibleEdges.push({
      id: `edge-lineage-${edgeKey}`,
      fromId: edge.fromId,
      toId: edge.toId,
      type: edge.type,
      points
    });
  });

  return {
    visibleClusters,
    visibleNodes,
    visibleEdges,
    zoomTier,
    totalVisibleCount: visibleNodes.length + visibleClusters.reduce((acc, c) => acc + c.count, 0)
  };
}
