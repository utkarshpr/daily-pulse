import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Target, Check, Search, Inbox, Keyboard, Bell, Lightbulb } from 'lucide-react';
import { uid, cn } from '../lib/utils';
import { suggestHabits, STARTER_ROUTINES } from '../lib/habitSuggestions';

const fillTask = (partial) => ({
  id: uid(),
  description: '',
  time: '',
  days: [0, 1, 2, 3, 4, 5, 6],
  goalCount: 0,
  unit: '',
  category: '',
  color: 'violet',
  ...partial,
});

export default function Onboarding({ open, onClose, setTasks, setGoals, flash }) {
  const [step, setStep] = useState(0);
  const [goalText, setGoalText] = useState('');
  const [picked, setPicked] = useState(new Set());

  if (!open) return null;

  const detected = suggestHabits(goalText);
  const offered = detected ? detected.suggestions : STARTER_ROUTINES;

  const togglePick = (key) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const finish = (skip = false) => {
    if (!skip && goalText.trim()) {
      const goalId = uid();
      const linkedTaskIds = [];
      const newTasks = [];
      offered.forEach((s, i) => {
        if (picked.has(i)) {
          const t = fillTask(s);
          newTasks.push(t);
          linkedTaskIds.push(t.id);
        }
      });
      if (newTasks.length) setTasks((prev) => [...prev, ...newTasks]);
      if (setGoals) {
        setGoals((prev) => [
          ...prev,
          {
            id: goalId,
            createdAt: Date.now(),
            title: goalText.trim(),
            description: '',
            target: '',
            linkedTaskIds,
          },
        ]);
      }
      flash?.(`Goal "${goalText.trim()}" created`);
    }
    onClose();
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="relative card w-full max-w-lg p-6 sm:p-8 animate-pop-in overflow-hidden max-h-[92vh] overflow-y-auto scroll-area">
        <button
          onClick={() => finish(true)}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
          aria-label="Skip onboarding"
          title="Skip"
        >
          <X size={14} />
        </button>

        <Progress step={step} total={STEPS.length} />

        <div key={step} className="animate-fade-in mt-2">
          {step === 0 && <Welcome />}
          {step === 1 && <GoalStep value={goalText} onChange={setGoalText} />}
          {step === 2 && (
            <RoutinesStep
              detected={detected}
              offered={offered}
              picked={picked}
              onTogglePick={togglePick}
            />
          )}
          {step === 3 && <TourStep />}
          {step === 4 && <DoneStep goalText={goalText} count={picked.size} />}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {step > 0 ? (
            <button onClick={back} className="btn-ghost text-xs">Back</button>
          ) : (
            <button onClick={() => finish(true)} className="btn-ghost text-xs">Skip</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary">
              {step === 0 ? 'Get started' : 'Continue'} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => finish(false)} className="btn-primary">
              <Check size={16} /> Let's go
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS = ['welcome', 'goal', 'routines', 'tour', 'done'];

function Progress({ step, total }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-all duration-500',
            i <= step
              ? 'bg-gradient-to-r from-violet-500 to-cyan-500'
              : 'bg-slate-200 dark:bg-white/10'
          )}
        />
      ))}
    </div>
  );
}

function Welcome() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-500 blur-xl opacity-50 animate-pulse-soft" />
          <div className="relative size-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/40">
            <Sparkles size={22} />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">Welcome</div>
          <h2 className="text-2xl font-bold">Daily Pulse</h2>
        </div>
      </div>
      <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
        A local-first tracker for your daily routines, notes, reminders, and goals.
        Your data stays in your browser — no account, no cloud.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Track habits & quantitative goals</li>
        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Notes with markdown, tags & backlinks</li>
        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Reminders with smart-input parsing</li>
        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Streaks, badges, daily reflection</li>
      </ul>
      <p className="mt-4 text-xs text-slate-500">Takes about 30 seconds to set up.</p>
    </div>
  );
}

function GoalStep({ value, onChange }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow">
          <Target size={18} />
        </div>
        <h2 className="text-xl font-bold">What's your top goal right now?</h2>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        One sentence. We'll suggest daily routines that move you toward it. You can leave it blank to start fresh.
      </p>
      <input
        autoFocus
        className="input"
        placeholder="e.g. Run a 5K, lose 10 lbs, read 12 books, learn Spanish…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-3 text-[11px] text-slate-400">
        We don't store this anywhere off your device.
      </p>
    </div>
  );
}

