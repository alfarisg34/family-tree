import React, { useState, useRef, useEffect } from 'react';
import type { FamilyData, FamilyMember } from '../types/family';
import {
  Search,
  Shield,
  ShieldAlert,
  UserPlus,
  GitGraph,
  ChevronDown,
  Plus
} from 'lucide-react';

interface NavbarProps {
  familyData: FamilyData;
  currentSlug: string;
  allTrees: Array<{ id: string; slug: string; tree_name: string }>;
  isAdmin: boolean;
  isCloudSyncing?: boolean;
  onNavigateToSlug: (slug: string) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenAddMember: () => void;
  onFlyToMember: (memberId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  familyData,
  currentSlug,
  allTrees,
  isAdmin,
  isCloudSyncing = false,
  onNavigateToSlug,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAddMember,
  onFlyToMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTreeSwitcherOpen, setIsTreeSwitcherOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement | null>(null);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  const membersList = Object.values(familyData.members);

  const searchResults = membersList.filter((m) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      (m.occupation && m.occupation.toLowerCase().includes(q)) ||
      (m.residence && m.residence.toLowerCase().includes(q))
    );
  }).slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsTreeSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (m: FamilyMember) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    onFlyToMember(m.id);
  };

  const handleCreateNewTree = () => {
    const newName = window.prompt('Masukkan nama keluarga baru (Contoh: Keluarga Hajjah Robbanisah):');
    if (!newName || !newName.trim()) return;
    
    const generatedSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

    if (generatedSlug) {
      setIsTreeSwitcherOpen(false);
      onNavigateToSlug(generatedSlug);
    }
  };

  return (
    <header className="app-navbar">
      {/* Brand / Multi-Family Tree Switcher */}
      <div className="nav-brand-section" ref={switcherRef} style={{ position: 'relative' }}>
        <div className="nav-logo-icon">
          <GitGraph size={22} />
        </div>
        
        <div
          onClick={() => {
            if (isAdmin) {
              setIsTreeSwitcherOpen(!isTreeSwitcherOpen);
            }
          }}
          style={{
            cursor: isAdmin ? 'pointer' : 'default',
            display: 'flex',
            flexDirection: 'column'
          }}
          title={isAdmin ? 'Klik untuk beralih pohon silsilah keluarga (Mode Admin)' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h1 className="nav-title">{familyData.familyTreeName}</h1>
            {isAdmin && (
              <ChevronDown size={16} style={{ color: 'var(--text-gold)', opacity: 0.8 }} />
            )}
          </div>
          <div className="nav-subtitle">
            {isAdmin ? `/${currentSlug} • ` : ''}{membersList.length} Anggota Keluarga • Multi-Generasi Silsilah
            {isCloudSyncing && <span style={{ color: 'var(--text-gold)', marginLeft: 6 }}>• Menyinkronkan...</span>}
          </div>
        </div>

        {/* Tree Switcher Dropdown (Admin Only) */}
        {isAdmin && isTreeSwitcherOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              left: 0,
              minWidth: 300,
              background: '#0f172a',
              border: '1px solid var(--border-glass-highlight)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
              zIndex: 110,
              backdropFilter: 'blur(20px)',
              padding: 6
            }}
          >
            <div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pilih Silsilah Keluarga:
            </div>

            {/* List of default/known trees */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {allTrees.map((tree) => {
                const isActive = currentSlug === tree.slug;

                return (
                  <div
                    key={tree.id || tree.slug}
                    onClick={() => {
                      setIsTreeSwitcherOpen(false);
                      onNavigateToSlug(tree.slug);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                        {tree.tree_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/{tree.slug}</div>
                    </div>
                    {isActive && (
                      <span style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 700 }}>Aktif</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create New Tree Option (Admin or Click to Login) */}
            {isAdmin && (
              <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: 6, paddingTop: 6 }}>
                <div
                  onClick={handleCreateNewTree}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Plus size={15} /> Buat Pohon Silsilah Baru...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center Search Input with Instant Fly-to AutoComplete */}
      <div className="nav-center-search" ref={searchRef}>
        <Search size={16} className="search-icon-inside" />
        <input
          type="text"
          placeholder="Cari anggota (nama, profesi, kota)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
          className="search-input"
        />

        {isSearchOpen && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#0f172a',
              border: '1px solid var(--border-glass-highlight)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
              zIndex: 100,
              backdropFilter: 'blur(16px)'
            }}
          >
            {searchResults.map((m) => (
              <div
                key={m.id}
                onClick={() => handleSelectSearchResult(m)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <img
                  src={m.avatar}
                  alt={m.fullName}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    filter: m.isDeceased ? 'var(--sepia-filter)' : undefined
                  }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {m.fullName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    Gen {m.generation} {m.nickname ? `• "${m.nickname}"` : ''} {m.isDeceased ? '• 🎗️ Wafat' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="nav-actions-section">
        {isAdmin ? (
          <>
            <button className="btn-nav-primary" onClick={onOpenAddMember}>
              <UserPlus size={15} />
              <span>+ Tambah Anggota</span>
            </button>

            <button
              className="btn-nav-glass btn-admin-active"
              onClick={onLogoutAdmin}
              title="Keluar dari mode admin"
            >
              <ShieldAlert size={15} />
              <span>Admin (Keluar)</span>
            </button>
          </>
        ) : (
          <button className="btn-nav-glass" onClick={onOpenAdminLogin}>
            <Shield size={15} />
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
