import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', tone = 'danger', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const toneClass =
    tone === 'danger'
      ? 'from-rose-500 to-pink-500'
      : 'from-violet-600 to-cyan-500';

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-4 animate-fade-in"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative card max-w-sm w-full p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        <div className={`size-12 rounded-xl bg-gradient-to-tr ${toneClass} text-white grid place-items-center shadow-lg shadow-rose-500/30 mb-3`}>
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn text-white bg-gradient-to-tr ${toneClass} hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
