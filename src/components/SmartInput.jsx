import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Wand2, Sparkles, Clock, Repeat, Hash, AlertTriangle, Tag, CalendarDays, X } from 'lucide-react';
import { parseSmart } from '../lib/nlparse';
import { cn } from '../lib/utils';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Per-screen example phrases that rotate as a placeholder, so users get a
// flavor of what the parser understands without reading docs.
const PLACEHOLDERS = {
  reminder: [
    'remind me to call mom tomorrow at 9',
    'every monday at 7pm yoga',
    'in 30 min check the oven',
    'urgent: pay rent on the 1st',
    'review PRs every weekday at 4pm',
  ],
  routine: [
    'drink 8 glasses of water daily',
    '💪 workout weekdays at 7am',
    'read 30 pages every evening',
    'meditate 10 min every morning',
    'journal 3 lines every night',
  ],
};

const formatTimeFromIso = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

// A single parsed chip the user can click to remove.
function Chip({ icon: Icon, label, tint, onRemove }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 chip text-[10px] border transition animate-pop-in',
        tint || 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10'
      )}
    >
      {Icon && <Icon size={11} />}
      <span className="font-semibold">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-1 size-4 grid place-items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Drop this"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

// Rotating placeholder — feels alive without being noisy.
function useRotatingPlaceholder(list, intervalMs = 3500, paused = false) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), intervalMs);
    return () => clearInterval(t);
  }, [list, intervalMs, paused]);
  return list[idx];
}

export default function SmartInput({
  variant = 'reminder', // 'reminder' | 'routine'
  onApply,
  examples,
}) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const list = examples || PLACEHOLDERS[variant] || PLACEHOLDERS.reminder;
  const placeholder = useRotatingPlaceholder(list, 3500, text.length > 0);

  const parsed = useMemo(() => (text.trim() ? parseSmart(text) : null), [text]);

  const apply = () => {
    const t = text.trim();
    if (!t) return;
    onApply(t, parsed);
    setText('');
    inputRef.current?.focus();
  };

  // Drop one parsed signal so the user can re-type just that piece.
  const stripField = (field) => {
    if (!parsed) return;
    const stripWords = {
      time: /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b|\b(noon|midnight|morning|afternoon|evening|night)\b/gi,
      repeat: /\b(every\s+day|daily|every\s+week|weekly|every\s+month|monthly)\b|\bweekdays?\b|\bweekends?\b|\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)s?\b/gi,
      days: /\b(?:next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)s?\b|\bweekdays?\b|\bweekends?\b/gi,
      priority: /\b(urgent|asap|important|critical|high\s+priority|low\s+priority|whenever|someday)\b|!{2,}/gi,
      goalCount: /\b\d+\s+\w+\b/gi,
      icon: parsed.icon,
    };
    const pat = stripWords[field];
    if (!pat) return;
    if (typeof pat === 'string') setText((s) => s.replace(pat, '').replace(/\s+/g, ' ').trim());
    else setText((s) => s.replace(pat, ' ').replace(/\s+/g, ' ').trim());
  };

  const hasSignal =
    parsed && (parsed.when || parsed.time || parsed.days || parsed.repeat !== 'none' || parsed.icon || parsed.priority || parsed.goalCount || parsed.category);

  return (
    <div className="relative rounded-2xl p-[1px] mb-4 bg-gradient-to-r from-violet-500/40 via-fuchsia-500/40 to-cyan-500/40 animate-gradient" style={{ backgroundSize: '200% 200%' }}>
      <div className="rounded-2xl bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="size-6 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-sm">
            <Sparkles size={12} />
          </div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400 font-bold">
            Smart input
          </label>
          {hasSignal && (
            <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse-soft" /> parsed
            </span>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); apply(); }}
        >
          <input
            ref={inputRef}
            placeholder={placeholder}
            className="input flex-1 text-sm bg-transparent !border-slate-300/60 dark:!border-white/10"
            enterKeyHint="done"
            autoCapitalize="sentences"
            autoCorrect="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="btn-primary !px-3 shrink-0 disabled:!opacity-40"
            aria-label="Apply smart input"
          >
            <Wand2 size={14} /> Apply
          </button>
        </form>

        {hasSignal && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 animate-fade-in">
            {parsed.icon && (
              <Chip
                icon={null}
                label={<span className="text-base leading-none">{parsed.icon}</span>}
                tint="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30"
                onRemove={() => stripField('icon')}
              />
            )}
            {parsed.when && (
              <Chip
                icon={Clock}
                label={formatTimeFromIso(parsed.when)}
                tint="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30"
                onRemove={() => stripField('time')}
              />
            )}
            {!parsed.when && parsed.time && (
              <Chip
                icon={Clock}
                label={parsed.time}
                tint="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30"
                onRemove={() => stripField('time')}
              />
            )}
            {parsed.days && (
              <Chip
                icon={CalendarDays}
                label={parsed.days.length === 7 ? 'every day' : parsed.days.map((d) => DAY_LABELS[d]).join(' · ')}
                tint="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/30"
                onRemove={() => stripField('days')}
              />
            )}
            {parsed.repeat !== 'none' && !parsed.days && (
              <Chip
                icon={Repeat}
                label={parsed.repeat}
                tint="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/30"
                onRemove={() => stripField('repeat')}
              />
            )}
            {parsed.goalCount > 0 && (
              <Chip
                icon={Hash}
                label={`${parsed.goalCount}${parsed.unit ? ` ${parsed.unit}` : ''}`}
                tint="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30"
                onRemove={() => stripField('goalCount')}
              />
            )}
            {parsed.priority === 'high' && (
              <Chip
                icon={AlertTriangle}
                label="high"
                tint="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30"
                onRemove={() => stripField('priority')}
              />
            )}
            {parsed.priority === 'low' && (
              <Chip
                icon={null}
                label="low priority"
                tint="bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-400/30"
                onRemove={() => stripField('priority')}
              />
            )}
            {parsed.category && (
              <Chip
                icon={Tag}
                label={parsed.category}
                tint="bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-400/30"
              />
            )}
            {parsed.title && (
              <span className="text-[11px] text-slate-500 ml-1 truncate">
                → <em className="text-slate-700 dark:text-slate-200 font-medium not-italic">{parsed.title}</em>
              </span>
            )}
          </div>
        )}

        {!text && (
          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
            Type freely — times, days, counts, priority & emoji are picked up automatically.
            Hit <kbd className="px-1 py-0.5 rounded bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/10">Enter</kbd> to fill the form.
          </p>
        )}
      </div>
    </div>
  );
}
