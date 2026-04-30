import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { todayKey, cn } from '../lib/utils';

const MOODS = [
  { v: 1, e: '😞', label: 'Rough' },
  { v: 2, e: '😕', label: 'Meh' },
  { v: 3, e: '😐', label: 'Okay' },
  { v: 4, e: '🙂', label: 'Good' },
  { v: 5, e: '🤩', label: 'Great' },
];

export default function ReviewPrompt({ open, onClose, reviews, setReviews, completionStats }) {
  const [mood, setMood] = useState(3);
  const [journal, setJournal] = useState('');
  const [highlight, setHighlight] = useState('');

  if (!open) return null;

  const save = () => {
    const k = todayKey();
    setReviews({ ...reviews, [k]: { mood, journal: journal.trim(), highlight: highlight.trim(), at: Date.now() } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-lg w-full p-6 sm:p-7 animate-pop-in max-h-[90vh] overflow-y-auto scroll-area" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">End of day</div>
            <h3 className="text-xl font-bold">How was today?</h3>
          </div>
        </div>

        {completionStats && (
          <div className="text-sm text-slate-500 mt-1 mb-4">
            You completed <strong className="text-slate-700 dark:text-slate-200">{completionStats.completed}/{completionStats.total}</strong> routines today.
          </div>
        )}

        <div className="mt-2">
          <label className="text-xs uppercase tracking-wider text-slate-500">Mood</label>
          <div className="mt-2 flex gap-2 justify-between">
            {MOODS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition',
                  mood === m.v
                    ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white scale-105 shadow-lg shadow-violet-500/30'
                    : 'bg-white/60 dark:bg-white/5 text-slate-500 hover:scale-105'
                )}
              >
                <span className="text-2xl">{m.e}</span>
                <span className="text-[10px] font-semibold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider text-slate-500">Highlight of the day</label>
          <input
            className="input mt-1"
            placeholder="One thing that went well…"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="text-xs uppercase tracking-wider text-slate-500">Reflections</label>
          <textarea
            className="input mt-1 min-h-[100px] resize-y"
            placeholder="What did you learn? What will you do differently tomorrow?"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Skip</button>
          <button className="btn-primary" onClick={save}>
            <Save size={16} /> Save review
          </button>
        </div>
      </div>
    </div>
  );
}
