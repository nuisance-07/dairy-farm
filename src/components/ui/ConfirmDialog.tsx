'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#FEE2E2' }}
          >
            <AlertTriangle className="w-7 h-7" style={{ color: '#EF4444' }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
            {title}
          </h3>
          <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
            {message}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button onClick={onConfirm} className="btn btn-danger" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
