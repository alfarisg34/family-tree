import React, { useState } from 'react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  onLogin: (password: string) => boolean | Promise<boolean>;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');
  const dialogRef = useAccessibleDialog(onClose);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onLogin(password);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        ref={dialogRef} role="dialog" aria-modal="true" aria-label="Masuk admin" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(185, 95, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Autentikasi Admin</h3>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Masuk untuk mengedit silsilah keluarga</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ position: 'static' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Password Admin</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                autoFocus
                required
                placeholder="Masukkan kata sandi admin..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="form-input"
                style={{ width: '100%', paddingLeft: 36 }}
              />
              <KeyRound size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#b74747', fontSize: 12 }}>
              <AlertCircle size={15} /> Kata sandi salah. Silakan coba lagi.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-nav-glass" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-nav-primary" disabled={loading}>
              <ShieldCheck size={16} /> {loading ? 'Memeriksa…' : 'Masuk Mode Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
