import React, { useMemo, useState } from 'react';
import { Search, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { todayKey, addDays, dayTasksFor, isComplete, cn } from '../lib/utils';

const MOODS = ['😞', '😕', '😐', '🙂', '🤩'];
const MOOD_LABELS = ['Rough', 'Meh', 'Okay', 'Good', 'Great'];

export default function Journal({ reviews, tasks, completions }) {
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState(null);

  const entries = useMemo(() => {
    return Object.entries(reviews || {})
      .map(([k, r]) => ({ key: k, ...r }))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = entries;
    if (moodFilter != null) list = list.filter((e) => e.mood === moodFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          (e.highlight || '').toLowerCase().includes(q) ||
          (e.journal || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, query, moodFilter]);

  const trend = useMemo(() => {
    const today = new Date();
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(today, -(days - 1 - i));
      const k = todayKey(d);
      const r = reviews?.[k];
      return { date: d, key: k, mood: r ? r.mood : null };
    });
  }, [reviews]);

  const avgMood =
    entries.length > 0
      ? entries.reduce((s, e) => s + (e.mood || 0), 0) / entries.length
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Journal</h1>
        <p className="text-slate-500 text-sm">Browse every end-of-day review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Entries</div>
            <div className="text-2xl font-bold tabular-nums">{entries.length}</div>
            <div className="text-xs text-slate-500">days reflected</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="text-4xl">{avgMood ? MOODS[Math.round(avgMood) - 1] : '—'}</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Average mood</div>
            <div className="text-2xl font-bold tabular-nums">{avgMood ? avgMood.toFixed(1) : '—'}</div>
            <div className="text-xs text-slate-500">of 5</div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <TrendingUp size={12} /> 30-day mood
            </div>
          </div>
          <div className="flex items-end gap-0.5 h-12">
            {trend.map((t) => (
              <div key={t.key} className="flex-1 flex items-end" title={`${t.key}${t.mood ? ' · ' + MOOD_LABELS[t.mood - 1] : ''}`}>
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-violet-500 to-cyan-400"
                  style={{ height: t.mood ? `${(t.mood / 5) * 100}%` : '4px', opacity: t.mood ? 1 : 0.15 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reflections…"
            className="input !pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setMoodFilter(null)}
            className={cn(
              'chip transition border',
              moodFilter == null
                ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent'
                : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
            )}
          >
            All
          </button>
          {MOODS.map((e, i) => (
            <button
              key={i}
              onClick={() => setMoodFilter(moodFilter === i + 1 ? null : i + 1)}
              className={cn(
                'chip transition border text-base',
                moodFilter === i + 1
                  ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent scale-110'
                  : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
              )}
              title={MOOD_LABELS[i]}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30 mb-3 animate-float">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-semibold">{entries.length === 0 ? 'No reviews yet' : 'No matching entries'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {entries.length === 0
              ? 'Your end-of-day reviews will appear here once you log them.'
              : 'Try a different keyword or mood filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => {
            const d = new Date(e.key + 'T00:00:00');
            const dt = dayTasksFor(tasks, d);
            const c = completions[e.key] || {};
            const completed = dt.filter((t) => isComplete(t, c[t.id])).length;
            return (
              <li key={e.key} className="card p-5 animate-pop-in">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{MOODS[(e.mood || 3) - 1]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-bold">
                        {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h3>
                      <span className="text-xs text-slate-500">{MOOD_LABELS[(e.mood || 3) - 1]}</span>
                      {dt.length > 0 && (
                        <span className="chip text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400">
                          <Calendar size={10} /> {completed}/{dt.length} routines
                        </span>
                      )}
                    </div>
                    {e.highlight && (
                      <div className="mt-2 text-sm">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-2">Highlight</span>
                        {e.highlight}
                      </div>
                    )}
                    {e.journal && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {e.journal}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
