import React, { useState } from 'react';
import { User, Plus, X, Check, Trash2, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';

const COLORS = ['violet', 'emerald', 'amber', 'rose', 'cyan', 'indigo'];
const COLOR_GRAD = {
  violet: 'from-violet-500 to-fuchsia-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  cyan: 'from-cyan-500 to-sky-500',
  indigo: 'from-indigo-500 to-blue-500',
};

export default function ProfileSwitcher({ profiles, activeId, onSwitch, onCreate, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('emerald');
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');

  const startRename = (p) => {
    setRenamingId(p.id);
    setRenameDraft(p.name);
  };
  const commitRename = () => {
    if (renamingId && renameDraft.trim()) {
      onRename?.(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
    setRenameDraft('');
  };
  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const active = profiles.find((p) => p.id === activeId) || profiles[0];

  const create = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), color });
    setName('');
    setColor('emerald');
    setCreating(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition"
      >
        <div className={cn('size-7 rounded-lg bg-gradient-to-tr text-white grid place-items-center text-xs font-bold shadow', COLOR_GRAD[active?.color] || COLOR_GRAD.violet)}>
          {(active?.name || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Profile</div>
          <div className="text-sm font-semibold truncate">{active?.name}</div>
        </div>
        <User size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 left-0 top-full mt-1 z-30 card p-2 animate-pop-in">
          <div className="space-y-1">
            {profiles.map((p) => {
              const isRenaming = renamingId === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg transition',
                    p.id === activeId ? 'bg-gradient-to-r from-violet-500/15 to-cyan-500/15' : 'hover:bg-white/60 dark:hover:bg-white/5'
                  )}
                >
                  <div className={cn('size-7 rounded-lg bg-gradient-to-tr text-white grid place-items-center text-xs font-bold shrink-0', COLOR_GRAD[p.color] || COLOR_GRAD.violet)}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  {isRenaming ? (
                    <input
                      autoFocus
                      className="input !py-1 text-sm flex-1 min-w-0"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        else if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={commitRename}
                    />
                  ) : (
                    <button onClick={() => { onSwitch(p.id); setOpen(false); }} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                      {p.id === activeId && <Check size={14} className="text-violet-500" />}
                    </button>
                  )}
                  {!isRenaming && onRename && (
                    <button
                      onClick={() => startRename(p)}
                      className="p-1 rounded hover:bg-violet-500/20 text-slate-400 hover:text-violet-500"
                      aria-label="Rename profile"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  {!isRenaming && profiles.length > 1 && p.id !== activeId && (
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-500"
                      aria-label="Delete profile"
                      title="Delete profile and all its data"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-200/70 dark:border-white/10 mt-2 pt-2">
            {creating ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  className="input !py-1.5 text-sm"
                  placeholder="Profile name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        'size-6 rounded-md bg-gradient-to-tr transition',
                        COLOR_GRAD[c],
                        color === c && 'ring-2 ring-offset-2 ring-offset-transparent ring-violet-500 scale-110'
                      )}
                      aria-label={c}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-1">
                  <button onClick={() => { setCreating(false); setName(''); }} className="btn-ghost !px-3 !py-1 text-xs">
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={create} className="btn-primary !px-3 !py-1 text-xs">
                    <Plus size={12} /> Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full btn-ghost text-xs justify-start"
              >
                <Plus size={12} /> New profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