function RoutinesStep({ detected, offered, picked, onTogglePick }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 grid place-items-center text-white shadow">
          <Lightbulb size={18} />
        </div>
        <h2 className="text-xl font-bold">Pick your starter routines</h2>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        {detected
          ? `Detected "${detected.label}" goal — these routines pair well with it. Pick any to start.`
          : 'Some everyday classics. Pick what resonates — you can edit or delete anytime.'}
      </p>
      <div className="space-y-2">
        {offered.map((r, i) => {
          const isOn = picked.has(i);
          return (
            <button
              key={i}
              onClick={() => onTogglePick(i)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition border-2 text-left',
                isOn
                  ? 'border-violet-500 bg-gradient-to-r from-violet-500/10 to-cyan-500/10'
                  : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30'
              )}
            >
              <div className="text-2xl">{r.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-[11px] text-slate-500">
                  {r.goalCount > 0
                    ? `Track count · target ${r.goalCount}${r.unit ? ` ${r.unit}` : ''}/day`
                    : 'Daily check'}
                  {r.category && ` · ${r.category}`}
                </div>
              </div>
              <div
                className={cn(
                  'size-6 rounded-md grid place-items-center transition shrink-0',
                  isOn
                    ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow'
                    : 'border border-slate-300 dark:border-white/15'
                )}
              >
                {isOn && <Check size={14} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        {picked.size > 0 ? `${picked.size} selected` : 'You can skip — try the app and add routines later.'}
      </p>
    </div>
  );
}

function TourStep() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center text-white shadow">
          <Keyboard size={18} />
        </div>
        <h2 className="text-xl font-bold">Two power tips</h2>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        These two shortcuts make Daily Pulse fast — worth knowing.
      </p>
      <div className="space-y-3">
        <Tip
          icon={<Search size={18} />}
          shortcut={['⌘', 'K']}
          title="Command palette"
          body="Search every routine, note, and reminder. Run actions like New note, switch theme, or jump to any tab."
          gradient="from-violet-600 to-fuchsia-500"
        />
        <Tip
          icon={<Inbox size={18} />}
          shortcut={['I']}
          title="Quick capture"
          body="Brain-dump from anywhere. Save to inbox, or convert directly into a note, reminder, or routine."
          gradient="from-cyan-500 to-sky-500"
        />
        <Tip
          icon={<Bell size={18} />}
          shortcut={[]}
          title="Smart reminders"
          body='In the Reminders editor, type "remind me tomorrow at 9 to call mom" — it parses into title + datetime + repeat.'
          gradient="from-amber-500 to-orange-500"
        />
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 mx-0.5">?</kbd>
        anytime to see all shortcuts.
      </p>
    </div>
  );
}

function Tip({ icon, shortcut, title, body, gradient }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
      <div className={cn('size-9 rounded-lg bg-gradient-to-tr text-white grid place-items-center shrink-0', gradient)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{title}</span>
          {shortcut.length > 0 && (
            <span className="flex gap-1">
              {shortcut.map((k, i) => (
                <kbd key={i} className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[10px] bg-white/60 dark:bg-white/5 font-bold">{k}</kbd>
              ))}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function DoneStep({ goalText, count }) {
  return (
    <div className="text-center py-2">
      <div className="mx-auto size-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center text-white shadow-lg shadow-emerald-500/30 animate-float">
        <Check size={28} strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-bold mt-3">You're all set</h2>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed">
        {goalText.trim() ? (
          <>
            Goal <strong className="text-slate-700 dark:text-slate-200">"{goalText.trim()}"</strong> created
            {count > 0 ? <> with <strong>{count}</strong> linked routine{count === 1 ? '' : 's'}</> : ''}.
          </>
        ) : (
          <>Daily Pulse is ready. Add routines, notes, and reminders as they come up.</>
        )}
      </p>
      <p className="text-xs text-slate-400 mt-4">
        Tip: enable browser notifications when you create a reminder so it can ring even when this tab is closed.
      </p>
    </div>
  );
}
