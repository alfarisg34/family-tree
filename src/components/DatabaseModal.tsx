import React, { useState } from 'react';
import {
  getSupabaseCredentials,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  isSupabaseConfigured
} from '../utils/supabaseClient';
import { syncEntireTreeToSupabase, fetchFamilyDataFromSupabase } from '../services/supabaseService';
import type { FamilyData } from '../types/family';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  CloudDownload,
  Key,
  Globe,
  ShieldCheck
} from 'lucide-react';

interface DatabaseModalProps {
  familyData: FamilyData;
  onUpdateFamilyData: (newData: FamilyData) => void;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  familyData,
  onUpdateFamilyData,
  onClose
}) => {
  const credentials = getSupabaseCredentials();
  const [url, setUrl] = useState(credentials.url);
  const [anonKey, setAnonKey] = useState(credentials.anonKey);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      clearSupabaseCredentials();
      setStatusMsg({ type: 'info', text: 'Konfigurasi Supabase telah dikosongkan. Beralih ke penyimpanan lokal.' });
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    setSupabaseCredentials(url, anonKey);
    setStatusMsg({ type: 'success', text: 'Koneksi Supabase disimpan! Memuat ulang konfigurasi...' });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleSyncToSupabase = async () => {
    if (!isConnected) {
      setStatusMsg({ type: 'error', text: 'Silakan hubungkan Supabase terlebih dahulu.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Sedang mengunggah silsilah keluarga ke Supabase...' });

    const res = await syncEntireTreeToSupabase(familyData);
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handlePullFromSupabase = async () => {
    if (!isConnected) {
      setStatusMsg({ type: 'error', text: 'Silakan hubungkan Supabase terlebih dahulu.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Mengambil data dari database Supabase...' });

    const remoteData = await fetchFamilyDataFromSupabase();
    setIsLoading(false);

    if (remoteData && Object.keys(remoteData.members).length > 0) {
      onUpdateFamilyData(remoteData);
      setStatusMsg({
        type: 'success',
        text: `Berhasil memuat ${Object.keys(remoteData.members).length} anggota dari database Supabase!`
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Database Supabase masih kosong atau tabel belum dibuat dengan supabase_schema.sql'
      });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Pengaturan Database Supabase</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {isConnected ? '🟢 Terhubung ke Supabase' : '⚪ Mode Penyimpanan Browser (LocalStorage)'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ position: 'static' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status Alert */}
          {statusMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background:
                  statusMsg.type === 'success'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : statusMsg.type === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(56, 189, 248, 0.15)',
                border: `1px solid ${
                  statusMsg.type === 'success'
                    ? 'rgba(16, 185, 129, 0.35)'
                    : statusMsg.type === 'error'
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'rgba(56, 189, 248, 0.35)'
                }`,
                color:
                  statusMsg.type === 'success'
                    ? '#34d399'
                    : statusMsg.type === 'error'
                    ? '#f87171'
                    : '#38bdf8'
              }}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Sync & Cloud Actions if connected */}
          {isConnected && (
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-gold)', marginBottom: 8 }}>
                Sinkronisasi Database Cloud
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Unggah data silsilah ke cloud Supabase atau muat pembaruan terbaru dari database.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-nav-primary"
                  onClick={handleSyncToSupabase}
                  disabled={isLoading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <CloudUpload size={16} />
                  <span>Unggah Silsilah ke Supabase</span>
                </button>

                <button
                  type="button"
                  className="btn-nav-glass"
                  onClick={handlePullFromSupabase}
                  disabled={isLoading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <CloudDownload size={16} />
                  <span>Tarik Data dari Supabase</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Input Credentials */}
          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={14} /> URL Project Supabase
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={14} /> Anon Public API Key Supabase
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
              💡 <strong>Langkah Cepat Setup di Supabase:</strong><br />
              1. Buka dashboard Supabase ➔ <strong>SQL Editor</strong>.<br />
              2. Salin isi berkas <code>supabase_schema.sql</code> dari proyek ini lalu klik <strong>Run</strong>.<br />
              3. Salin <strong>Project URL</strong> & <strong>anon public API Key</strong> dari <em>Project Settings &gt; API</em>.<br />
              4. Untuk Vercel: Tambahkan di <em>Project Settings &gt; Environment Variables</em> sebagai <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button type="button" className="btn-nav-glass" onClick={onClose}>
                Tutup
              </button>
              <button type="submit" className="btn-nav-primary">
                <ShieldCheck size={16} /> Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
