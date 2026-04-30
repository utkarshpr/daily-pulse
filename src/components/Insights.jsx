import React, { useMemo } from 'react';
import { Sparkles, BarChart3 } from 'lucide-react';
import { todayKey, dayTasksFor, isComplete, cn } from '../lib/utils';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Insights({ tasks, completions, reviews }) {
  const moodCorr = useMemo(() => {
    // Pair (completion%, mood) for each day in reviews
    const pairs = [];
    for (const [k, r] of Object.entries(reviews || {})) {
      if (!r.mood) continue;
      const d = new Date(k + 'T00:00:00');
      const dayTasks = dayTasksFor(tasks, d);
      if (dayTasks.length === 0) continue;
      const c = completions[k] || {};
      const done = dayTasks.filter((t) => isComplete(t, c[t.id])).length;
      const rate = done / dayTasks.length;
      pairs.push({ rate, mood: r.mood });
    }
    if (pairs.length < 3) return { pairs, hint: 'Need at least 3 daily reviews to surface patterns.' };

    // average mood per completion bucket
    const buckets = [
      { label: 'Low (0-33%)', min: 0, max: 0.34, moods: [] },
      { label: 'Mid (34-66%)', min: 0.34, max: 0.67, moods: [] },
      { label: 'High (67-100%)', min: 0.67, max: 1.01, moods: [] },
    ];
    for (const p of pairs) {
      for (const b of buckets) {
        if (p.rate >= b.min && p.rate < b.max) b.moods.push(p.mood);
      }
    }
    return { pairs, buckets };
  }, [tasks, completions, reviews]);

  const dowAnalysis = useMemo(() => {
    // For each routine, compute completion rate per day-of-week
    return tasks.map((t) => {
      const counts = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
      for (const [k, c] of Object.entries(completions)) {
        const d = new Date(k + 'T00:00:00');
        const dow = d.getDay();
        if (t.days && t.days.length > 0 && !t.days.includes(dow)) continue;
        counts[dow].total += 1;
        if (isComplete(t, c[t.id])) counts[dow].done += 1;
      }
      const rates = counts.map((x, i) => ({ dow: i, rate: x.total ? x.done / x.total : null, total: x.total }));
      const valid = rates.filter((r) => r.rate != null && r.total >= 2);
      if (valid.length === 0) return { task: t, rates, best: null, worst: null };
      const best = valid.reduce((a, b) => (b.rate > a.rate ? b : a));
      const worst = valid.reduce((a, b) => (b.rate < a.rate ? b : a));
      return { task: t, rates, best, worst };
    });
  }, [tasks, completions]);

  const hasMoodData = moodCorr.pairs && moodCorr.pairs.length >= 3;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="font-semibold">Mood × completion</h2>
        </div>
        {!hasMoodData ? (
          <p className="text-sm text-slate-500">{moodCorr.hint}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {moodCorr.buckets.map((b) => {
              const avg = b.moods.length ? b.moods.reduce((s, m) => s + m, 0) / b.moods.length : null;
              return (
                <div key={b.label} className="rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{b.label}</div>
                  <div className="text-3xl mt-1">{avg ? ['😞','😕','😐','🙂','🤩'][Math.round(avg) - 1] : '—'}</div>
                  <div className="text-xs font-semibold tabular-nums mt-1">{avg ? avg.toFixed(2) : '—'}</div>
                  <div className="text-[10px] text-slate-400">{b.moods.length} day{b.moods.length === 1 ? '' : 's'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-cyan-500" />
          <h2 className="font-semibold">Best day-of-week per routine</h2>
        </div>
        {dowAnalysis.length === 0 ? (
          <p className="text-sm text-slate-500">Add routines to see day-of-week patterns.</p>
        ) : (
          <ul className="space-y-3">
            {dowAnalysis.map(({ task, rates, best, worst }) => (
              <li key={task.id} className="rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-medium text-sm truncate">{task.icon} {task.name}</div>
                  {best && worst && best.dow !== worst.dow && (
                    <div className="text-[11px] text-slate-500">
                      <span className="text-emerald-600 dark:text-emerald-400">{DOW_LABELS[best.dow]} {Math.round(best.rate * 100)}%</span>
                      {' · '}
                      <span className="text-rose-500">{DOW_LABELS[worst.dow]} {Math.round(worst.rate * 100)}%</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-end gap-1 h-10">
                  {rates.map((r) => (
                    <div key={r.dow} className="flex-1 flex flex-col items-center gap-0.5" title={`${DOW_LABELS[r.dow]} · ${r.rate != null ? Math.round(r.rate * 100) + '%' : 'no data'}`}>
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className={cn(
                            'w-full rounded-sm bg-gradient-to-t transition-all',
                            r.dow === best?.dow ? 'from-emerald-500 to-teal-400' :
                            r.dow === worst?.dow ? 'from-rose-500 to-pink-400' : 'from-violet-500 to-cyan-400'
                          )}
                          style={{ height: r.rate != null ? `${Math.max(8, r.rate * 100)}%` : '4px', opacity: r.rate != null ? 1 : 0.2 }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-500">{DOW_LABELS[r.dow][0]}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
