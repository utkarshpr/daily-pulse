import React, { useEffect, useRef, useState } from 'react';
import { Pencil, SkipForward, X } from 'lucide-react';

export default function RoutineMenu({ open, onClose, isSkipped, onToggleSkip, note, onSaveNote, taskName }) {
  const [text, setText] = useState(note || '');
  const ref = useRef(null);

  useEffect(() => {
    setText(note || '');
  }, [note, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    onSaveNote(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative card max-w-sm w-full p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        <div className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">Routine</div>
        <h3 className="text-lg font-bold mt-0.5 truncate pr-8">{taskName}</h3>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Pencil size={11} /> Note for today
          </label>
          <textarea
            ref={ref}
            className="input mt-1 min-h-[80px] resize-y text-sm"
            placeholder="ran 3km, knee tight…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          onClick={onToggleSkip}
          className="w-full btn-ghost mt-3 justify-center"
        >
          <SkipForward size={14} />
          {isSkipped ? 'Unmark as skipped' : 'Mark as skipped today (preserves streak)'}
        </button>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={save}>Save note</button>
        </div>
      </div>
    </div>
  );
}
