import React, { useMemo, useState } from 'react';
import { Plus, Bell, BellRing, Pencil, Trash2, Save, X, Check, Clock, Repeat, Wand2, AlertTriangle } from 'lucide-react';
import { uid, cn } from '../lib/utils';
import { REPEAT_OPTIONS, labelForRepeat } from '../lib/recurrence';
import { parseReminder } from '../lib/nlparse';

const EMPTY = { title: '', when: '', notes: '', repeat: 'none', priority: 'medium' };

const PRIORITIES = [
  { value: 'low', label: 'Low', tint: 'from-slate-400 to-slate-500' },
  { value: 'medium', label: 'Medium', tint: 'from-violet-500 to-cyan-500' },
  { value: 'high', label: 'High', tint: 'from-rose-500 to-pink-500' },
];

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Reminders({ reminders, setReminders, confirm, flash }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const requestPerm = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') flash?.('Notifications enabled — reminders will fire even when this tab is closed');
    else if (p === 'denied') flash?.('Notifications blocked — re-enable in browser site settings', true);
  };

  const startNew = () => {
    setEditing('new');
    setDraft(EMPTY);
  };

  const startEdit = (r) => {
    setEditing(r.id);
    setDraft({
      title: r.title,
      when: toLocalInput(r.when),
      notes: r.notes || '',
      repeat: r.repeat || 'none',
      priority: r.priority || 'medium',
    });
  };

  const applySmartInput = (raw) => {
    const parsed = parseReminder(raw);
    setDraft((prev) => ({
      ...prev,
      title: parsed.title || prev.title,
      when: parsed.when ? toLocalInput(parsed.when) : prev.when,
      repeat: parsed.repeat !== 'none' ? parsed.repeat : prev.repeat,
    }));
    flash?.('Parsed — review the time before saving');
  };

  const cancel = () => {
    setEditing(null);
    setDraft(EMPTY);
  };

  const save = () => {
    if (!draft.title.trim() || !draft.when) return;
    const iso = new Date(draft.when).toISOString();
    if (editing === 'new') {
      setReminders((prev) => [
        { id: uid(), title: draft.title.trim(), when: iso, notes: draft.notes, repeat: draft.repeat, priority: draft.priority, done: false, fired: false },
        ...prev,
      ]);
      flash?.('Reminder set');
    } else {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editing ? { ...r, title: draft.title.trim(), when: iso, notes: draft.notes, repeat: draft.repeat, priority: draft.priority, fired: false } : r
        )
      );
      flash?.('Reminder updated');
    }
    cancel();
  };

  const remove = (id) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    setReminders((prev) => prev.filter((x) => x.id !== id));
    flash?.('Reminder deleted', false, () => setReminders((prev) => [r, ...prev]));
  };

  const toggleDone = (id) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  };

  const sorted = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(a.when).getTime() - new Date(b.when).getTime();
      }),
    [reminders]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-slate-500 text-sm">Time-based nudges. Browser notifications fire while the app is open.</p>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <button className="btn-ghost" onClick={requestPerm} title="Allow background reminders">
              <Bell size={16} /> Enable notifications
            </button>
          )}
          {permission === 'denied' && (
            <span className="chip text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400" title="Re-enable in browser site settings">
              <Bell size={11} /> Notifications blocked
            </span>
          )}
          {permission === 'granted' && (
            <span className="chip text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" title="Reminders fire in the background">
              <Bell size={11} /> Background ready
            </span>
          )}
          <button className="btn-primary" onClick={startNew} data-action="new-reminder">
            <Plus size={16} /> New reminder
          </button>
        </div>
      </div>

      {editing && (
        <div className="card p-5 animate-pop-in">
          <SmartInput onApply={applySmartInput} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Title</label>
              <input
                autoFocus
                className="input mt-1"
                placeholder="Call dentist"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">When</label>
              <input
                type="datetime-local"
                className="input mt-1"
                value={draft.when}
                onChange={(e) => setDraft({ ...draft, when: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Notes (optional)</label>
              <input
                className="input mt-1"
                placeholder="Bring insurance card"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Repeat</label>
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDraft({ ...draft, repeat: opt.value })}
                    className={cn(
                      'chip transition border',
                      draft.repeat === opt.value
                        ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent shadow'
                        : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
                    )}
                  >
                    {opt.value !== 'none' && <Repeat size={11} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Priority</label>
              <div className="mt-1.5 flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setDraft({ ...draft, priority: p.value })}
                    className={cn(
                      'chip transition border flex-1 justify-center',
                      draft.priority === p.value
                        ? `bg-gradient-to-tr ${p.tint} text-white border-transparent shadow`
                        : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
                    )}
                  >
                    {p.value === 'high' && <AlertTriangle size={11} />}
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={cancel}>
              <X size={16} /> Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              <Save size={16} /> Save reminder
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30 mb-3 animate-float">
            <BellRing size={24} />
          </div>
          <h3 className="text-lg font-semibold">No reminders yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first time-based nudge.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((r) => {
            const due = new Date(r.when);
            const isPast = due.getTime() < Date.now();
            return (
              <li
                key={r.id}
                onClick={() => toggleDone(r.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleDone(r.id);
                  }
                }}
                className={cn(
                  'card p-4 flex items-center gap-3 animate-slide-in cursor-pointer select-none active:scale-[0.99] transition-transform',
                  r.done && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'shrink-0 size-9 rounded-xl grid place-items-center transition border',
                    r.done
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white border-transparent shadow'
                      : 'border-slate-300 dark:border-white/15'
                  )}
                  aria-hidden="true"
                >
                  <Check size={18} className={cn('transition', r.done ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn('font-medium truncate', r.done && 'line-through')}>{r.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Clock size={12} />
                    <span className={cn(isPast && !r.done && 'text-rose-500 font-medium')}>
                      {due.toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isPast && !r.done && <span className="chip bg-rose-500/15 text-rose-600 dark:text-rose-400">Overdue</span>}
                    {r.repeat && r.repeat !== 'none' && (
                      <span className="chip bg-violet-500/15 text-violet-600 dark:text-violet-400">
                        <Repeat size={10} />
                        {labelForRepeat(r.repeat)}
                      </span>
                    )}
                    {r.priority === 'high' && (
                      <span className="chip bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <AlertTriangle size={10} /> High
                      </span>
                    )}
                    {r.priority === 'low' && (
                      <span className="chip bg-slate-500/15 text-slate-500">Low</span>
                    )}
                    {r.notes && (
                      <>
                        <span>•</span>
                        <span className="truncate">{r.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-ghost !px-3 !py-2" onClick={() => startEdit(r)} aria-label="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="btn-danger !px-3 !py-2" onClick={() => remove(r.id)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SmartInput({ onApply }) {
  const [text, setText] = useState('');
  const apply = () => {
    const t = text.trim();
    if (!t) return;
    onApply(t);
    setText('');
  };
  return (
    <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 p-3 mb-4">
      <label className="text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1.5">
        <Wand2 size={12} /> Smart input
      </label>
      <form
        className="flex gap-2 mt-1"
        onSubmit={(e) => { e.preventDefault(); apply(); }}
      >
        <input
          placeholder='Try "remind me to call mom tomorrow at 9"'
          className="input flex-1 text-sm"
          enterKeyHint="done"
          autoCapitalize="sentences"
          autoCorrect="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-primary !px-3 shrink-0"
          aria-label="Apply smart input"
        >
          <Wand2 size={14} /> Apply
        </button>
      </form>
      <p className="text-[10px] text-slate-400 mt-1.5">
        Tap <strong>Apply</strong> or hit <kbd className="px-1 py-0.5 rounded bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/10">Enter</kbd> · supports "in 30 min", "tomorrow at 9", "every monday at 7pm", etc.
      </p>
    </div>
  );
}
