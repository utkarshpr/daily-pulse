import React, { useEffect } from 'react';
import { BellRing, Check, Clock, X } from 'lucide-react';

export default function ReminderAlert({ alert, onDismiss, onSnooze, onComplete }) {
  useEffect(() => {
    if (!alert) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const due = new Date(alert.when);

  return (
    <div className="fixed inset-0 z-[150] grid place-items-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div
        className="relative card max-w-md w-full p-6 sm:p-7 animate-pop-in overflow-hidden"
        role="alertdialog"
        aria-labelledby="reminder-title"
      >
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-gradient-to-tr from-violet-600/40 to-cyan-500/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-gradient-to-tr from-rose-500/30 to-amber-500/30 blur-3xl pointer-events-none" />

        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="relative flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 blur-xl opacity-60 animate-pulse-soft" />
            <div className="relative size-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-xl shadow-violet-500/40 animate-bell">
              <BellRing size={26} />
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">
              Reminder
            </div>
            <h3 id="reminder-title" className="text-xl font-bold mt-1 break-words">{alert.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <Clock size={12} />
              {due.toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {alert.notes && (
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                {alert.notes}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-6 flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <button className="btn-ghost flex-1 justify-center" onClick={() => onSnooze(5)}>
              Snooze 5m
            </button>
            <button className="btn-ghost flex-1 justify-center" onClick={() => onSnooze(15)}>
              Snooze 15m
            </button>
          </div>
          <button className="btn-primary justify-center sm:flex-none" onClick={onComplete}>
            <Check size={16} /> Mark done
          </button>
        </div>
      </div>
    </div>
  );
}
