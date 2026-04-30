import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, StickyNote, Bell, Check, Globe, Plus, Trash2, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { todayKey, sameDay, cn, isComplete, uid } from '../lib/utils';
import { parseICS, fetchICS } from '../lib/ics';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['S','M','T','W','T','F','S'];

// Cycle through these for newly added feeds so different sources stay
// distinguishable in the day cells.
const FEED_COLORS = [
  { name: 'amber', dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30' },
  { name: 'rose', dot: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30' },
  { name: 'emerald', dot: 'bg-emerald-500', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30' },
  { name: 'sky', dot: 'bg-sky-500', chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30' },
  { name: 'fuchsia', dot: 'bg-fuchsia-500', chip: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-400/30' },
];
const colorByName = (name) => FEED_COLORS.find((c) => c.name === name) || FEED_COLORS[0];

// One-tap presets — public Google ICS feeds. Selectable from the feeds panel.
const FEED_PRESETS = [
  { id: 'in-holidays', name: 'Holidays in India', url: 'https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics' },
  { id: 'us-holidays', name: 'Holidays in United States', url: 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics' },
  { id: 'uk-holidays', name: 'Holidays in United Kingdom', url: 'https://calendar.google.com/calendar/ical/en.uk%23holiday%40group.v.calendar.google.com/public/basic.ics' },
];

export default function CalendarView({ tasks, completions, notes, reminders, onJumpToDay, setActive, icsFeeds = [], setIcsFeeds, flash }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState(new Date());
  const [selectedOpen, setSelectedOpen] = useState(false);
  const [feedsOpen, setFeedsOpen] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef(null);

  // Flatten all feed events into a date-keyed lookup so the grid can render
  // overlay chips in O(1) per cell.
  const feedEventsByDay = useMemo(() => {
    const map = new Map();
    for (const feed of icsFeeds || []) {
      for (const ev of feed.events || []) {
        const k = todayKey(new Date(ev.start));
        if (!map.has(k)) map.set(k, []);
        map.get(k).push({ ...ev, feedId: feed.id, feedName: feed.name, color: feed.color });
      }
    }
    return map;
  }, [icsFeeds]);

  const importFromUrl = async (name, url) => {
    if (!setIcsFeeds) return;
    const feedId = uid();
    setImportingId(feedId);
    try {
      const text = await fetchICS(url);
      const events = parseICS(text);
      if (events.length === 0) throw new Error('Feed had no events');
      const used = new Set((icsFeeds || []).map((f) => f.color));
      const color = (FEED_COLORS.find((c) => !used.has(c.name)) || FEED_COLORS[0]).name;
      setIcsFeeds((prev) => [
        ...(prev || []),
        { id: feedId, name, url, source: 'url', events, importedAt: Date.now(), color },
      ]);
      flash?.(`Imported ${events.length} events from ${name}`);
    } catch (e) {
      flash?.(e.message || 'Import failed — try downloading the .ics file and uploading instead', true);
    } finally {
      setImportingId(null);
    }
  };

  const refreshFeed = async (feed) => {
    if (!feed.url || !setIcsFeeds) return;
    setImportingId(feed.id);
    try {
      const text = await fetchICS(feed.url);
      const events = parseICS(text);
      setIcsFeeds((prev) => prev.map((f) => (f.id === feed.id ? { ...f, events, importedAt: Date.now() } : f)));
      flash?.(`Refreshed — ${events.length} events`);
    } catch (e) {
      flash?.(e.message || 'Refresh failed', true);
    } finally {
      setImportingId(null);
    }
  };

  const importFromFile = async (file) => {
    if (!file || !setIcsFeeds) return;
    try {
      const text = await file.text();
      const events = parseICS(text);
      if (events.length === 0) throw new Error('No events found in this file');
      const used = new Set((icsFeeds || []).map((f) => f.color));
      const color = (FEED_COLORS.find((c) => !used.has(c.name)) || FEED_COLORS[0]).name;
      setIcsFeeds((prev) => [
        ...(prev || []),
        { id: uid(), name: file.name.replace(/\.ics$/i, '') || 'Imported calendar', url: null, source: 'file', events, importedAt: Date.now(), color },
      ]);
      flash?.(`Imported ${events.length} events`);
    } catch (e) {
      flash?.(e.message || 'Could not parse this .ics file', true);
    }
  };

  const removeFeed = (id) => {
    setIcsFeeds?.((prev) => (prev || []).filter((f) => f.id !== id));
    flash?.('Feed removed');
  };

  const addUrlDraft = () => {
    const url = urlDraft.trim();
    if (!url) return;
    let name;
    try {
      name = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      flash?.('That URL doesn\'t look right', true);
      return;
    }
    importFromUrl(name, url);
    setUrlDraft('');
  };

  const grid = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1);
    const startDow = start.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (days.length % 7) days.push(null);
    return days;
  }, [cursor]);

  const dayMeta = (d) => {
    if (!d) return null;
    const k = todayKey(d);
    const dow = d.getDay();
    const dayTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(dow));
    const c = completions[k] || {};
    const completed = dayTasks.filter((t) => isComplete(t, c[t.id])).length;
    const noteCount = notes.filter((n) => sameDay(new Date(n.createdAt), d)).length;
    const reminderCount = reminders.filter((r) => sameDay(new Date(r.when), d)).length;
    const feedEvents = feedEventsByDay.get(k) || [];
    const pct = dayTasks.length ? completed / dayTasks.length : 0;
    return { k, completed, total: dayTasks.length, pct, noteCount, reminderCount, feedEvents };
  };

  const selectedMeta = dayMeta(selected);
  const selectedNotes = notes.filter((n) => sameDay(new Date(n.createdAt), selected));
  const selectedReminders = reminders.filter((r) => sameDay(new Date(r.when), selected));
  const selectedTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(selected.getDay()));
  const selectedCompletions = completions[todayKey(selected)] || {};
  const selectedFeedEvents = feedEventsByDay.get(todayKey(selected)) || [];

  const presetTaken = (preset) => (icsFeeds || []).some((f) => f.url === preset.url);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-slate-500 text-sm">Month view of your routines, notes, and reminders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() - 1);
              setCursor(d);
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-semibold tabular-nums min-w-[160px] text-center">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() + 1);
              setCursor(d);
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              const t = new Date();
              setCursor(new Date(t.getFullYear(), t.getMonth(), 1));
              setSelected(t);
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="card p-3 sm:p-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DOW.map((d, i) => (
            <div key={i} className="text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold py-1.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, idx) => {
            if (!d) return <div key={idx} className="aspect-square" />;
            const m = dayMeta(d);
            const isToday = sameDay(d, new Date());
            const isSelected = sameDay(d, selected);
            // Tooltip text shown on hover. Holiday names get top billing;
            // routine/note/reminder counts come after so the user sees the
            // calendar-feed signal first.
            const tooltipParts = [];
            if (m.feedEvents.length > 0) {
              tooltipParts.push(m.feedEvents.map((e) => `${e.feedName ? '' : ''}${e.title}`).join(' · '));
            }
            if (m.total > 0) tooltipParts.push(`${m.completed}/${m.total} routines`);
            if (m.noteCount > 0) tooltipParts.push(`${m.noteCount} note${m.noteCount > 1 ? 's' : ''}`);
            if (m.reminderCount > 0) tooltipParts.push(`${m.reminderCount} reminder${m.reminderCount > 1 ? 's' : ''}`);
            const tooltip = tooltipParts.join(' · ') || d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
            return (
              <button
                key={idx}
                onClick={() => setSelected(d)}
                title={tooltip}
                className={cn(
                  'aspect-square rounded-lg p-1.5 sm:p-2 flex flex-col items-stretch text-left transition relative overflow-hidden border',
                  isSelected
                    ? 'border-violet-500 ring-2 ring-violet-500/40'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-white/10',
                  isToday && 'bg-violet-500/5'
                )}
              >
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: heatColor(m.pct), opacity: m.total ? 1 : 0 }}
                />
                <span className="relative flex items-center justify-between">
                  <span className={cn('text-[11px] sm:text-sm font-semibold tabular-nums', isToday && 'text-violet-600 dark:text-violet-400')}>
                    {d.getDate()}
                  </span>
                  {m.total > 0 && m.completed === m.total && (
                    <span className="size-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center text-white">
                      <Check size={9} strokeWidth={4} />
                    </span>
                  )}
                </span>
                <span className="relative flex-1" />
                {m.feedEvents.length > 0 && (
                  <span className="relative flex items-center gap-0.5 mb-0.5" title={m.feedEvents.map((e) => e.title).join(' · ')}>
                    {Array.from(new Set(m.feedEvents.map((e) => e.color))).slice(0, 3).map((c) => (
                      <span key={c} className={cn('size-1.5 rounded-full', colorByName(c).dot)} />
                    ))}
                  </span>
                )}
                <span className="relative flex items-center gap-1 text-[9px] text-slate-500">
                  {m.noteCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <StickyNote size={9} /> {m.noteCount}
                    </span>
                  )}
                  {m.reminderCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Bell size={9} /> {m.reminderCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <button
            className="flex-1 flex items-center justify-between gap-2 text-left"
            onClick={() => setSelectedOpen((v) => !v)}
            aria-expanded={selectedOpen}
          >
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                {sameDay(selected, new Date()) ? 'Today' : 'Selected'}
              </div>
              <h2 className="text-xl font-bold">
                {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
            </div>
            <ChevronRight size={18} className={cn('shrink-0 text-slate-400 transition', selectedOpen && 'rotate-90')} />
          </button>
          <button
            className="btn-ghost shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onJumpToDay?.(selected);
              setActive?.('today');
            }}
          >
            <CalendarDays size={14} /> Open day
          </button>
        </div>

        {!selectedOpen && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
            <span>{selectedTasks.length} routines</span>
            <span>·</span>
            <span>{selectedNotes.length} notes</span>
            <span>·</span>
            <span>{selectedReminders.length} reminders</span>
          </div>
        )}

        {selectedOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Routines</h3>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-slate-400">None scheduled</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedTasks.map((t) => (
                  <li key={t.id} className="text-sm flex items-center gap-2">
                    <span
                      className={cn(
                        'size-4 rounded grid place-items-center',
                        isComplete(t, selectedCompletions[t.id]) ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white' : 'border border-slate-300 dark:border-white/15'
                      )}
                    >
                      {isComplete(t, selectedCompletions[t.id]) && <Check size={10} strokeWidth={4} />}
                    </span>
                    <span className={cn('truncate', isComplete(t, selectedCompletions[t.id]) && 'line-through text-slate-400')}>
                      {t.icon} {t.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Notes ({selectedNotes.length})</h3>
            {selectedNotes.length === 0 ? (
              <p className="text-sm text-slate-400">No notes from this day</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedNotes.map((n) => (
                  <li key={n.id} className="text-sm truncate">• {n.title || n.body.slice(0, 40)}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Reminders ({selectedReminders.length})</h3>
            {selectedReminders.length === 0 ? (
              <p className="text-sm text-slate-400">No reminders</p>
            ) : (
              <ul className="space-y-1.5">
                {selectedReminders.map((r) => (
                  <li key={r.id} className="text-sm truncate">
                    {new Date(r.when).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} — {r.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        )}

        {/* External calendars sit OUTSIDE the dropdown so holiday names are
            always visible after a click — that's the main reason the user
            taps a date in the first place. */}
        {selectedFeedEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/5">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">External calendars ({selectedFeedEvents.length})</h3>
            <ul className="flex flex-wrap gap-1.5">
              {selectedFeedEvents.map((e, i) => (
                <li key={`${e.feedId}-${e.uid || i}`} className={cn('chip text-[11px] border', colorByName(e.color).chip)} title={e.feedName}>
                  {e.allDay ? '' : new Date(e.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' '}
                  {e.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-5">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setFeedsOpen((v) => !v)}
          aria-expanded={feedsOpen}
        >
          <span className="flex items-center gap-2">
            <Globe size={16} className="text-violet-500" />
            <span className="font-semibold">Calendar feeds</span>
            {(icsFeeds?.length || 0) > 0 && (
              <span className="chip text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400">{icsFeeds.length}</span>
            )}
          </span>
          <ChevronRight size={16} className={cn('transition', feedsOpen && 'rotate-90')} />
        </button>
        {feedsOpen && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <p className="text-xs text-slate-500 leading-relaxed">
              Subscribe to public .ics calendars (holidays, your own iCloud/Google calendar share link). Events appear as colored chips on each day. Imports run client-side; if a feed blocks browser fetches we route through a free CORS proxy. Refreshes are manual.
            </p>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Quick add — public holidays</div>
              <div className="flex flex-wrap gap-2">
                {FEED_PRESETS.map((p) => {
                  const taken = presetTaken(p);
                  return (
                    <button
                      key={p.id}
                      disabled={taken || importingId !== null}
                      onClick={() => importFromUrl(p.name, p.url)}
                      className={cn(
                        'chip text-xs border transition',
                        taken
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30 cursor-default'
                          : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-violet-400'
                      )}
                    >
                      {taken ? <Check size={11} /> : <Sparkles size={11} />} {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Add by URL</div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="https://…/basic.ics"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addUrlDraft(); }}
                />
                <button className="btn-primary !px-3 shrink-0" onClick={addUrlDraft} disabled={!urlDraft.trim() || importingId !== null}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Upload .ics file</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importFromFile(f);
                  e.target.value = '';
                }}
              />
              <button className="btn-ghost text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Choose file
              </button>
            </div>

            {(icsFeeds?.length || 0) > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">Subscribed</div>
                <ul className="space-y-1.5">
                  {icsFeeds.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                      <span className={cn('size-2 rounded-full shrink-0', colorByName(f.color).dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{f.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {(f.events?.length || 0)} events · imported {new Date(f.importedAt).toLocaleDateString()}
                          {f.source === 'file' && ' · file'}
                        </div>
                      </div>
                      {f.url && (
                        <button
                          className="size-8 rounded-lg hover:bg-violet-500/10 grid place-items-center text-slate-400 hover:text-violet-600 transition"
                          onClick={() => refreshFeed(f)}
                          disabled={importingId === f.id}
                          aria-label="Refresh feed"
                          title="Refresh"
                        >
                          <RefreshCw size={14} className={cn(importingId === f.id && 'animate-spin')} />
                        </button>
                      )}
                      <button
                        className="size-8 rounded-lg hover:bg-rose-500/10 grid place-items-center text-slate-400 hover:text-rose-600 transition"
                        onClick={() => removeFeed(f.id)}
                        aria-label="Remove feed"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function heatColor(v) {
  if (v <= 0) return 'transparent';
  const a = [139, 92, 246];
  const b = [6, 182, 212];
  const mix = a.map((x, i) => Math.round(x + (b[i] - x) * v));
  return `linear-gradient(135deg, rgba(${mix[0]},${mix[1]},${mix[2]},${0.15 + 0.45 * v}), rgba(${mix[0]},${mix[1]},${mix[2]},${0.05 + 0.2 * v}))`;
}
