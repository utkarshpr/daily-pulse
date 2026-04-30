import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['T'], desc: 'Today' },
  { keys: ['R'], desc: 'Routines' },
  { keys: ['G'], desc: 'Goals' },
  { keys: ['C'], desc: 'Calendar' },
  { keys: ['N'], desc: 'Notes' },
  { keys: ['M'], desc: 'Reminders' },
  { keys: ['S'], desc: 'Stats' },
  { keys: ['J'], desc: 'Journal' },
  { keys: ['I'], desc: 'Quick capture' },
  { keys: ['⌘', 'K'], desc: 'Command palette' },
  { keys: ['?'], desc: 'This cheat-sheet' },
];

const ELSEWHERE = [
  { context: 'Today', items: [
    { keys: ['Click ⋯ on row'], desc: 'Note / skip routine' },
    { keys: ['Long-press row'], desc: 'Same' },
    { keys: ['Swipe left/right'], desc: 'Toggle complete' },
  ]},
  { context: 'Notes editor', items: [
    { keys: ['Paste / drop'], desc: 'Embed image' },
    { keys: ['[[Title]]'], desc: 'Link to another note' },
    { keys: ['- [ ] item'], desc: 'Interactive checklist' },
  ]},
  { context: 'Reminders editor', items: [
    { keys: ['Smart input'], desc: '"in 30 min", "tomorrow at 9", "every monday"' },
  ]},
  { context: 'Quick capture', items: [
    { keys: ['⌘', '↵'], desc: 'Save to inbox' },
  ]},
];

export default function CheatSheet({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative card max-w-lg w-full p-6 animate-pop-in max-h-[90vh] overflow-y-auto scroll-area" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center" aria-label="Close">
          <X size={14} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            <Keyboard size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">Cheat sheet</div>
            <h3 className="text-lg font-bold">Keyboard & gestures</h3>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Global shortcuts</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SHORTCUTS.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
                <span className="flex gap-1">
                  {s.keys.map((k, j) => (
                    <kbd key={j} className="px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-xs bg-white/60 dark:bg-white/5 font-semibold">{k}</kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {ELSEWHERE.map((sect) => (
          <div key={sect.context} className="mt-5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">{sect.context}</div>
            <ul className="space-y-1.5">
              {sect.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.desc}</span>
                  <span className="flex gap-1">
                    {item.keys.map((k, j) => (
                      <kbd key={j} className="px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 text-xs bg-white/60 dark:bg-white/5 font-semibold">{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
