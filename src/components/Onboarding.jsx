import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Target, Check, Search, Inbox, Keyboard, Bell, Lightbulb, Calendar, ListChecks, CalendarDays, StickyNote, BookOpen, BarChart3, User, Lock, Timer, Smartphone, Wand2, Clock, Repeat, Hash, AlertTriangle, Globe, Newspaper, Snowflake, FileText, Tag } from 'lucide-react';
import BrandMark from './BrandMark';
import { parseSmart, splitTitle } from '../lib/nlparse';
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
          {step === 3 && <SmartDemoStep />}
          {step === 4 && <FeaturesStepCore />}
          {step === 5 && <FeaturesStepBeyond />}
          {step === 6 && <DoneStep goalText={goalText} count={picked.size} />}
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

const STEPS = ['welcome', 'goal', 'routines', 'smart', 'tour-core', 'tour-beyond', 'done'];

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
    <div className="text-center">
      <div className="relative mx-auto w-fit">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-500 blur-2xl opacity-60 animate-pulse-soft" />
        <div
          className="relative size-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-500 grid place-items-center text-white shadow-xl shadow-violet-500/40 animate-float"
          style={{ backgroundSize: '200% 200%' }}
        >
          <BrandMark size={40} />
        </div>
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400 font-bold">Welcome to</div>
      <h2
        className="text-3xl font-extrabold mt-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent animate-gradient"
        style={{ backgroundSize: '200% 200%' }}
      >
        Routinely
      </h2>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
        A local-first tracker for routines, notes, reminders & goals.
        Hindi, English, ya dono mil ke — type karo, hum samajh lenge.
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-2 text-left text-xs">
        <li className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Check size={13} className="text-violet-500 shrink-0 mt-0.5" />
          <span><strong>Habits</strong><br/><span className="text-slate-500 text-[10px]">streaks, counts, days</span></span>
        </li>
        <li className="flex items-start gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Check size={13} className="text-cyan-500 shrink-0 mt-0.5" />
          <span><strong>Reminders</strong><br/><span className="text-slate-500 text-[10px]">smart, repeating, .ics</span></span>
        </li>
        <li className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Check size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <span><strong>Notes</strong><br/><span className="text-slate-500 text-[10px]">markdown + templates</span></span>
        </li>
        <li className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
          <span><strong>Local-first</strong><br/><span className="text-slate-500 text-[10px]">no account, no cloud</span></span>
        </li>
      </ul>
      <p className="mt-4 text-[10px] text-slate-400">Takes about 30 seconds to set up.</p>
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

// Showpiece: a few real phrases the parser handles, mixing English + Hinglish.
// Each row renders the original phrase plus the live-parsed chips below it.
// The two trailing routine examples specifically demo the description-split
// syntax (parens + colon) that powers auto-fill on the Routines form.
const SMART_EXAMPLES = [
  { kind: 'reminder', phrase: 'remind me to call manav tomorrow at 8' },
  { kind: 'reminder', phrase: 'kal subah 7 baje yoga' },
  { kind: 'reminder', phrase: 'parso dopahar meeting' },
  { kind: 'reminder', phrase: 'pay rent on the 5th' },
  { kind: 'reminder', phrase: 'in 30 mins check the oven' },
  { kind: 'routine', phrase: 'har roz 8 glass paani peena' },
  { kind: 'routine', phrase: '💪 workout (30 min strength) weekdays at 6:30am' },
  { kind: 'routine', phrase: 'read 20 pages every evening: build the reading habit' },
];

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatWhen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function ParsedChip({ icon: Icon, label, tint }) {
  return (
    <span className={cn('inline-flex items-center gap-1 chip text-[10px] border', tint)}>
      {Icon && <Icon size={10} />}
      <span className="font-semibold">{label}</span>
    </span>
  );
}

