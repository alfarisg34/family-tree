import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useFamilyData } from './hooks/useFamilyData';
import { usePanZoom } from './hooks/usePanZoom';
import { computeFamilyTreeLayout } from './utils/layoutEngine';
import type { LayoutNode, FamilyMember, ClusterNode } from './types/family';

// Components
import { Navbar } from './components/Navbar';
import { TreeCanvas } from './components/TreeCanvas';
import { Controls } from './components/Controls';
import { Minimap } from './components/Minimap';
import { LegendPanel } from './components/LegendPanel';
import { MemberDetailModal } from './components/MemberDetailModal';
import { MemberFormModal } from './components/MemberFormModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TreeSettingsModal } from './components/TreeSettingsModal';
import { LandingPage } from './components/LandingPage';
import { ChangelogPage } from './components/ChangelogPage';
import { AdminArea } from './components/AdminArea';
import { FamilyExplorer } from './components/FamilyExplorer';
import { FamilyOverview } from './components/FamilyOverview';
import { computeClusteredTree } from './utils/clusterEngine';

// Helper to extract clean slug from URL
function getSlugFromUrl(): string {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return path || 'keluargabanisukandi';
}

export const App: React.FC = () => {
  const [path, setPath] = useState(getSlugFromUrl);

  useEffect(() => {
    const handlePopState = () => setPath(getSlugFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (destination: string, replace = false) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', destination);
    setPath(getSlugFromUrl());
  };

  if (path === 'changelog') return <ChangelogPage />;
  if (['admin', 'admin/login', 'manage'].includes(path)) return <AdminArea path={path} onNavigate={navigate} />;
  return window.location.pathname.replace(/\//g, '') === '' ? <LandingPage /> : <FamilyTreeApp key={path} currentSlug={path} onNavigate={navigate} />;
};

const FamilyTreeApp: React.FC<{ currentSlug: string; onNavigate: (path: string) => void }> = ({ currentSlug, onNavigate }) => {

  // Update browser URL on tree navigation without full page reload
  const handleNavigateToSlug = (newSlug: string) => {
    const clean = newSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'keluargabanisukandi';
    onNavigate('/' + clean);
    setSelectedMemberId(null);
    setHighlightedMemberId(null);
  };

  const {
    familyData,
    allTrees,
    isAdmin,
    isCloudSyncing,
    loginAdmin,
    logoutAdmin,
    saveMember,
    addRelative,
    deleteMember,
    updateTreeMetadata
  } = useFamilyData(currentSlug);

  // Compute graph layout
  const layout = useMemo(() => {
    return computeFamilyTreeLayout(familyData);
  }, [familyData]);

  const viewBounds = useMemo(() => {
    const members = Object.values(layout.nodes);
    if (!members.length) return layout.bounds;
    return {
      minX: Math.min(...members.map(node => node.x)) - 150,
      maxX: Math.max(...members.map(node => node.x)) + 150,
      minY: Math.min(...members.map(node => node.y)) - 140,
      maxY: Math.max(...members.map(node => node.y)) + 140,
    };
  }, [layout]);

  // Pan & Zoom Map Engine with Marker Clustering & Progressive Disclosure
  const {
    viewport,
    minScale,
    maxScale,
    setViewport,
    lodLevel,
    isMobile,
    containerSize,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    flyToNode,
    zoomToCluster,
    bindContainerEvents
  } = usePanZoom({
    bounds: viewBounds,
    initialScale: 0.85
  });

  const [showOverview, setShowOverview] = useState(false);
  const [focusedBranch, setFocusedBranch] = useState<ClusterNode | null>(null);
  const [showBranchSummary, setShowBranchSummary] = useState(false);
  const previousView = useRef<{ viewport: typeof viewport; overview: boolean; scroll: number } | null>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const overviewScroll = useRef(0);
  // Derive the complete overview independently from the current map viewport/culling.
  const overviewEntities = useMemo(() => {
    const scale = 0.25;
    return computeClusteredTree({ nodes: layout.nodes, edges: layout.edges,
      viewport: { x: -layout.bounds.minX * scale + 200, y: -layout.bounds.minY * scale + 200, scale },
      containerWidth: layout.bounds.width * scale + 400,
      containerHeight: layout.bounds.height * scale + 400 });
  }, [layout]);
  const mapLayout = useMemo(() => {
    if (focusedBranch || Object.keys(layout.nodes).length <= 12 || viewport.scale >= 0.85) return layout;
    return computeFamilyTreeLayout(familyData, { scale: viewport.scale });
  }, [familyData, layout, focusedBranch, viewport.scale]);
  const activeLayout = useMemo(() => {
    if (!focusedBranch) return mapLayout;
    const ids = new Set(focusedBranch.memberNodes.map(node => node.id));
    const scopedNodes = Object.fromEntries(Object.entries(layout.nodes).filter(([id]) => ids.has(id)));
    const generationLevels = layout.generationLevels.flatMap(level => {
      const members = Object.values(scopedNodes).filter(node => node.generation === level.generation);
      if (!members.length) return [];
      const minX = Math.min(...members.map(node => node.x)) - 500;
      const maxX = Math.max(...members.map(node => node.x)) + 60;
      return [{ ...level, count: members.length, minX, maxX, centerX: (minX + maxX) / 2 }];
    });
    return { ...layout, nodes: scopedNodes,
      edges: layout.edges.filter(edge => ids.has(edge.fromId) && ids.has(edge.toId)), generationLevels };
  }, [layout, mapLayout, focusedBranch]);
  const isSummary = showOverview || showBranchSummary;
  const pendingMapFit = useRef(true);
  const initialMapPositioned = useRef(false);

  // Both entry points open at the same readable scale; fitting everything is explicit.
  useLayoutEffect(() => {
    if (isSummary || !pendingMapFit.current) return;
    pendingMapFit.current = false;
    resetView(focusedBranch?.bounds || viewBounds);
  }, [isSummary, focusedBranch, resetView, viewBounds]);

  const returnToOverview = useCallback(() => {
    pendingMapFit.current = false;
    setFocusedBranch(null);
    setShowBranchSummary(false);
    setShowOverview(true);
    if (previousView.current) {
      setViewport(previousView.current.viewport);
      overviewScroll.current = previousView.current.scroll;
    }
  }, [setViewport]);
  const returnToPreviousView = () => {
    pendingMapFit.current = false;
    if (previousView.current && !previousView.current.overview) {
      setViewport(previousView.current.viewport);
      setFocusedBranch(null);
      setShowBranchSummary(false);
      setShowOverview(false);
    } else returnToOverview();
  };
  useEffect(() => {
    const scroller = overviewRef.current?.querySelector('.family-overview');
    if (scroller) scroller.scrollTop = showOverview ? overviewScroll.current : 0;
  }, [showOverview, showBranchSummary, focusedBranch?.id]);

  // Modal & Selection States
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);
  
  // Admin Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formSourceNodeId, setFormSourceNodeId] = useState<string | undefined>(undefined);
  const [formRelationDirection, setFormRelationDirection] = useState<'parent' | 'child' | 'spouse' | 'sibling' | undefined>(undefined);

  // Admin Login Modal State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isTreeSettingsOpen, setIsTreeSettingsOpen] = useState(false);

  // Keyboard Shortcuts (F to fit, Esc to deselect, + / - to zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input, textarea, select, button, dialog, [contenteditable="true"]') || document.querySelector('dialog[open], .modal-backdrop')) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        returnToOverview();
      } else if (e.key === 'Escape') {
        setSelectedMemberId(null);
        setHighlightedMemberId(null);
      } else if (e.key === '+' || e.key === '=') {
        if (isSummary) { setShowOverview(false); setShowBranchSummary(false); }
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0') {
        resetView(focusedBranch?.bounds);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returnToOverview, resetView, zoomIn, zoomOut, isSummary, focusedBranch]);

  // Centre the default map once the initial cloud data has finished loading.
  useEffect(() => {
    if (initialMapPositioned.current || isCloudSyncing || isSummary || focusedBranch) return;
    const timer = setTimeout(() => {
      resetView(viewBounds);
      initialMapPositioned.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, [isCloudSyncing, isSummary, focusedBranch, resetView, viewBounds]);

  // Handle clicking a node on the tree
  const handleNodeClick = (node: LayoutNode) => {
    setSelectedMemberId(node.id);
  };

  // Fly to a member from search or relationship chip
  const handleFlyToMember = (memberId: string) => {
    const node = layout.nodes[memberId];
    if (node) {
      pendingMapFit.current = false;
      setFocusedBranch(null);
      setShowOverview(false);
      setShowBranchSummary(false);
      flyToNode(node.x, node.y, 1.15);
      setHighlightedMemberId(memberId);
      
      setTimeout(() => {
        setHighlightedMemberId((prev) => (prev === memberId ? null : prev));
      }, 3500);
    }
  };

  // Select a member in modal directly
  const handleSelectMemberInModal = (memberId: string) => {
    setSelectedMemberId(memberId);
    handleFlyToMember(memberId);
  };

  // Quick Add Relative from node (Admin)
  const handleQuickAdd = (
    sourceNode: LayoutNode,
    direction: 'parent' | 'child' | 'spouse' | 'sibling'
  ) => {
    setEditingMember(null);
    setFormSourceNodeId(sourceNode.id);
    setFormRelationDirection(direction);
    setIsFormOpen(true);
  };

  // Open Form for Brand New Member (from Navbar)
  const handleOpenAddMemberNavbar = () => {
    setEditingMember(null);
    setFormSourceNodeId(undefined);
    setFormRelationDirection(undefined);
    setIsFormOpen(true);
  };

  // Edit an existing member
  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFormSourceNodeId(undefined);
    setFormRelationDirection(undefined);
    setIsFormOpen(true);
  };

  // Save member from Form (with optional children re-ordering)
  const handleSaveMemberForm = (member: FamilyMember, reorderedChildren?: FamilyMember[]) => {
    if (formSourceNodeId && formRelationDirection) {
      addRelative(formSourceNodeId, formRelationDirection, member);
    } else {
      saveMember(member);
    }

    if (reorderedChildren && reorderedChildren.length > 0) {
      reorderedChildren.forEach((child, index) => {
        saveMember({
          ...child,
          order: index + 1
        });
      });
    }
  };

  // Progressive disclosure click on cluster
  const handleClusterClick = (cluster: ClusterNode) => {
    pendingMapFit.current = true;
    const scroller = overviewRef.current?.querySelector('.family-overview');
    previousView.current = { viewport: { ...viewport }, overview: showOverview, scroll: scroller?.scrollTop || 0 };
    overviewScroll.current = scroller?.scrollTop || 0;
    // The compact map uses different positions; fit the expanded family in its full layout.
    const memberNodes = cluster.memberNodes.map(node => layout.nodes[node.id]);
    const minX = Math.min(...memberNodes.map(node => node.x - node.width / 2));
    const maxX = Math.max(...memberNodes.map(node => node.x + node.width / 2));
    const minY = Math.min(...memberNodes.map(node => node.y - node.height / 2));
    const maxY = Math.max(...memberNodes.map(node => node.y + node.height / 2));
    setFocusedBranch({ ...cluster, memberNodes, leaderNode: layout.nodes[cluster.leaderNode.id],
      bounds: { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY } });
    setShowOverview(false);
    setShowBranchSummary(isMobile);
  };

  const selectedMember = selectedMemberId ? familyData.members[selectedMemberId] : null;

  return (
    <div className={`app-container ${isSummary ? '' : 'has-map'}`}>
      {/* 1. Header Navbar */}
      <Navbar
        familyData={familyData}
        currentSlug={currentSlug}
        allTrees={allTrees}
        isAdmin={isAdmin}
        isCloudSyncing={isCloudSyncing}
        onNavigateToSlug={handleNavigateToSlug}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={logoutAdmin}
        onOpenAddMember={handleOpenAddMemberNavbar}
        onOpenTreeSettings={() => setIsTreeSettingsOpen(true)}
        onFlyToMember={handleFlyToMember}
      />
      <FamilyExplorer familyData={familyData} loading={isCloudSyncing} onFit={returnToOverview} onSelectMember={handleSelectMemberInModal} />

      {/* 2. Map Canvas (Drag & Pinch Zoomable Container) */}
      <main
        className={`map-canvas-container ${isDragging ? 'is-dragging' : ''}`}
        ref={containerRef}
        style={isSummary ? { touchAction: 'pan-y', bottom: 0 } : undefined}
        {...(isSummary ? {} : bindContainerEvents)}
        aria-label="Peta silsilah keluarga interaktif"
      >
        {isSummary ? <div ref={overviewRef} className="overview-host"><FamilyOverview
          branches={overviewEntities.visibleClusters}
          individuals={overviewEntities.visibleNodes}
          branch={showBranchSummary ? focusedBranch : null}
          onOpenBranch={handleClusterClick}
          onSelectMember={(id) => setSelectedMemberId(id)}
          onBack={returnToOverview}
          onOpenMap={() => {
            pendingMapFit.current = true;
            if (showOverview) previousView.current = { viewport: { ...viewport }, overview: true, scroll: overviewRef.current?.querySelector('.family-overview')?.scrollTop || 0 };
            setShowOverview(false); setShowBranchSummary(false);
          }}
        /></div> : <>
        <nav className="map-context" aria-label="Lokasi dalam silsilah">
          <div className="map-context-path"><button onClick={focusedBranch ? returnToPreviousView : returnToOverview} aria-label={focusedBranch && previousView.current && !previousView.current.overview ? 'Kembali ke peta sebelumnya' : 'Kembali ke overview'}><ArrowLeft size={16} />{focusedBranch && previousView.current && !previousView.current.overview ? 'Kembali' : 'Keluarga besar'}</button><ChevronRight size={14} /><strong>{focusedBranch?.label || 'Peta seluruh keluarga'}</strong></div>
          {focusedBranch && <button onClick={() => setShowBranchSummary(true)}>Ringkasan keluarga</button>}
        </nav>
        <TreeCanvas
          layout={activeLayout}
          expandAll={!!focusedBranch}
          viewport={viewport}
          lodLevel={lodLevel}
          rootGenerationType={familyData.rootGenerationType}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          isMobile={isMobile}
          selectedNodeId={selectedMemberId}
          highlightedNodeId={highlightedMemberId}
          isAdmin={isAdmin}
          onNodeClick={handleNodeClick}
          onClusterClick={handleClusterClick}
          onQuickAdd={handleQuickAdd}
        />
        </>}
      </main>

      {/* 3. Floating Map Controls (Zoom / Fit / Reset) */}
      {!isSummary && <Controls
        scale={viewport.scale}
        lodLevel={focusedBranch || Object.keys(layout.nodes).length <= 12 ? 'micro' : lodLevel}
        minScale={minScale}
        maxScale={maxScale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={() => resetView(focusedBranch?.bounds)}
        onFit={() => focusedBranch ? zoomToCluster(focusedBranch.bounds) : fitView(viewBounds)}
        onOverview={returnToOverview}
      />}

      {/* 4. Minimap Radar View */}
      {!isSummary && <Minimap
        layout={activeLayout}
        viewport={viewport}
        containerSize={containerSize}
        onNavigate={(targetWorldX, targetWorldY) => {
          flyToNode(targetWorldX, targetWorldY, viewport.scale);
        }}
      />}

      {/* 5. Map Legend Guide */}
      {!isSummary && <LegendPanel />}

      {/* 6. Modals */}
      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          familyData={familyData}
          isAdmin={isAdmin}
          onClose={() => setSelectedMemberId(null)}
          onSelectMember={handleSelectMemberInModal}
          onEditMember={handleEditMember}
          onDeleteMember={deleteMember}
        />
      )}

      {/* Member Form Modal (Admin Add/Edit) */}
      {isFormOpen && (
        <MemberFormModal
          initialMember={editingMember}
          familyData={familyData}
          sourceNodeIdForRelation={formSourceNodeId}
          relationDirection={formRelationDirection}
          onSave={handleSaveMemberForm}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMember(null);
            setFormSourceNodeId(undefined);
            setFormRelationDirection(undefined);
          }}
        />
      )}

      {/* Admin Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          onLogin={loginAdmin}
          onClose={() => setIsAdminLoginOpen(false)}
        />
      )}

      {/* Tree Settings Modal (Admin) */}
      {isTreeSettingsOpen && (
        <TreeSettingsModal
          isOpen={isTreeSettingsOpen}
          familyData={familyData}
          onSave={updateTreeMetadata}
          onClose={() => setIsTreeSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
