import React, { useMemo, useRef, useState } from 'react';
import { Search, BookOpen, Calendar, Flame, Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { todayKey, addDays, dayTasksFor, isComplete, cn } from '../lib/utils';

// Date-keyed reviews are stored as { highlight, journal, mood?, at }. Mood is
// no longer captured here but legacy entries may still carry it — leave it
// untouched so old data round-trips through edits unchanged.
const blankDraft = { highlight: '', journal: '' };

// Walk back from today counting consecutive days with an entry. Stops on the
// first gap. Today is allowed to be empty (the streak still includes
// yesterday) so the count doesn't drop to 0 the moment midnight rolls over.
const computeJournalStreak = (reviews) => {
  const today = new Date();
  let count = 0;
  let cursor = reviews[todayKey(today)] ? today : addDays(today, -1);
  while (reviews[todayKey(cursor)]) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
};

const hasContent = (entry) => Boolean((entry?.highlight || '').trim() || (entry?.journal || '').trim());

const formatLongDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

export default function Journal({ reviews, setReviews, tasks, completions, flash }) {
  const [query, setQuery] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState(blankDraft);
  const editorRef = useRef(null);

  const tKey = todayKey(new Date());
  const todayEntry = reviews?.[tKey];

  const entries = useMemo(() => {
    return Object.entries(reviews || {})
      .filter(([, r]) => hasContent(r))
      .map(([k, r]) => ({ key: k, ...r }))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [reviews]);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        (e.highlight || '').toLowerCase().includes(q) ||
        (e.journal || '').toLowerCase().includes(q)
    );
  }, [entries, query]);

  const streak = useMemo(() => computeJournalStreak(reviews || {}), [reviews]);

  let streakHint;
  if (todayEntry) streakHint = 'Today logged — keep it going';
  else if (streak > 0) streakHint = 'Log today to extend';
  else streakHint = 'Start a streak today';

  // 90-day consistency grid — true = entry exists for that day.
  const grid = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 90 }, (_, i) => {
      const d = addDays(today, -(89 - i));
      const k = todayKey(d);
      return { key: k, has: hasContent(reviews?.[k]) };
    });
  }, [reviews]);

  const startEdit = (key) => {
    const e = reviews?.[key] || blankDraft;
    setEditingKey(key);
    setDraft({ highlight: e.highlight || '', journal: e.journal || '' });
    // Scroll the editor into view on next paint so the user sees what opened.
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(blankDraft);
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const trimmedHighlight = draft.highlight.trim();
    const trimmedJournal = draft.journal.trim();
    if (!trimmedHighlight && !trimmedJournal) {
      flash?.('Write a highlight or a reflection before saving', true);
      return;
    }
    setReviews((prev) => {
      const existing = prev?.[editingKey] || {};
      return {
        ...prev,
        [editingKey]: {
          ...existing,
          highlight: trimmedHighlight,
          journal: trimmedJournal,
          at: existing.at || Date.now(),
          editedAt: Date.now(),
        },
      };
    });
    flash?.(editingKey === tKey ? "Today's entry saved" : 'Entry updated');
    cancelEdit();
  };

  const remove = (key) => {
    setReviews((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (editingKey === key) cancelEdit();
    flash?.('Entry deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-slate-500 text-sm">Reflect daily — past entries are editable, search anytime.</p>
        </div>
        {!todayEntry && editingKey !== tKey && (
          <button className="btn-primary" onClick={() => startEdit(tKey)}>
            <Plus size={16} /> Today's entry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Entries</div>
            <div className="text-2xl font-bold tabular-nums">{entries.length}</div>
            <div className="text-xs text-slate-500">{entries.length === 1 ? 'day reflected' : 'days reflected'}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 grid place-items-center text-white shadow-lg shadow-rose-500/30">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Streak</div>
            <div className="text-2xl font-bold tabular-nums">{streak} <span className="text-base font-semibold text-slate-400">{streak === 1 ? 'day' : 'days'}</span></div>
            <div className="text-xs text-slate-500">{streakHint}</div>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Last 90 days</div>
          <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]">
            {grid.map((g) => (
              <div
                key={g.key}
                title={g.key + (g.has ? ' · entry' : '')}
                className={cn(
                  'aspect-square rounded-[3px]',
                  g.has
                    ? 'bg-gradient-to-tr from-violet-500 to-cyan-500'
                    : 'bg-slate-200/70 dark:bg-white/5'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reflections…"
          className="input !pl-9"
        />
      </div>

      {editingKey && (
        <div ref={editorRef} className="card p-5 animate-pop-in border-violet-400/30 dark:border-violet-500/30">
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <h3 className="font-bold">{formatLongDate(editingKey)}</h3>
            <span className="chip text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400">
              {editingKey === tKey ? 'today' : 'editing'}
            </span>
          </div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Highlight</label>
          <input
            autoFocus
            className="input mt-1"
            placeholder="One line — the standout moment"
            value={draft.highlight}
            onChange={(e) => setDraft((d) => ({ ...d, highlight: e.target.value }))}
          />
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mt-3 block">Reflection</label>
          <textarea
            rows={5}
            className="input mt-1"
            placeholder="What did you learn? What will you do differently tomorrow?"
            value={draft.journal}
            onChange={(e) => setDraft((d) => ({ ...d, journal: e.target.value }))}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              {draft.journal.trim() ? `${draft.journal.trim().split(/\s+/).length} words` : ''}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
              <button className="btn-primary" onClick={saveEdit}>
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30 mb-3 animate-float">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-semibold">{entries.length === 0 ? 'No reviews yet' : 'No matching entries'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {entries.length === 0
              ? 'Click "Today\'s entry" to write your first reflection.'
              : 'Try a different keyword.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((e) => {
            const d = new Date(e.key + 'T00:00:00');
            const dt = dayTasksFor(tasks, d);
            const c = completions[e.key] || {};
            const completed = dt.filter((t) => isComplete(t, c[t.id])).length;
            const isEditingThis = editingKey === e.key;
            return (
              <li
                key={e.key}
                className={cn('card p-5 animate-pop-in transition', isEditingThis && 'opacity-40 pointer-events-none')}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-bold">{formatLongDate(e.key)}</h3>
                  {dt.length > 0 && (
                    <span className="chip text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400">
                      <Calendar size={10} /> {completed}/{dt.length} routines
                    </span>
                  )}
                  {e.editedAt && (
                    <span className="text-[10px] text-slate-400">edited</span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      className="size-8 rounded-lg hover:bg-violet-500/10 grid place-items-center text-slate-400 hover:text-violet-600 transition"
                      onClick={() => startEdit(e.key)}
                      aria-label="Edit entry"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="size-8 rounded-lg hover:bg-rose-500/10 grid place-items-center text-slate-400 hover:text-rose-600 transition"
                      onClick={() => remove(e.key)}
                      aria-label="Delete entry"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
