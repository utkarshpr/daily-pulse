import React, { useEffect, useRef, useState } from 'react';
import { Inbox, X, StickyNote, Bell, ListChecks, Send } from 'lucide-react';

export default function QuickCapture({ open, onClose, onSaveInbox, onConvertNote, onConvertReminder, onConvertRoutine }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      setText('');
      setTimeout(() => ref.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (text.trim()) {
          onSaveInbox(text.trim());
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, text, onClose, onSaveInbox]);

  if (!open) return null;

  const t = text.trim();
  const disabled = !t;

  const send = (fn) => {
    if (!t) return;
    fn(t);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center pt-20 px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative card w-full max-w-lg overflow-hidden animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/70 dark:border-white/10">
          <div className="size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow shrink-0">
            <Inbox size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-tight">Quick capture</div>
            <div className="text-[10px] text-slate-500 leading-tight">Brain dump now, sort later</div>
          </div>
          <span className="hidden sm:flex chip text-[10px] bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">
            ⌘↵ to save
          </span>
          <button onClick={onClose} className="size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="p-4">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="input min-h-[100px] resize-y text-sm"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={() => send(onSaveInbox)} disabled={disabled}>
              <Send size={14} /> Save to Inbox
            </button>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mx-1">or convert →</span>
            <button className="btn-ghost text-xs" onClick={() => send(onConvertNote)} disabled={disabled}>
              <StickyNote size={13} /> Note
            </button>
            <button className="btn-ghost text-xs" onClick={() => send(onConvertReminder)} disabled={disabled}>
              <Bell size={13} /> Reminder
            </button>
            <button className="btn-ghost text-xs" onClick={() => send(onConvertRoutine)} disabled={disabled}>
              <ListChecks size={13} /> Routine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
