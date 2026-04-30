import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, StickyNote, Bell, Check } from 'lucide-react';
import { todayKey, sameDay, addDays, cn, isComplete } from '../lib/utils';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['S','M','T','W','T','F','S'];

export default function CalendarView({ tasks, completions, notes, reminders, onJumpToDay, setActive }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState(new Date());

  const grid = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1);
    const startDow = start.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (days.length % 7) days.push(null);
    return days;
  }, [cursor]);

  const dayMeta = (d) => {
    if (!d) return null;
    const k = todayKey(d);
    const dow = d.getDay();
    const dayTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(dow));
    const c = completions[k] || {};
    const completed = dayTasks.filter((t) => isComplete(t, c[t.id])).length;
    const noteCount = notes.filter((n) => sameDay(new Date(n.createdAt), d)).length;
    const reminderCount = reminders.filter((r) => sameDay(new Date(r.when), d)).length;
    const pct = dayTasks.length ? completed / dayTasks.length : 0;
    return { k, completed, total: dayTasks.length, pct, noteCount, reminderCount };
  };

  const selectedMeta = dayMeta(selected);
  const selectedNotes = notes.filter((n) => sameDay(new Date(n.createdAt), selected));
  const selectedReminders = reminders.filter((r) => sameDay(new Date(r.when), selected));
  const selectedTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(selected.getDay()));
  const selectedCompletions = completions[todayKey(selected)] || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-slate-500 text-sm">Month view of your routines, notes, and reminders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() - 1);
              setCursor(d);
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-semibold tabular-nums min-w-[160px] text-center">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() + 1);
              setCursor(d);
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              const t = new Date();
              setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
              setSelected(t);
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="card p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DOW.map((d, i) => (
            <div key={i} className="text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, idx) => {
            if (!d) return <div key={idx} className="aspect-square" />;
            const m = dayMeta(d);
            const isToday = sameDay(d, new Date());
            const isSelected = sameDay(d, selected);
            return (
              <button
                key={idx}
                onClick={() => setSelected(d)}
                className={cn(
                  'aspect-square rounded-lg p-1.5 sm:p-2 flex flex-col items-stretch text-left transition relative overflow-hidden border',
                  isSelected
                    ? 'border-violet-500 ring-2 ring-violet-500/40'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-white/10',
                  isToday && 'bg-violet-500/5'
                )}
              >
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: heatColor(m.pct), opacity: m.total ? 1 : 0 }}
                />
                <span className="relative flex items-center justify-between">
                  <span className={cn('text-[11px] sm:text-sm font-semibold tabular-nums', isToday && 'text-violet-600 dark:text-violet-400')}>
                    {d.getDate()}
                  </span>
                  {m.total > 0 && m.completed === m.total && (
                    <span className="size-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center text-white">
                      <Check size={9} strokeWidth={4} />
                    </span>
                  )}
                </span>
                <span className="relative flex-1" />
                <span className="relative flex items-center gap-1 text-[9px] text-slate-500">
                  {m.noteCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <StickyNote size={9} /> {m.noteCount}
                    </span>
                  )}
                  {m.reminderCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Bell size={9} /> {m.reminderCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {sameDay(selected, new Date()) ? 'Today' : 'Selected'}
            </div>
            <h2 className="text-xl font-bold">
              {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              onJumpToDay?.(selected);
              setActive?.('today');
            }}
          >
            <CalendarDays size={14} /> Open day
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Routines</h3>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-slate-400">None scheduled</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedTasks.map((t) => (
                  <li key={t.id} className="text-sm flex items-center gap-2">
                    <span
                      className={cn(
                        'size-4 rounded grid place-items-center',
                        isComplete(t, selectedCompletions[t.id]) ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white' : 'border border-slate-300 dark:border-white/15'
                      )}
                    >
                      {isComplete(t, selectedCompletions[t.id]) && <Check size={10} strokeWidth={4} />}
                    </span>
                    <span className={cn('truncate', isComplete(t, selectedCompletions[t.id]) && 'line-through text-slate-400')}>
                      {t.icon} {t.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Notes ({selectedNotes.length})</h3>
            {selectedNotes.length === 0 ? (
              <p className="text-sm text-slate-400">No notes from this day</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedNotes.map((n) => (
                  <li key={n.id} className="text-sm truncate">• {n.title || n.body.slice(0, 40)}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Reminders ({selectedReminders.length})</h3>
            {selectedReminders.length === 0 ? (
              <p className="text-sm text-slate-400">No reminders</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedReminders.map((r) => (
                  <li key={r.id} className="text-sm truncate">
                    {new Date(r.when).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} — {r.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function heatColor(v) {
  if (v <= 0) return 'transparent';
  const a = [139, 92, 246];
  const b = [6, 182, 212];
  const mix = a.map((x, i) => Math.round(x + (b[i] - x) * v));
  return `linear-gradient(135deg, rgba(${mix[0]},${mix[1]},${mix[2]},${0.15 + 0.45 * v}), rgba(${mix[0]},${mix[1]},${mix[2]},${0.05 + 0.2 * v}))`;
}
