import React, { useMemo } from 'react';
import { Clock4 } from 'lucide-react';
import { todayKey, dayTasksFor, isComplete } from '../lib/utils';

export default function OnThisDay({ tasks, completions, notes, reviews }) {
  const data = useMemo(() => {
    const today = new Date();
    const candidates = [];
    [1, 2, 3, 5].forEach((years) => {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - years);
      const k = todayKey(d);
      const c = completions[k];
      const r = reviews?.[k];
      const dayNotes = notes.filter((n) => {
        const created = new Date(n.createdAt);
        return created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth() &&
          created.getDate() === d.getDate();
      });
      if (c || r || dayNotes.length > 0) {
        const dayTasks = dayTasksFor(tasks, d);
        const completed = c ? dayTasks.filter((t) => isComplete(t, c[t.id])).length : 0;
        candidates.push({ years, date: d, completed, total: dayTasks.length, review: r, notes: dayNotes });
      }
    });
    return candidates[0] || null;
  }, [tasks, completions, notes, reviews]);

  if (!data) return null;

  return (
    <div className="card p-4 border border-amber-300/40 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pop-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 grid place-items-center text-white shadow">
          <Clock4 size={15} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
            On this day · {data.years} year{data.years > 1 ? 's' : ''} ago
          </div>
          <div className="text-sm font-semibold">
            {data.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {data.total > 0 && (
          <>You completed <strong>{data.completed} of {data.total}</strong> routines. </>
        )}
        {data.review?.highlight && (
          <>Highlight: <em>"{data.review.highlight}"</em>. </>
        )}
        {data.notes.length > 0 && (
          <>You wrote {data.notes.length} note{data.notes.length > 1 ? 's' : ''}.</>
        )}
      </div>
    </div>
  );
}
