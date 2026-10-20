import React, { useState, useMemo, useEffect } from 'react';
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
import { AdminArea } from './components/AdminArea';
import { FamilyExplorer } from './components/FamilyExplorer';

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
        fitView(viewBounds);
      } else if (e.key === 'Escape') {
        setSelectedMemberId(null);
        setHighlightedMemberId(null);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0') {
        resetView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView, resetView, zoomIn, zoomOut, viewBounds]);

  // Auto-fit on slug switch or first load
  useEffect(() => {
    if (isCloudSyncing) return;
    const timer = setTimeout(() => {
      fitView(viewBounds);
    }, 200);
    return () => clearTimeout(timer);
  }, [currentSlug, isCloudSyncing, fitView, viewBounds]);

  // Handle clicking a node on the tree
  const handleNodeClick = (node: LayoutNode) => {
    setSelectedMemberId(node.id);
  };

  // Fly to a member from search or relationship chip
  const handleFlyToMember = (memberId: string) => {
    const node = layout.nodes[memberId];
    if (node) {
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
    zoomToCluster(cluster.bounds, 1.15);
  };

  const selectedMember = selectedMemberId ? familyData.members[selectedMemberId] : null;

  return (
    <div className="app-container">
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
      <FamilyExplorer familyData={familyData} loading={isCloudSyncing} onFit={() => fitView(viewBounds)} onSelectMember={handleSelectMemberInModal} />

      {/* 2. Map Canvas (Drag & Pinch Zoomable Container) */}
      <main
        className={`map-canvas-container ${isDragging ? 'is-dragging' : ''}`}
        ref={containerRef}
        {...bindContainerEvents}
        aria-label="Peta silsilah keluarga interaktif"
      >
        <TreeCanvas
          layout={layout}
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
      </main>

      {/* 3. Floating Map Controls (Zoom / Fit / Reset) */}
      <Controls
        scale={viewport.scale}
        lodLevel={lodLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        onFit={() => fitView(viewBounds)}
      />

      {/* 4. Minimap Radar View */}
      <Minimap
        layout={layout}
        viewport={viewport}
        containerSize={containerSize}
        onNavigate={(targetWorldX, targetWorldY) => {
          flyToNode(targetWorldX, targetWorldY, viewport.scale);
        }}
      />

      {/* 5. Map Legend Guide */}
      <LegendPanel />

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