function SmartDemoRow({ kind, phrase }) {
  const parsed = parseSmart(phrase);
  // Routines split a parsed title at separators (`(...)`, `:`, `—`, `-`) into
  // name + description on the form. Mirror that here so the demo accurately
  // reflects what the user will see.
  const split = kind === 'routine' ? splitTitle(parsed.title) : null;
  const displayName = split ? split.name : parsed.title;
  const displayDescription = split ? split.description : '';
  return (
    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="chip text-[9px] bg-violet-500/15 text-violet-700 dark:text-violet-300 uppercase tracking-wider">{kind}</span>
        <code className="text-xs text-slate-700 dark:text-slate-200 truncate">"{phrase}"</code>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5">
        <Wand2 size={10} className="text-violet-500" /> parsed →
      </div>
      <div className="flex flex-wrap gap-1.5">
        {parsed.icon && (
          <ParsedChip label={<span className="text-base leading-none">{parsed.icon}</span>} tint="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30" />
        )}
        {parsed.when && (
          <ParsedChip icon={Clock} label={formatWhen(parsed.when)} tint="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30" />
        )}
        {!parsed.when && parsed.time && (
          <ParsedChip icon={Clock} label={parsed.time} tint="bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30" />
        )}
        {parsed.days && (
          <ParsedChip
            icon={CalendarDays}
            label={parsed.days.length === 7 ? 'every day' : parsed.days.map((d) => DAY_LETTER[d]).join(' · ')}
            tint="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/30"
          />
        )}
        {parsed.repeat !== 'none' && !parsed.days && (
          <ParsedChip icon={Repeat} label={parsed.repeat} tint="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/30" />
        )}
        {parsed.goalCount > 0 && (
          <ParsedChip icon={Hash} label={`${parsed.goalCount}${parsed.unit ? ` ${parsed.unit}` : ''}`} tint="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30" />
        )}
        {parsed.priority === 'high' && (
          <ParsedChip icon={AlertTriangle} label="high" tint="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30" />
        )}
        {parsed.category && (
          <ParsedChip icon={Tag} label={parsed.category} tint="bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-400/30" />
        )}
        {displayDescription && (
          <ParsedChip icon={FileText} label={displayDescription} tint="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/30" />
        )}
        {displayName && (
          <span className="text-[11px] text-slate-500 ml-1">→ <em className="text-slate-700 dark:text-slate-200 font-medium not-italic">{displayName}</em></span>
        )}
      </div>
    </div>
  );
}

