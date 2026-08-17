import React, { useState, useRef, useEffect } from 'react';
import type { FamilyData, FamilyMember } from '../types/family';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import {
  Search,
  Shield,
  ShieldAlert,
  UserPlus,
  Download,
  Upload,
  RotateCcw,
  GitGraph,
  Database
} from 'lucide-react';

interface NavbarProps {
  familyData: FamilyData;
  isAdmin: boolean;
  isCloudSyncing?: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenAddMember: () => void;
  onFlyToMember: (memberId: string) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onResetSample: () => void;
  onOpenDatabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  familyData,
  isAdmin,
  isCloudSyncing = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAddMember,
  onFlyToMember,
  onExportJSON,
  onImportJSON,
  onResetSample,
  onOpenDatabaseModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const isSupabaseReady = isSupabaseConfigured();

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (m: FamilyMember) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    onFlyToMember(m.id);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="app-navbar">
      {/* Brand / Title */}
      <div className="nav-brand-section">
        <div className="nav-logo-icon">
          <GitGraph size={22} />
        </div>
        <div>
          <h1 className="nav-title">{familyData.familyTreeName}</h1>
          <div className="nav-subtitle">
            {membersList.length} Anggota Keluarga • Multi-Generasi Silsilah
            {isCloudSyncing && <span style={{ color: 'var(--text-gold)', marginLeft: 6 }}>• Menyinkronkan...</span>}
          </div>
        </div>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)')}
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
        {/* Supabase Database Config Button */}
        <button
          className="btn-nav-glass"
          onClick={onOpenDatabaseModal}
          title="Pengaturan Database Supabase"
          style={{
            borderColor: isSupabaseReady ? 'rgba(16, 185, 129, 0.4)' : undefined,
            color: isSupabaseReady ? '#34d399' : undefined
          }}
        >
          <Database size={15} />
          <span>{isSupabaseReady ? 'Supabase' : 'Database'}</span>
        </button>

        <input
          type="file"
          ref={importFileRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />

        <button
          className="btn-nav-glass"
          onClick={onExportJSON}
          title="Download Backup Data Silsilah (JSON)"
        >
          <Download size={15} />
          <span>Backup</span>
        </button>

        <button
          className="btn-nav-glass"
          onClick={() => importFileRef.current?.click()}
          title="Import Data Silsilah dari file JSON"
        >
          <Upload size={15} />
          <span>Import</span>
        </button>

        <button
          className="btn-nav-glass"
          onClick={() => {
            if (window.confirm('Reset data silsilah ke contoh default 4 generasi?')) {
              onResetSample();
            }
          }}
          title="Reset ke Contoh Silsilah Default"
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

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
