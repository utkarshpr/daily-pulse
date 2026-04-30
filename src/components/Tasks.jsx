import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, GripVertical, CheckSquare } from 'lucide-react';
import { uid, PALETTE, colorFor, cn } from '../lib/utils';
import { useDragReorder } from '../hooks/useDragReorder';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY = { name: '', description: '', icon: '✨', time: '', color: 'violet', days: [0, 1, 2, 3, 4, 5, 6], category: '', goalCount: 0, unit: '' };

const CATEGORY_SUGGESTIONS = ['Morning', 'Work', 'Health', 'Learning', 'Evening'];

export default function Tasks({ tasks, setTasks, goals = [], setGoals, confirm, flash }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const drag = useDragReorder(tasks, setTasks);

  const startNew = () => {
    setEditing('new');
    setDraft(EMPTY);
  };

  const startEdit = (task) => {
    setEditing(task.id);
    setDraft({ ...EMPTY, ...task });
  };

  const cancel = () => {
    setEditing(null);
    setDraft(EMPTY);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    if (editing === 'new') {
      setTasks((prev) => [...prev, { ...draft, id: uid(), name: draft.name.trim() }]);
      flash?.('Routine added');
    } else {
      setTasks((prev) => prev.map((t) => (t.id === editing ? { ...draft, id: editing, name: draft.name.trim() } : t)));
      flash?.('Routine updated');
    }
    cancel();
  };

  const remove = async (id) => {
    const linkedGoals = goals.filter((g) => (g.linkedTaskIds || []).includes(id));
    const message = linkedGoals.length
      ? `Linked to ${linkedGoals.length} goal${linkedGoals.length > 1 ? 's' : ''} (${linkedGoals.map((g) => `"${g.title}"`).join(', ')}). Deleting will unlink the routine from ${linkedGoals.length > 1 ? 'them' : 'it'}; the goal${linkedGoals.length > 1 ? 's' : ''} will remain. Past completion data is preserved.`
      : 'Past completion data will be preserved, but the routine will no longer appear in your daily view.';
    const ok = await confirm?.({
      title: linkedGoals.length ? 'This routine is linked to a goal' : 'Delete this routine?',
      message,
      confirmLabel: 'Delete & unlink',
    });
    if (!ok) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (linkedGoals.length && setGoals) {
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          linkedTaskIds: (g.linkedTaskIds || []).filter((tid) => tid !== id),
        }))
      );
    }
    flash?.(linkedGoals.length ? 'Routine deleted & unlinked' : 'Routine deleted');
  };

  const toggleDay = (d) => {
    setDraft((prev) => {
      const has = prev.days.includes(d);
      return { ...prev, days: has ? prev.days.filter((x) => x !== d) : [...prev.days, d].sort() };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Routines</h1>
          <p className="text-slate-500 text-sm">Drag to reorder · long-press to bulk-select.</p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 1 && (
            <button
              onClick={() => { setBulkMode((b) => !b); setSelected(new Set()); }}
              className={cn('btn-ghost', bulkMode && 'bg-violet-500/15 text-violet-600')}
            >
              <CheckSquare size={15} /> {bulkMode ? 'Done' : 'Bulk edit'}
            </button>
          )}
          <button className="btn-primary" onClick={startNew}>
            <Plus size={16} /> New routine
          </button>
        </div>
      </div>

      {bulkMode && selected.size > 0 && (
        <BulkEditBar
          count={selected.size}
          onApplyColor={(color) => {
            setTasks((prev) => prev.map((t) => (selected.has(t.id) ? { ...t, color } : t)));
            flash?.(`Color updated for ${selected.size} routines`);
          }}
          onApplyDays={(days) => {
            setTasks((prev) => prev.map((t) => (selected.has(t.id) ? { ...t, days } : t)));
            flash?.(`Days updated for ${selected.size} routines`);
          }}
          onApplyCategory={(category) => {
            setTasks((prev) => prev.map((t) => (selected.has(t.id) ? { ...t, category } : t)));
            flash?.(`Category updated for ${selected.size} routines`);
          }}
          onDeleteAll={async () => {
            const ok = await confirm?.({
              title: `Delete ${selected.size} routine${selected.size > 1 ? 's' : ''}?`,
              message: 'Past completion data is preserved. Linked goals will be auto-unlinked.',
              confirmLabel: 'Delete all',
            });
            if (!ok) return;
            const ids = Array.from(selected);
            setTasks((prev) => prev.filter((t) => !selected.has(t.id)));
            if (setGoals) {
              setGoals((prev) =>
                prev.map((g) => ({ ...g, linkedTaskIds: (g.linkedTaskIds || []).filter((id) => !ids.includes(id)) }))
              );
            }
            setSelected(new Set());
            flash?.(`${ids.length} routines deleted`);
          }}
          onClear={() => setSelected(new Set())}
        />
      )}

      {editing && (
        <div className="card p-5 animate-pop-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Name</label>
              <input
                autoFocus
                className="input mt-1"
                placeholder="e.g. Morning meditation"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Icon (emoji)</label>
              <input
                className="input mt-1"
                maxLength={4}
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Time (optional)</label>
              <input
                className="input mt-1"
                placeholder="07:00"
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Description</label>
              <input
                className="input mt-1"
                placeholder="A short note about this routine"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Category (optional)</label>
              <input
                className="input mt-1"
                placeholder="Morning, Work, Health…"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="md:col-span-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-violet-500"
                  checked={(draft.goalCount || 0) > 0}
                  onChange={(e) => setDraft({ ...draft, goalCount: e.target.checked ? 1 : 0 })}
                />
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Track a daily count instead of a single check</span>
              </label>
              {(draft.goalCount || 0) > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Daily target</label>
                    <input
                      type="number"
                      min="1"
                      className="input mt-1"
                      value={draft.goalCount}
                      onChange={(e) => setDraft({ ...draft, goalCount: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Unit (optional)</label>
                    <input
                      className="input mt-1"
                      placeholder="glasses, pages, reps…"
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Color</label>
              <div className="mt-2 flex gap-2">
                {PALETTE.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setDraft({ ...draft, color: p.name })}
                    className={cn(
                      'size-8 rounded-lg bg-gradient-to-tr transition',
                      p.from, p.to,
                      draft.color === p.name ? 'ring-2 ring-offset-2 ring-offset-transparent ' + p.ring + ' scale-110' : 'opacity-70 hover:opacity-100'
                    )}
                    aria-label={p.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Days</label>
              <div className="mt-2 flex gap-1.5">
                {DAYS.map((d, i) => {
                  const active = draft.days.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        'size-9 rounded-lg text-xs font-bold transition',
                        active
                          ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white shadow'
                          : 'bg-white/60 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10 hover:bg-white'
                      )}
                      title={DAY_NAMES[i]}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={cancel}>
              <X size={16} /> Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              <Save size={16} /> Save routine
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !editing ? (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold">No routines yet</h3>
          <p className="text-sm text-slate-500 mt-1">Add your first habit and it will appear in your daily view.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const c = colorFor(t.color);
            const isSel = selected.has(t.id);
            return (
              <li
                key={t.id}
                draggable={!bulkMode}
                onDragStart={drag.onDragStart(t.id)}
                onDragOver={drag.onDragOver(t.id)}
                onDragLeave={drag.onDragLeave}
                onDrop={drag.onDrop(t.id)}
                onDragEnd={drag.onDragEnd}
                className={cn(
                  'card p-4 flex items-center gap-3 animate-slide-in transition',
                  drag.dragOverId === t.id && 'ring-2 ring-violet-500/60',
                  isSel && 'ring-2 ring-violet-500',
                  bulkMode && 'cursor-pointer'
                )}
                onClick={(e) => {
                  if (!bulkMode) return;
                  e.stopPropagation();
                  setSelected((prev) => {
                    const n = new Set(prev);
                    if (n.has(t.id)) n.delete(t.id); else n.add(t.id);
                    return n;
                  });
                }}
              >
                {bulkMode && (
                  <div
                    className={cn(
                      'size-5 rounded-md border-2 grid place-items-center shrink-0 transition',
                      isSel ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 border-transparent text-white' : 'border-slate-300 dark:border-white/15'
                    )}
                  >
                    {isSel && <CheckSquare size={14} strokeWidth={3} />}
                  </div>
                )}
                {!bulkMode && (
                  <div className="hidden sm:flex flex-col text-slate-400 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className={cn('size-11 rounded-xl bg-gradient-to-tr text-white grid place-items-center text-lg shadow', c.from, c.to)}>
                  <span>{t.icon || '✨'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                    {t.time && <span>{t.time}</span>}
                    {t.time && <span>•</span>}
                    <span>
                      {t.days.length === 7 ? 'Every day' : t.days.map((d) => DAY_NAMES[d]).join(', ')}
                    </span>
                    {(t.goalCount || 0) > 0 && (
                      <>
                        <span>•</span>
                        <span className="chip bg-violet-500/15 text-violet-600 dark:text-violet-400">
                          Target {t.goalCount}{t.unit ? ` ${t.unit}` : ''}/day
                        </span>
                      </>
                    )}
                    {t.description && (
                      <>
                        <span>•</span>
                        <span className="truncate">{t.description}</span>
                      </>
                    )}
                  </div>
                </div>
                {!bulkMode && (
                  <div className="flex items-center gap-1.5">
                    <button className="btn-ghost !px-3 !py-2" onClick={() => startEdit(t)} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="btn-danger !px-3 !py-2" onClick={() => remove(t.id)} aria-label="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const BULK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function BulkEditBar({ count, onApplyColor, onApplyDays, onApplyCategory, onDeleteAll, onClear }) {
  const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [category, setCategory] = useState('');
  return (
    <div className="card p-4 sticky top-2 z-30 animate-pop-in border-2 border-violet-300/40 dark:border-violet-500/30">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm font-semibold">{count} selected</div>
        <button onClick={onClear} className="btn-ghost text-xs !px-3 !py-1.5">Clear</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Color</div>
          <div className="flex gap-1.5">
            {PALETTE.map((p) => (
              <button
                key={p.name}
                onClick={() => onApplyColor(p.name)}
                className={cn('size-7 rounded-lg bg-gradient-to-tr', p.from, p.to, 'hover:scale-110 transition')}
                title={p.name}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Days</div>
          <div className="flex gap-1">
            {BULK_DAYS.map((d, i) => {
              const active = days.includes(i);
              return (
                <button
                  key={i}
                  onClick={() =>
                    setDays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()))
                  }
                  className={cn(
                    'size-7 rounded-md text-[11px] font-bold transition',
                    active ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white' : 'bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  )}
                >{d}</button>
              );
            })}
            <button onClick={() => onApplyDays(days)} className="btn-primary !px-2 !py-1.5 text-xs">Apply</button>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Category</div>
          <div className="flex gap-1.5">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Health, Work…"
              className="input !py-1.5 text-xs flex-1"
            />
            <button onClick={() => onApplyCategory(category)} className="btn-primary !px-3 !py-1.5 text-xs">Apply</button>
          </div>
        </div>
      </div>
      <button onClick={onDeleteAll} className="btn-danger w-full justify-center mt-3">
        <Trash2 size={14} /> Delete selected
      </button>
    </div>
  );
}
