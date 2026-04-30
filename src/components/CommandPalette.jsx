import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Calendar, ListChecks, StickyNote, Bell, BarChart3, CalendarDays, Target, Plus, Sun, Moon, Download, Compass, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CommandPalette({ open, onClose, navigate, tasks, notes, reminders, theme, setTheme, onNewNote, onNewReminder, onExport, onPrint, onQuickCapture, onRestartTour, onInstallApp }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    const navItems = [
      { id: 'go-today', label: 'Go to Today', icon: Calendar, hint: 'T', run: () => navigate('today') },
      { id: 'go-tasks', label: 'Go to Routines', icon: ListChecks, hint: 'R', run: () => navigate('tasks') },
      { id: 'go-notes', label: 'Go to Notes', icon: StickyNote, hint: 'N', run: () => navigate('notes') },
      { id: 'go-reminders', label: 'Go to Reminders', icon: Bell, hint: 'M', run: () => navigate('reminders') },
      { id: 'go-stats', label: 'Go to Stats', icon: BarChart3, hint: 'S', run: () => navigate('stats') },
      { id: 'go-cal', label: 'Go to Calendar', icon: CalendarDays, hint: 'C', run: () => navigate('calendar') },
      { id: 'go-goals', label: 'Go to Goals', icon: Target, hint: 'G', run: () => navigate('goals') },
    ];
    const actions = [
      { id: 'a-capture', label: 'Quick capture', icon: Plus, hint: 'I', run: onQuickCapture },
      { id: 'a-note', label: 'New note', icon: Plus, run: onNewNote },
      { id: 'a-reminder', label: 'New reminder', icon: Plus, run: onNewReminder },
      { id: 'a-theme', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: theme === 'dark' ? Sun : Moon, run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'a-export', label: 'Export data', icon: Download, run: onExport },
      { id: 'a-print', label: 'Print today', icon: Download, run: onPrint },
      ...(onRestartTour ? [{ id: 'a-tour', label: 'Restart tour', icon: Compass, run: onRestartTour }] : []),
      ...(onInstallApp ? [{ id: 'a-install', label: 'Install app to home screen', icon: Smartphone, run: onInstallApp }] : []),
    ];
    const noteResults = notes.slice(0, 50).map((n) => ({
      id: 'n-' + n.id,
      label: n.title || (n.body || '').slice(0, 40) || 'Untitled note',
      sublabel: 'Note',
      icon: StickyNote,
      run: () => navigate('notes'),
    }));
    const reminderResults = reminders.slice(0, 50).map((r) => ({
      id: 'r-' + r.id,
      label: r.title,
      sublabel: 'Reminder · ' + new Date(r.when).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      icon: Bell,
      run: () => navigate('reminders'),
    }));
    const taskResults = tasks.slice(0, 50).map((t) => ({
      id: 't-' + t.id,
      label: t.name,
      sublabel: 'Routine',
      icon: ListChecks,
      run: () => navigate('tasks'),
    }));
    const all = [...navItems, ...actions, ...taskResults, ...noteResults, ...reminderResults];
    if (!q.trim()) return all.slice(0, 12);
    const term = q.toLowerCase();
    return all.filter((it) => it.label.toLowerCase().includes(term) || (it.sublabel || '').toLowerCase().includes(term)).slice(0, 30);
  }, [q, tasks, notes, reminders, theme, navigate, setTheme, onNewNote, onNewReminder, onExport, onPrint]);

  useEffect(() => { setActive(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(items.length - 1, a + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = items[active];
        if (it) {
          it.run?.();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center pt-20 px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative card w-full max-w-xl overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/70 dark:border-white/10">
          <Search size={16} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command, page, or search…"
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
          <span className="hidden sm:flex chip text-[10px] bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">
            ESC
          </span>
        </div>
        <div className="max-h-[420px] overflow-y-auto scroll-area py-1">
          {items.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">No results</div>
          )}
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => { it.run?.(); onClose(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition',
                  active === i ? 'bg-gradient-to-r from-violet-500/15 to-cyan-500/15 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                )}
              >
                <Icon size={15} className="text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{it.label}</div>
                  {it.sublabel && <div className="text-[11px] text-slate-500 truncate">{it.sublabel}</div>}
                </div>
                {it.hint && (
                  <span className="chip text-[10px] bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">
                    {it.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
