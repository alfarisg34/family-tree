import { useEffect, useState } from 'react';
import { Database, X } from 'lucide-react';
import type { FamilyData } from '../types/family';
import { apiRequest, fetchFamilyData, syncEntireTree } from '../services/databaseService';

interface DatabaseModalProps {
  familyData: FamilyData;
  onUpdateFamilyData: (data: FamilyData) => void;
  onClose: () => void;
}
export function DatabaseModal({ familyData, onUpdateFamilyData, onClose }: DatabaseModalProps) {
  const [status, setStatus] = useState('Memeriksa koneksi…');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest('health').then(() => { if (active) setStatus('Terhubung ke Neon.'); }).catch(() => { if (active) setStatus('Database belum terhubung. Periksa konfigurasi server.'); });
    return () => { active = false; };
  }, []);
  const transfer = async (upload: boolean) => {
    setLoading(true);
    try {
      if (upload) {
        const result = await syncEntireTree(familyData);
        if (!result.success) throw new Error(result.message);
        setStatus(result.message);
      } else {
        const data = await fetchFamilyData(familyData.slug);
        if (!data) throw new Error('Keluarga belum tersimpan di database.');
        onUpdateFamilyData(data); setStatus('Data terbaru berhasil dimuat.');
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Permintaan gagal.'); }
    finally { setLoading(false); }
  };
  return <div className="modal-backdrop" onClick={onClose}><section className="modal-content-card" style={{ maxWidth: 480, padding: 28, gap: 20 }} onClick={(event) => event.stopPropagation()}>
    <button className="modal-close-btn" aria-label="Tutup pengaturan database" onClick={onClose}><X size={16} /></button>
    <Database size={28} color="var(--text-gold)" /><h2>Database keluarga</h2>
    <p role="status">{status}</p>
    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Data keluarga dan foto disimpan di Neon. Koneksi dikelola oleh server aplikasi.</p>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="btn-nav-primary" disabled={loading} onClick={() => transfer(true)}>Simpan ke database</button><button className="btn-nav-glass" disabled={loading} onClick={() => transfer(false)}>Muat data terbaru</button></div>
  </section></div>;
}
