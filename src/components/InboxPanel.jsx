import React from 'react';
import { Inbox, StickyNote, Bell, ListChecks, Trash2 } from 'lucide-react';

export default function InboxPanel({ inbox, onConvertNote, onConvertReminder, onConvertRoutine, onDelete }) {
  if (!inbox || inbox.length === 0) return null;

  return (
    <div className="card p-4 border-2 border-dashed border-violet-300/50 dark:border-violet-500/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow">
          <Inbox size={15} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Inbox</div>
          <div className="text-[11px] text-slate-500">{inbox.length} unsorted captures</div>
        </div>
      </div>
      <ul className="space-y-2">
        {inbox.map((item) => (
          <li
            key={item.id}
            className="rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3 flex items-start gap-2 animate-pop-in"
          >
            <div className="flex-1 text-sm whitespace-pre-wrap break-words leading-relaxed">{item.text}</div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onConvertNote(item)} className="p-1.5 rounded-md hover:bg-white/80 dark:hover:bg-white/10 text-violet-600 dark:text-violet-400" title="Convert to note">
                <StickyNote size={14} />
              </button>
              <button onClick={() => onConvertReminder(item)} className="p-1.5 rounded-md hover:bg-white/80 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400" title="Convert to reminder">
                <Bell size={14} />
              </button>
              <button onClick={() => onConvertRoutine(item)} className="p-1.5 rounded-md hover:bg-white/80 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400" title="Convert to routine">
                <ListChecks size={14} />
              </button>
              <button onClick={() => onDelete(item)} className="p-1.5 rounded-md hover:bg-rose-500/20 text-rose-600 dark:text-rose-400" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
