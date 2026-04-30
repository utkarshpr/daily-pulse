import React, { useMemo } from 'react';
import { TrendingUp, X, Trophy, Calendar, Flame } from 'lucide-react';
import { todayKey, addDays, dayTasksFor, isComplete, cn } from '../lib/utils';

const STORAGE_KEY = 'dp.weeklyDismissed.v1';

export default function WeeklySummary({ tasks, completions, notes, reviews, dismissed, setDismissed }) {
  const today = new Date();
  const dow = today.getDay();
  // show Sunday-Tuesday only (recap the week that just ended)
  const showWindow = dow === 0 || dow === 1 || dow === 2;
  const weekKey = todayKey(addDays(today, -7));

  const summary = useMemo(() => {
    let possible = 0;
    let done = 0;
    const dayDetails = [];
    let bestRoutine = null;
    const perRoutine = new Map();
    for (let i = 7; i >= 1; i--) {
      const d = addDays(today, -i);
      const k = todayKey(d);
      const dayTasks = dayTasksFor(tasks, d);
      const c = completions[k] || {};
      let dayDone = 0;
      for (const t of dayTasks) {
        possible += 1;
        const ok = isComplete(t, c[t.id]);
        if (ok) {
          done += 1;
          dayDone += 1;
          perRoutine.set(t.id, (perRoutine.get(t.id) || 0) + 1);
        }
      }
      dayDetails.push({ key: k, date: d, done: dayDone, total: dayTasks.length });
    }
    let max = 0;
    for (const [id, n] of perRoutine.entries()) {
      if (n > max) {
        max = n;
        bestRoutine = tasks.find((t) => t.id === id);
      }
    }
    const noteCount = notes.filter((n) => {
      const t = new Date(n.createdAt);
      return t >= addDays(today, -7) && t < today;
    }).length;
    const reviewCount = Object.keys(reviews || {}).filter((k) => {
      const d = new Date(k + 'T00:00:00');
      return d >= addDays(today, -7) && d < today;
    }).length;
    return { possible, done, dayDetails, bestRoutine, bestRoutineCount: max, noteCount, reviewCount };
  }, [tasks, completions, notes, reviews]);

  if (!showWindow) return null;
  if (dismissed === weekKey) return null;
  if (summary.possible === 0) return null;

  const rate = summary.possible ? summary.done / summary.possible : 0;

  return (
    <div className="card p-5 relative overflow-hidden border-2 border-violet-300/30 dark:border-violet-500/30 animate-pop-in">
      <div className="absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-tr from-violet-500/30 to-cyan-500/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">Weekly recap</div>
              <h3 className="text-lg font-bold">Last 7 days</h3>
            </div>
          </div>
          <button
            onClick={() => setDismissed(weekKey)}
            className="size-7 rounded-md hover:bg-white/60 dark:hover:bg-white/10 grid place-items-center text-slate-400"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Mini icon={<Trophy size={14} />} label="Completion" value={`${Math.round(rate * 100)}%`} />
          <Mini icon={<Flame size={14} />} label="Routine checks" value={`${summary.done}/${summary.possible}`} />
          <Mini icon={<Calendar size={14} />} label="Notes" value={summary.noteCount} />
          <Mini icon={<TrendingUp size={14} />} label="Reviews" value={summary.reviewCount} />
        </div>

        {summary.bestRoutine && (
          <div className="mt-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 p-3 text-sm">
            <span className="text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold mr-2">Strongest habit</span>
            {summary.bestRoutine.icon} {summary.bestRoutine.name} · {summary.bestRoutineCount}/7 days
          </div>
        )}

        <div className="mt-4 flex items-end gap-1.5 h-12">
          {summary.dayDetails.map((d) => {
            const pct = d.total ? d.done / d.total : 0;
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-violet-500 to-cyan-400 transition-all"
                    style={{ height: `${4 + pct * 80}%`, opacity: pct > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">{d.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Mini({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