function SmartDemoStep() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-500 grid place-items-center text-white shadow animate-gradient" style={{ backgroundSize: '200% 200%' }}>
          <Wand2 size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">Type freely · Hindi or English</h2>
          <p className="text-[11px] text-slate-500">The parser fills the form for you — review and save.</p>
        </div>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto scroll-area pr-1">
        {SMART_EXAMPLES.map((ex) => (
          <SmartDemoRow key={ex.phrase} kind={ex.kind} phrase={ex.phrase} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
        Mix English + Hinglish freely · <code>kal</code>, <code>parso</code>, <code>subah</code>, <code>dopahar</code>, <code>shaam</code>, <code>raat</code>, <code>har roz</code>, <code>baje</code>, <code>@gym</code> and <code>every other week</code> all work — common typos (<code>subha</code>, <code>dupahar</code>, <code>rat</code>, <code>sham</code>) too.
        Quantities like <code>5 km</code>, <code>20 lbs</code>, <code>8 glasses</code>, <code>30 pages</code> are recognized.
        Type a one-off date on the Routines tab (or a recurring habit on Reminders) and we'll suggest switching to the right surface.
      </p>
      <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-[11px] leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-300 mb-1">
          <Sparkles size={11} /> New on Routines — fill the description in one line
        </div>
        <div className="text-slate-600 dark:text-slate-300">
          Wrap it in <code className="px-1 rounded bg-white/70 dark:bg-white/10">(parens)</code>, or follow with <code className="px-1 rounded bg-white/70 dark:bg-white/10">:</code> / <code className="px-1 rounded bg-white/70 dark:bg-white/10">—</code>:
        </div>
        <div className="mt-1.5 flex flex-col gap-1 font-mono text-[10.5px]">
          <code className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-white/10">workout <span className="text-violet-600 dark:text-violet-300">(30 min strength)</span> weekdays at 7am</code>
          <code className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-white/10">meditate<span className="text-violet-600 dark:text-violet-300">: calm the mind</span> daily</code>
        </div>
        <div className="mt-1.5 text-slate-500 dark:text-slate-400">
          Description is now required on routines — having a "why" makes streaks stick.
        </div>
      </div>
    </div>
  );
}

// Day-to-day features — the surfaces a user touches most. New for this
// release: a Smart-input cross-tab hint that suggests Reminder-vs-Routine,
// and Calendar feeds for subscribing to public .ics holiday/personal feeds.
const FEATURES_CORE = [
  { icon: Wand2, title: 'Smart input', body: 'Type Hindi or English: "kal subah 8 baje yoga", "har roz 8 glass paani". Typos like "rat", "subha", "dupahar" all parse. On Routines, wrap a description in (parens) or after ":" / "—" and it auto-fills the Description field. We also suggest switching tabs when the input looks like the wrong surface.', gradient: 'from-violet-600 via-fuchsia-500 to-cyan-500' },
  { icon: Calendar, title: 'Today', body: 'Streaks, weekly heat strip (calendar week, today highlighted), swipe-to-check, drag-reorder. Time chip shows AM/PM.', gradient: 'from-violet-500 to-fuchsia-500' },
  { icon: ListChecks, title: 'Routines', body: 'Habits with time, days, counts, colors. Description is required (forces a "why"). Categories you type once are remembered and offered as suggestions next time. One-tap "remind me" turns any routine into a daily reminder.', gradient: 'from-cyan-500 to-sky-500' },
  { icon: Bell, title: 'Reminders', body: 'Date + time picker, repeats, smart parser. Export to Apple/Google Calendar via .ics.', gradient: 'from-indigo-500 to-blue-500' },
  { icon: CalendarDays, title: 'Calendar', body: 'Month grid: routine completion, notes, reminders. Holiday names show as colored chips on the day; click any date to see its full breakdown.', gradient: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Calendar feeds', body: 'Subscribe to public .ics calendars — holidays preset (India / US / UK) or paste your own iCloud / Google share link. Imports run client-side; refreshes through a free CORS proxy.', gradient: 'from-cyan-500 to-blue-500' },
  { icon: Target, title: 'Goals', body: 'Link routines, watch 30-day rolling progress.', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Timer, title: 'Pomodoro', body: 'Focus timer that can auto-check a linked routine.', gradient: 'from-rose-500 to-orange-500' },
];

// Reflective + power-user surfaces. New: Journal write-in-place + 90-day
// streak grid, the News page (Guardian + Video / cricket-first), and the
// full-app Freeze overlay.
const FEATURES_BEYOND = [
  { icon: BookOpen, title: 'Journal', body: 'Write today\'s entry in-place, edit any past entry, see your streak and a 90-day consistency grid.', gradient: 'from-violet-500 to-purple-500' },
  { icon: StickyNote, title: 'Notes', body: 'Markdown, tags, pinning, voice dictation. Templates for journal, meetings, decisions, ideas.', gradient: 'from-rose-500 to-pink-500' },
  { icon: Newspaper, title: 'News', body: 'Curated headlines + video (Guardian sections + YouTube channels: News / Auto / Sports / World — Sports leans cricket: ESPNcricinfo, ICC, IPL, Cricbuzz, BCCI). Cached 30 min, in-app filter.', gradient: 'from-rose-500 to-orange-500' },
  { icon: BarChart3, title: 'Stats & badges', body: 'Charts, streak insights, achievement unlocks.', gradient: 'from-cyan-500 to-emerald-500' },
  { icon: Snowflake, title: 'Freeze day', body: 'Vacation or sick? Freeze today — the whole app frosts over and the streak is preserved. Only the blinking Freeze button (and News) stay clickable; click again to thaw.', gradient: 'from-cyan-500 to-sky-500' },
  { icon: Inbox, title: 'Quick capture', body: 'Brain-dump → convert into note, reminder, or routine.', gradient: 'from-amber-500 to-pink-500' },
  { icon: Search, title: 'Command palette', body: '⌘K to jump anywhere & run any action.', gradient: 'from-violet-500 to-cyan-500' },
  { icon: User, title: 'Profiles', body: 'Separate spaces (e.g. Work / Home) with their own data.', gradient: 'from-rose-500 to-orange-500' },
  { icon: Lock, title: 'Encrypted backup', body: 'AES-256 export blob + JSON/CSV export & import.', gradient: 'from-emerald-500 to-cyan-500' },
  { icon: Smartphone, title: 'Install as PWA', body: 'Works offline; reminders ring after closing the tab.', gradient: 'from-indigo-500 to-blue-500' },
];

function FeatureGrid({ features }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/70 dark:border-white/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('size-6 rounded-md bg-gradient-to-tr text-white grid place-items-center shrink-0', f.gradient)}>
                <Icon size={12} />
              </div>
              <span className="font-semibold text-[11px] truncate">{f.title}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">{f.body}</p>
          </div>
        );
      })}
    </div>
  );
}

function FeaturesStepCore() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-500 grid place-items-center text-white shadow">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">What's inside · day-to-day</h2>
          <p className="text-[11px] text-slate-500">The surfaces you'll use every day.</p>
        </div>
      </div>
      <FeatureGrid features={FEATURES_CORE} />
      <p className="mt-3 text-[11px] text-slate-400 italic">
        Next page: reflection, news, freeze day, and power-user tools.
      </p>
    </div>
  );
}

function FeaturesStepBeyond() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 grid place-items-center text-white shadow">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">What's inside · beyond</h2>
          <p className="text-[11px] text-slate-500">Reflection, discovery, and power-user surfaces.</p>
        </div>
      </div>
      <FeatureGrid features={FEATURES_BEYOND} />
      <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
        <Keyboard size={11} className="shrink-0" />
        Press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10">?</kbd> anytime for the full shortcut sheet ·
        <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10">i</kbd> for quick capture ·
        <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10">⌘K</kbd> to search.
      </p>
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
          <>Routinely is ready. Add routines, notes, and reminders as they come up.</>
        )}
      </p>
      <p className="text-xs text-slate-400 mt-4">
        Tip: enable browser notifications when you create a reminder so it can ring even when this tab is closed.
      </p>
    </div>
  );
}
