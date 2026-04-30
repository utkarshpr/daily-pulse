import React, { useMemo, useRef, useState } from 'react';
import { Check, Flame, Sparkles, ChevronLeft, ChevronRight, Calendar, Plus, Minus, Snowflake, MoreHorizontal, StickyNote, Pause, Play } from 'lucide-react';
import { todayKey, formatLong, addDays, sameDay, colorFor, cn, isComplete, isQuant, getCount, dayTasksFor, computeStreak } from '../lib/utils';
import ProgressRing from './ProgressRing';
import { celebrate } from '../lib/celebrate';
import { useSwipe } from '../hooks/useSwipe';
import RoutineMenu from './RoutineMenu';
import Ticker from './Ticker';

export default function Today({ tasks, completions, setCompletions, viewDate, setViewDate, freezes, setFreezes, skips, setSkips, routineNotes, setRoutineNotes }) {
  const key = todayKey(viewDate);
  const done = completions[key] || {};
  const skipped = skips?.[key] || {};
  const isFrozen = freezes.includes(key);
  const [menuTask, setMenuTask] = useState(null);

  const visible = useMemo(() => dayTasksFor(tasks, viewDate), [tasks, viewDate]);
  const required = useMemo(() => visible.filter((t) => !skipped[t.id]), [visible, skipped]);

  const completedCount = required.filter((t) => isComplete(t, done[t.id])).length;
  const skippedCount = visible.length - required.length;
  const progress = required.length ? completedCount / required.length : (visible.length === 0 ? 0 : 1);

  const celebratedRef = useRef(false);

  const checkAllDone = (day) => {
    if (!sameDay(viewDate, new Date()) || visible.length === 0) return;
    const required = visible.filter((t) => !skipped[t.id]);
    if (required.length === 0) return;
    const allDone = required.every((t) => isComplete(t, day[t.id]));
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      celebrate();
      setTimeout(() => { celebratedRef.current = false; }, 3000);
    }
  };

  const toggle = (id) => {
    if (skipped[id]) return;
    setCompletions((prev) => {
      const day = { ...(prev[key] || {}) };
      const task = tasks.find((t) => t.id === id);
      if (isQuant(task)) {
        const cur = getCount(day[id]);
        const target = task.goalCount;
        const next = cur >= target ? 0 : cur + 1;
        if (next === 0) delete day[id]; else day[id] = next;
      } else {
        const wasDone = !!day[id];
        if (wasDone) delete day[id];
        else day[id] = new Date().toISOString();
      }
      const result = { ...prev, [key]: day };
      checkAllDone(day);
      return result;
    });
  };

  const adjustCount = (id, delta) => {
    setCompletions((prev) => {
      const day = { ...(prev[key] || {}) };
      const cur = getCount(day[id]);
      const next = Math.max(0, cur + delta);
      if (next === 0) delete day[id]; else day[id] = next;
      const result = { ...prev, [key]: day };
      checkAllDone(day);
      return result;
    });
  };

  const toggleSkip = (id) => {
    setSkips((prev) => {
      const day = { ...(prev[key] || {}) };
      if (day[id]) delete day[id];
      else day[id] = true;
      return { ...prev, [key]: day };
    });
  };

  const toggleFreeze = () => {
    setFreezes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const saveRoutineNote = (id, text) => {
    setRoutineNotes((prev) => {
      const day = { ...(prev[key] || {}) };
      if (text?.trim()) day[id] = text.trim();
      else delete day[id];
      const next = { ...prev };
      if (Object.keys(day).length === 0) delete next[key];
      else next[key] = day;
      return next;
    });
  };

  const streak = useMemo(() => computeStreak(tasks, completions, freezes, skips), [tasks, completions, freezes, skips]);

  const isToday = sameDay(viewDate, new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <Sparkles size={14} className="text-violet-500" />
            {isToday ? 'Today' : 'Viewing'}
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent break-words animate-gradient"
            style={{ backgroundSize: '200% 200%' }}
          >
            {formatLong(viewDate)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setViewDate(addDays(viewDate, -1))} aria-label="Previous day">
            <ChevronLeft size={16} />
          </button>
          <button className="btn-ghost" onClick={() => setViewDate(new Date())} aria-label="Jump to today">
            <Calendar size={16} /> Today
          </button>
          <button className="btn-ghost" onClick={() => setViewDate(addDays(viewDate, 1))} aria-label="Next day">
            <ChevronRight size={16} />
          </button>
          <button
            className={cn(
              'btn-ghost',
              isFrozen && 'text-cyan-600 bg-cyan-500/15'
            )}
            onClick={toggleFreeze}
            title={isFrozen ? 'Day frozen — streak preserved' : 'Freeze this day (vacation / sick)'}
          >
            <Snowflake size={16} />
            {isFrozen ? 'Frozen' : 'Freeze'}
          </button>
        </div>
      </div>

      {isFrozen && (
        <div className="rounded-2xl border-2 border-dashed border-cyan-400/50 bg-cyan-500/5 p-4 text-sm text-cyan-700 dark:text-cyan-300 flex items-center gap-3 animate-pop-in">
          <Snowflake size={18} />
          <div>
            <strong>This day is frozen.</strong> Routines won't break your streak. Click <em>Frozen</em> again to unfreeze.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <ProgressRing value={progress} label="done" />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Routines</div>
            <div className="text-2xl font-bold tabular-nums">
              <Ticker value={completedCount} /><span className="text-slate-400">/{required.length || 0}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {visible.length === 0
                ? 'No routines for this day'
                : skippedCount > 0
                  ? `${skippedCount} skipped today`
                  : 'Keep the rhythm going'}
            </div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 grid place-items-center text-white shadow-lg shadow-rose-500/30">
            <Flame size={28} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Current streak</div>
            <div className="text-2xl font-bold tabular-nums"><Ticker value={streak} /> {streak === 1 ? 'day' : 'days'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Skips & freezes don't break it</div>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">This week</div>
          <WeekDots tasks={tasks} completions={completions} freezes={freezes} skips={skips} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-2 sm:p-4">
          <EmptyState />
        </div>
      ) : (
        <RoutineGroups
          visible={visible}
          done={done}
          skipped={skipped}
          notes={routineNotes[key] || {}}
          toggle={toggle}
          adjustCount={adjustCount}
          openMenu={(t) => setMenuTask(t)}
          isFrozen={isFrozen}
        />
      )}

      <RoutineMenu
        open={!!menuTask}
        onClose={() => setMenuTask(null)}
        taskName={menuTask?.name}
        isSkipped={!!menuTask && !!skipped[menuTask.id]}
        note={menuTask ? (routineNotes[key]?.[menuTask.id] || '') : ''}
        onToggleSkip={() => menuTask && toggleSkip(menuTask.id)}
        onSaveNote={(text) => menuTask && saveRoutineNote(menuTask.id, text)}
      />
    </div>
  );
}

function RoutineGroups({ visible, done, skipped, notes, toggle, adjustCount, openMenu, isFrozen }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of visible) {
      const key = (t.category || '').trim() || '__none__';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <div className="space-y-4">
      {grouped.map(([cat, items]) => (
        <div className="card p-2 sm:p-4" key={cat}>
          {cat !== '__none__' && (
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 px-3 pt-1.5 pb-1 font-semibold">
              {cat}
            </div>
          )}
          <ul className="divide-y divide-slate-200/70 dark:divide-white/5">
            {items.map((t) => (
              <RoutineRow
                key={t.id}
                task={t}
                value={done[t.id]}
                isSkipped={!!skipped[t.id]}
                note={notes[t.id]}
                onToggle={() => toggle(t.id)}
                onAdjust={(delta) => adjustCount(t.id, delta)}
                onMenu={() => openMenu(t)}
                muted={isFrozen}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RoutineRow({ task, value, isSkipped, note, onToggle, onAdjust, onMenu, muted }) {
  const c = colorFor(task.color);
  const quant = isQuant(task);
  const checked = isComplete(task, value);
  const count = getCount(value);
  const target = task.goalCount || 0;
  const swipe = useSwipe({ onSwipeRight: onToggle, onSwipeLeft: onToggle, threshold: 70 });
  const pct = target ? Math.min(1, count / target) : checked ? 1 : 0;

  // long-press: opens menu after 500ms; click is suppressed when long-press fired
  const longPressRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startPress = () => {
    longPressFiredRef.current = false;
    longPressRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onMenu();
    }, 500);
  };
  const cancelPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };

  const handleRowClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (isSkipped) return;
    if (quant) onAdjust(+1); // tap row in quant mode adds 1
    else onToggle();
  };

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={cn(
        'group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition select-none cursor-pointer active:scale-[0.99] bg-gradient-to-r border',
        c.tintFrom,
        c.tintTo,
        c.border,
        (checked || isSkipped) && 'opacity-70',
        muted && 'opacity-60'
      )}
      {...swipe}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={(e) => { swipe.onTouchStart(e); startPress(); }}
      onTouchEnd={(e) => { swipe.onTouchEnd(e); cancelPress(); }}
    >
      <div
        className={cn(
          'shrink-0 size-9 rounded-xl grid place-items-center transition-all border relative overflow-visible mt-0.5',
          checked
            ? `bg-gradient-to-tr ${c.from} ${c.to} text-white border-transparent shadow-md`
            : isSkipped
              ? 'border-slate-300 dark:border-white/15 bg-slate-200/50 dark:bg-white/5'
              : 'border-slate-300 dark:border-white/15'
        )}
        aria-hidden="true"
      >
        {checked && <span className={cn('absolute inset-0 rounded-xl bg-gradient-to-tr', c.from, c.to, 'animate-ripple')} />}
        <Check
          size={18}
          className={cn('relative transition', checked ? 'opacity-100 animate-check-pop' : 'opacity-0 scale-75')}
          strokeWidth={3}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn('font-medium truncate', checked && 'line-through decoration-2')}>
            {task.icon && <span className="mr-2">{task.icon}</span>}
            {task.name}
          </div>
          {isSkipped && (
            <span className="chip text-[10px] bg-slate-500/15 text-slate-500">
              <Pause size={9} /> Skipped
            </span>
          )}
        </div>
        {quant ? (
          <div className="mt-1.5">
            <div className="h-1.5 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
              <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', c.from, c.to)} style={{ width: `${pct * 100}%` }} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              {count} / {target}{task.unit ? ` ${task.unit}` : ''}
            </div>
          </div>
        ) : (
          task.description && <div className="text-sm text-slate-500 truncate">{task.description}</div>
        )}
        {note && (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-violet-600 dark:text-violet-400 italic">
            <StickyNote size={11} className="shrink-0 mt-0.5" />
            <span className="break-words">{note}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {quant ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onAdjust(-1); }}
              className="size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 grid place-items-center hover:bg-white dark:hover:bg-white/10 transition active:scale-90"
              disabled={count <= 0 || isSkipped}
              aria-label="Decrement"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 text-center text-sm font-bold tabular-nums">{count}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onAdjust(+1); }}
              disabled={isSkipped}
              className={cn(
                'size-8 rounded-lg grid place-items-center transition active:scale-90 text-white shadow',
                `bg-gradient-to-tr ${c.from} ${c.to}`
              )}
              aria-label="Increment"
            >
              <Plus size={14} />
            </button>
          </>
        ) : (
          task.time && (
            <span className={cn('chip', `bg-gradient-to-tr ${c.from} ${c.to} text-white`)}>
              {task.time}
            </span>
          )
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onMenu(); }}
          className="size-8 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 grid place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition opacity-0 group-hover:opacity-100"
          aria-label="More actions"
          title="Note / skip"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </li>
  );
}

function WeekDots({ tasks, completions, freezes, skips }) {
  const today = new Date();
  const start = addDays(today, -6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="flex items-end justify-between gap-1.5">
      {days.map((d) => {
        const k = todayKey(d);
        const dayTasks = dayTasksFor(tasks, d);
        const c = completions[k] || {};
        const s = skips?.[k] || {};
        const required = dayTasks.filter((t) => !s[t.id]);
        const completed = required.filter((t) => isComplete(t, c[t.id])).length;
        const total = required.length || 1;
        const pct = required.length ? completed / total : 0;
        const h = 8 + Math.round(pct * 40);
        const isToday = sameDay(d, today);
        const frozen = freezes.includes(k);
        return (
          <div key={k} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="h-12 flex items-end">
              <div
                className={cn(
                  'w-3.5 rounded-md transition-all',
                  frozen ? 'bg-gradient-to-t from-cyan-500 to-sky-400' : 'bg-gradient-to-t from-violet-500 to-cyan-400'
                )}
                style={{ height: `${frozen ? 30 : h}px`, opacity: frozen || pct > 0 ? 1 : 0.25 }}
              />
            </div>
            <div className={cn('text-[10px] font-medium', isToday ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500')}>
              {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-14">
      <div className="mx-auto size-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white mb-4 shadow-lg shadow-violet-500/30 animate-float">
        <Sparkles size={28} />
      </div>
      <h3 className="text-lg font-semibold">No routines yet for this day</h3>
      <p className="text-sm text-slate-500 mt-1">
        Head to the <strong>Routines</strong> tab to add your first daily habit.
      </p>
    </div>
  );
}
