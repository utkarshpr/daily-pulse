import React, { useMemo } from 'react';
import { todayKey, addDays, cn, isComplete } from '../lib/utils';
import { TrendingUp, Trophy, CalendarDays, Target } from 'lucide-react';
import BadgeShelf from './BadgeShelf';
import Insights from './Insights';

export default function Stats({ tasks, completions, badgeStates = [], reviews = {} }) {
  const data = useMemo(() => {
    const days = 84; // 12 weeks
    const today = new Date();
    const arr = [];
    let totalDone = 0;
    let totalPossible = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const k = todayKey(d);
      const dow = d.getDay();
      const dayTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(dow));
      const c = completions[k] || {};
      const done = dayTasks.filter((t) => isComplete(t, c[t.id])).length;
      arr.push({ date: d, key: k, done, total: dayTasks.length });
      totalDone += done;
      totalPossible += dayTasks.length;
    }
    return { arr, totalDone, totalPossible };
  }, [tasks, completions]);

  const completionRate = data.totalPossible ? data.totalDone / data.totalPossible : 0;

  const perTask = useMemo(() => {
    return tasks.map((t) => {
      let done = 0;
      let possible = 0;
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = addDays(today, -i);
        const dow = d.getDay();
        if (t.days && t.days.length > 0 && !t.days.includes(dow)) continue;
        possible += 1;
        const c = completions[todayKey(d)] || {};
        if (isComplete(t, c[t.id])) done += 1;
      }
      return { task: t, done, possible, rate: possible ? done / possible : 0 };
    });
  }, [tasks, completions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Your progress</h1>
        <p className="text-slate-500 text-sm">A long-term view of your routines.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={20} />} label="Last 12 weeks" value={`${Math.round(completionRate * 100)}%`} sub="overall completion" gradient="from-violet-500 to-fuchsia-500" />
        <StatCard icon={<Trophy size={20} />} label="Total checks" value={data.totalDone} sub="across all routines" gradient="from-amber-500 to-orange-500" />
        <StatCard icon={<CalendarDays size={20} />} label="Active routines" value={tasks.length} sub="configured" gradient="from-cyan-500 to-sky-500" />
        <StatCard icon={<Target size={20} />} label="Possible checks" value={data.totalPossible} sub="last 12 weeks" gradient="from-emerald-500 to-teal-500" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Activity heatmap</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            Less
            <div className="flex gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div key={i} className="size-3 rounded-sm" style={{ background: heatColor(v) }} />
              ))}
            </div>
            More
          </div>
        </div>
        <Heatmap arr={data.arr} />
      </div>

      <BadgeShelf badges={badgeStates} />

      <Insights tasks={tasks} completions={completions} reviews={reviews} />

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Routine breakdown · last 30 days</h2>
        {perTask.length === 0 ? (
          <p className="text-sm text-slate-500">Add routines to see breakdown.</p>
        ) : (
          <ul className="space-y-3">
            {perTask.map(({ task, done, possible, rate }) => (
              <li key={task.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">
                    <span className="mr-2">{task.icon || '✨'}</span>
                    {task.name}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">
                    {done}/{possible} · <span className="font-bold text-slate-700 dark:text-slate-200">{Math.round(rate * 100)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                    style={{ width: `${rate * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient }) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={cn('absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-tr opacity-20 blur-2xl', gradient)} />
      <div className={cn('size-10 rounded-xl bg-gradient-to-tr text-white grid place-items-center shadow', gradient)}>
        {icon}
      </div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mt-3">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function heatColor(v) {
  if (v <= 0) return 'rgba(148,163,184,0.18)';
  // interpolate violet -> cyan
  const a = [139, 92, 246]; // violet
  const b = [6, 182, 212]; // cyan
  const mix = a.map((x, i) => Math.round(x + (b[i] - x) * v));
  return `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${0.25 + 0.7 * v})`;
}

function Heatmap({ arr }) {
  // group by week column
  const weeks = [];
  let week = [];
  arr.forEach((d, i) => {
    if (i === 0) {
      const dow = d.date.getDay();
      for (let j = 0; j < dow; j++) week.push(null);
    }
    week.push(d);
    if (d.date.getDay() === 6) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto scroll-area pb-1">
      <div className="flex gap-1 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((d, di) => {
              if (!d) return <div key={di} className="size-3.5" />;
              const v = d.total ? d.done / d.total : 0;
              return (
                <div
                  key={di}
                  title={`${d.key}: ${d.done}/${d.total}`}
                  className="size-3.5 rounded-sm transition-all hover:scale-125"
                  style={{ background: heatColor(v) }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
