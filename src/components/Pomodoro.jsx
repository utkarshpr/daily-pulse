import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer, Coffee, Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { playChime, vibrate } from '../lib/chime';

const FOCUS_PRESETS = [15, 25, 45, 60, 90];
const BREAK_PRESETS = [3, 5, 10, 15, 20];

export default function Pomodoro({ tasks, onCompleteRoutine, settings, setSettings }) {
  const focusMins = settings?.focus ?? 25;
  const breakMins = settings?.break ?? 5;
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [seconds, setSeconds] = useState(focusMins * 60);
  const [running, setRunning] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [completedFocuses, setCompletedFocuses] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const tickRef = useRef(null);

  const total = (mode === 'focus' ? focusMins : breakMins) * 60;
  const progress = 1 - seconds / total;

  // If the user changes the durations while idle, sync the displayed time
  useEffect(() => {
    if (!running) {
      setSeconds((mode === 'focus' ? focusMins : breakMins) * 60);
    }
  }, [focusMins, breakMins, mode, running]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode]);

  const handleComplete = () => {
    setRunning(false);
    playChime();
    vibrate();
    if (mode === 'focus') {
      setCompletedFocuses((n) => n + 1);
      if (linkedTaskId && onCompleteRoutine) onCompleteRoutine(linkedTaskId);
      setMode('break');
      setSeconds(breakMins * 60);
    } else {
      setMode('focus');
      setSeconds(focusMins * 60);
    }
  };

  const reset = () => {
    setRunning(false);
    setSeconds(total);
  };

  const switchMode = (m) => {
    setRunning(false);
    setMode(m);
    setSeconds((m === 'focus' ? focusMins : breakMins) * 60);
  };

  const updateDurations = (next) => {
    const safe = {
      focus: Math.max(1, Math.min(180, Number(next.focus) || focusMins)),
      break: Math.max(1, Math.min(60, Number(next.break) || breakMins)),
    };
    setSettings(safe);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        className={cn(
          'absolute -top-16 -right-16 size-48 rounded-full blur-3xl opacity-30 transition-all',
          mode === 'focus'
            ? 'bg-gradient-to-tr from-violet-500 to-fuchsia-500'
            : 'bg-gradient-to-tr from-emerald-500 to-teal-500'
        )}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'size-9 rounded-xl text-white grid place-items-center bg-gradient-to-tr',
                mode === 'focus' ? 'from-violet-600 to-fuchsia-500' : 'from-emerald-500 to-teal-500'
              )}
            >
              {mode === 'focus' ? <Timer size={18} /> : <Coffee size={18} />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">{mode === 'focus' ? 'Focus' : 'Break'}</div>
              <div className="text-sm font-semibold">Pomodoro · {completedFocuses} done today</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/60 dark:bg-white/5 rounded-full p-1 text-xs font-semibold">
              <button
                onClick={() => switchMode('focus')}
                className={cn('px-3 py-1 rounded-full transition', mode === 'focus' ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white' : 'text-slate-500')}
              >
                Focus
              </button>
              <button
                onClick={() => switchMode('break')}
                className={cn('px-3 py-1 rounded-full transition', mode === 'break' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white' : 'text-slate-500')}
              >
                Break
              </button>
            </div>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
              aria-label="Pomodoro settings"
              title="Customize durations"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-pop-in">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Customize durations</div>
              <button
                onClick={() => setShowSettings(false)}
                className="size-6 rounded-md hover:bg-white/80 dark:hover:bg-white/10 grid place-items-center"
                aria-label="Close"
              >
                <X size={12} />
              </button>
            </div>
            <DurationField
              label="Focus"
              value={focusMins}
              presets={FOCUS_PRESETS}
              onChange={(v) => updateDurations({ focus: v, break: breakMins })}
              gradient="from-violet-600 to-fuchsia-500"
              max={180}
            />
            <div className="h-2" />
            <DurationField
              label="Break"
              value={breakMins}
              presets={BREAK_PRESETS}
              onChange={(v) => updateDurations({ focus: focusMins, break: v })}
              gradient="from-emerald-500 to-teal-500"
              max={60}
            />
          </div>
        )}

        <div className="flex flex-col items-center my-3">
          <div className="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
            {mm}:{ss}
          </div>
          <div className="w-full h-1.5 bg-slate-200/60 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all',
                mode === 'focus' ? 'from-violet-500 to-fuchsia-500' : 'from-emerald-500 to-teal-500'
              )}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-2">
            {focusMins}m focus · {breakMins}m break
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setRunning((r) => !r)}
            className="btn-primary"
          >
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
          </button>
          <button onClick={reset} className="btn-ghost" aria-label="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        {mode === 'focus' && tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-white/10">
            <label className="text-[10px] uppercase tracking-wider text-slate-500">Auto-check routine on completion (optional)</label>
            <select
              value={linkedTaskId}
              onChange={(e) => setLinkedTaskId(e.target.value)}
              className="input mt-1.5 text-sm"
            >
              <option value="">— None —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function DurationField({ label, value, presets, onChange, gradient, max = 60 }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="1"
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 text-sm text-center bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-1 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <span className="text-[10px] text-slate-500">min</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'flex-1 min-w-0 px-2 py-1 rounded-md text-[11px] font-semibold transition border',
              value === p
                ? `bg-gradient-to-tr text-white border-transparent shadow ${gradient}`
                : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
            )}
          >
            {p}m
          </button>
        ))}
      </div>
    </div>
  );
}
