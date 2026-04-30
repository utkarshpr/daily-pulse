import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Target, Trophy, Calendar, Lightbulb } from 'lucide-react';
import { uid, todayKey, addDays, cn } from '../lib/utils';
import { suggestHabits as findHabitGroup } from '../lib/habitSuggestions';

const suggestHabits = (text) => {
  const group = findHabitGroup(text);
  return group ? group.suggestions : null;
};

const EMPTY = { title: '', description: '', target: '', linkedTaskIds: [] };

export default function GoalsView({ goals, setGoals, tasks, setTasks, completions, confirm, flash }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);

  const startNew = () => {
    setEditing('new');
    setDraft(EMPTY);
  };

  const startEdit = (g) => {
    setEditing(g.id);
    setDraft({
      title: g.title,
      description: g.description || '',
      target: g.target || '',
      linkedTaskIds: g.linkedTaskIds || [],
    });
  };

  const cancel = () => {
    setEditing(null);
    setDraft(EMPTY);
  };

  const save = () => {
    if (!draft.title.trim()) {
      flash?.('Goal title is required', true);
      return;
    }
    if (editing === 'new') {
      setGoals((prev) => [
        ...prev,
        { id: uid(), createdAt: Date.now(), ...draft, title: draft.title.trim() },
      ]);
      flash?.('Goal created');
    } else {
      setGoals((prev) => prev.map((g) => (g.id === editing ? { ...g, ...draft, title: draft.title.trim() } : g)));
      flash?.('Goal updated');
    }
    cancel();
  };

  const remove = async (id) => {
    const ok = await confirm?.({
      title: 'Delete this goal?',
      message: 'Linked routines will not be affected.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    flash?.('Goal deleted');
  };

  const toggleTask = (taskId) => {
    setDraft((prev) => {
      const has = prev.linkedTaskIds.includes(taskId);
      return {
        ...prev,
        linkedTaskIds: has
          ? prev.linkedTaskIds.filter((x) => x !== taskId)
          : [...prev.linkedTaskIds, taskId],
      };
    });
  };

  const goalProgress = useMemo(() => {
    return goals.map((g) => {
      const linked = tasks.filter((t) => g.linkedTaskIds?.includes(t.id));
      // Lookback window = min(30, days since the goal was created). Goals without
      // a createdAt (legacy) default to 30. Goal must have lived at least 1 full day.
      const ageDays = g.createdAt
        ? Math.max(1, Math.floor((Date.now() - g.createdAt) / 86400000) + 1)
        : 30;
      const lookback = Math.min(30, ageDays);

      if (linked.length === 0) {
        return { goal: g, rate: 0, done: 0, possible: 0, daysLeft: null, linked, lookback };
      }
      let done = 0;
      let possible = 0;
      const today = new Date();
      for (let i = lookback - 1; i >= 0; i--) {
        const d = addDays(today, -i);
        const dow = d.getDay();
        const c = completions[todayKey(d)] || {};
        for (const t of linked) {
          if (t.days && t.days.length > 0 && !t.days.includes(dow)) continue;
          possible += 1;
          if (c[t.id]) done += 1;
        }
      }
      const rate = possible ? done / possible : 0;
      const daysLeft = g.target
        ? Math.ceil((new Date(g.target).getTime() - Date.now()) / 86400000)
        : null;
      return { goal: g, rate, done, possible, daysLeft, linked, lookback };
    });
  }, [goals, tasks, completions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Goals</h1>
          <p className="text-slate-500 text-sm">Long-term ambitions, fueled by your daily routines.</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={startNew}>
          <Plus size={16} /> New goal
        </button>
      </div>

      {editing && (() => {
        const suggestions = suggestHabits(`${draft.title} ${draft.description}`);
        return (
        <div className="card p-5 animate-pop-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Title</label>
              <input
                autoFocus
                className="input mt-1"
                placeholder="Run a 5K in under 25 minutes"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-slate-500">Description</label>
              <textarea
                className="input mt-1 min-h-[60px] resize-y"
                placeholder="Why does this matter?"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Target date (optional)</label>
              <input
                type="date"
                className="input mt-1"
                value={draft.target}
                onChange={(e) => setDraft({ ...draft, target: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-500">Linked routines</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scroll-area">
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400">Add routines first to link them</p>
                ) : (
                  tasks.map((t) => {
                    const active = draft.linkedTaskIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTask(t.id)}
                        className={cn(
                          'chip transition border',
                          active
                            ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent'
                            : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
                        )}
                      >
                        {t.icon} {t.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          {suggestions && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-2">
                <Lightbulb size={12} /> Suggested routines for this goal
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => {
                  const exists = tasks.some((t) => t.name.toLowerCase() === s.name.toLowerCase());
                  return (
                    <button
                      key={i}
                      disabled={exists}
                      onClick={() => {
                        const newId = uid();
                        const t = {
                          id: newId,
                          name: s.name,
                          icon: s.icon,
                          color: 'violet',
                          days: [0,1,2,3,4,5,6],
                          time: '',
                          description: '',
                          category: s.category || '',
                          goalCount: s.goalCount || 0,
                          unit: s.unit || '',
                        };
                        setTasks?.((prev) => [...prev, t]);
                        setDraft((prev) => ({ ...prev, linkedTaskIds: [...prev.linkedTaskIds, newId] }));
                        flash?.(`Added "${s.name}"`);
                      }}
                      className={cn(
                        'chip transition border',
                        exists
                          ? 'opacity-50 cursor-not-allowed bg-white/40 border-slate-200 dark:bg-white/5 dark:border-white/10'
                          : 'bg-white/80 dark:bg-white/10 border-amber-400/40 text-slate-700 dark:text-slate-200 hover:bg-amber-100/40 dark:hover:bg-amber-500/15'
                      )}
                    >
                      <Plus size={11} /> {s.icon} {s.name}{exists && ' (added)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={cancel}>
              <X size={16} /> Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              <Save size={16} /> Save goal
            </button>
          </div>
        </div>
        );
      })()}

      {goalProgress.length === 0 && !editing ? (
        <div className="card p-10 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30 mb-3 animate-float">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-semibold">No goals yet</h3>
          <p className="text-sm text-slate-500 mt-1">Define an ambition and link the daily routines that get you there.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalProgress.map(({ goal, rate, done, possible, daysLeft, linked, lookback }) => (
            <div key={goal.id} className="card p-5 relative overflow-hidden animate-pop-in">
              <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-tr from-violet-500/30 to-cyan-500/30 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow shrink-0">
                      <Trophy size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{goal.title}</h3>
                      {goal.target && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {new Date(goal.target).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          {daysLeft != null && (
                            <span className={cn(daysLeft < 0 ? 'text-rose-500' : daysLeft < 7 ? 'text-amber-500' : 'text-slate-500')}>
                              · {daysLeft < 0 ? `${-daysLeft}d overdue` : `${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-ghost !p-2" onClick={() => startEdit(goal)} aria-label="Edit"><Pencil size={14} /></button>
                    <button className="btn-danger !p-2" onClick={() => remove(goal.id)} aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                {goal.description && (
                  <p className="text-sm text-slate-500 mt-3">{goal.description}</p>
                )}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>{lookback === 1 ? 'Today' : `Last ${lookback} day${lookback === 1 ? '' : 's'}`} momentum</span>
                    <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">{Math.round(rate * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                      style={{ width: `${rate * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{done} / {possible} routine checks · {linked?.length || 0} linked</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
