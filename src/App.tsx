import React, { useState, useMemo, useEffect } from 'react';
import { useFamilyData } from './hooks/useFamilyData';
import { usePanZoom } from './hooks/usePanZoom';
import { computeFamilyTreeLayout } from './utils/layoutEngine';
import type { LayoutNode, FamilyMember } from './types/family';

// Components
import { Navbar } from './components/Navbar';
import { TreeCanvas } from './components/TreeCanvas';
import { Controls } from './components/Controls';
import { Minimap } from './components/Minimap';
import { LegendPanel } from './components/LegendPanel';
import { MemberDetailModal } from './components/MemberDetailModal';
import { MemberFormModal } from './components/MemberFormModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DatabaseModal } from './components/DatabaseModal';

export const App: React.FC = () => {
  const {
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
  } = useFamilyData();

  // Compute graph layout
  const layout = useMemo(() => {
    return computeFamilyTreeLayout(familyData);
  }, [familyData]);

  // Pan & Zoom Map Engine
  const {
    viewport,
    lodLevel,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    flyToNode,
    bindContainerEvents
  } = usePanZoom({
    bounds: layout.bounds,
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

  // Database Modal State
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Auto-fit on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView(layout.bounds);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle clicking a node on the tree
  const handleNodeClick = (node: LayoutNode) => {
    setSelectedMemberId(node.id);
    setHighlightedMemberId(node.id);
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

  // Save member from Form
  const handleSaveMemberForm = (member: FamilyMember) => {
    if (formSourceNodeId && formRelationDirection) {
      addRelative(formSourceNodeId, formRelationDirection, member);
    } else {
      saveMember(member);
    }
  };

  const selectedMember = selectedMemberId ? familyData.members[selectedMemberId] : null;

  return (
    <div className="app-container">
      {/* 1. Header Navbar */}
      <Navbar
        familyData={familyData}
        isAdmin={isAdmin}
        isCloudSyncing={isCloudSyncing}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={logoutAdmin}
        onOpenAddMember={handleOpenAddMemberNavbar}
        onFlyToMember={handleFlyToMember}
        onExportJSON={exportJSON}
        onImportJSON={(jsonStr) => {
          const ok = importJSON(jsonStr);
          if (ok) alert('Data silsilah berhasil diimport!');
          else alert('Format file JSON tidak valid.');
        }}
        onResetSample={resetToSample}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
      />

      {/* 2. Map Canvas (Drag & Pinch Zoomable Container) */}
      <main
        className={`map-canvas-container ${isDragging ? 'is-dragging' : ''}`}
        ref={containerRef}
        {...bindContainerEvents}
      >
        <TreeCanvas
          layout={layout}
          viewport={viewport}
          lodLevel={lodLevel}
          selectedNodeId={selectedMemberId}
          highlightedNodeId={highlightedMemberId}
          isAdmin={isAdmin}
          onNodeClick={handleNodeClick}
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
        onFit={() => fitView(layout.bounds)}
      />

      {/* 4. Minimap Radar View */}
      <Minimap
        layout={layout}
        viewport={viewport}
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

      {/* Database & Supabase Settings Modal */}
      {isDatabaseModalOpen && (
        <DatabaseModal
          familyData={familyData}
          onUpdateFamilyData={updateEntireFamilyData}
          onClose={() => setIsDatabaseModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
