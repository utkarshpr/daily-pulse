import React from 'react';
import { Sparkles, ListChecks, StickyNote, Bell, BarChart3, Calendar, Download, Upload, Menu, X, CalendarDays, Target, Lock, Unlock, Printer, Search, Inbox, BookOpen, Volume2, Keyboard, FileSpreadsheet, Compass, Smartphone, ChevronDown, HelpCircle, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';
import { PRESETS } from '../lib/presets';
import { SOUND_PACKS, playChime } from '../lib/chime';
import ProfileSwitcher from './ProfileSwitcher';

const NAV = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'tasks', label: 'Routines', icon: ListChecks },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

const MOBILE_NAV = NAV.filter((n) => ['today', 'tasks', 'notes', 'reminders', 'calendar'].includes(n.id));

export default function Sidebar({
  active, setActive, theme, setTheme, preset, setPreset,
  onExport, onImport, onEncrypt, onDecrypt, onPrint, onCsvExport,
  onOpenPalette, onOpenCapture, onOpenCheatSheet, onRestartTour, onInstallApp,
  inboxCount = 0,
  soundPack, setSoundPack,
  profiles, activeProfile, onSwitchProfile, onCreateProfile, onRenameProfile, onDeleteProfile,
}) {
  const fileRef = React.useRef(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleImport = (e) => {
    const f = e.target.files?.[0];
    if (f) onImport(f);
    e.target.value = '';
  };

  const NavButton = ({ item, compact = false }) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    return (
      <button
        onClick={() => { setActive(item.id); setDrawerOpen(false); }}
        className={cn(
          'relative flex items-center rounded-xl text-sm font-medium transition shrink-0',
          compact ? 'flex-col gap-0.5 px-3 py-2 min-w-[64px]' : 'gap-3 px-3 py-2.5 w-full',
          isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5'
        )}
      >
        {isActive && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/20" />
        )}
        <Icon size={compact ? 18 : 17} className="relative z-10" />
        <span className={cn('relative z-10', compact && 'text-[10px] uppercase tracking-wider')}>
          {item.label}
        </span>
      </button>
    );
  };

  const PresetSwatches = () => (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">Mood</div>
      <div className="flex gap-1.5">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={cn('flex-1 h-8 rounded-lg transition relative overflow-hidden', preset === key && 'ring-2 ring-offset-2 ring-offset-transparent ring-violet-500')}
            style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]}, ${p.swatch[2]})` }}
            title={p.label}
            aria-label={p.label}
          />
        ))}
      </div>
    </div>
  );

  const SoundPicker = () => (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1 flex items-center gap-1">
        <Volume2 size={10} /> Reminder sound
      </div>
      <div className="grid grid-cols-2 gap-1">
        {Object.entries(SOUND_PACKS).map(([k, p]) => (
          <button
            key={k}
            onClick={() => { setSoundPack(k); playChime(k); }}
            className={cn(
              'text-[11px] font-semibold px-2 py-1 rounded-md transition border',
              soundPack === k
                ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent shadow'
                : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
            )}
            title={p.description}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden card p-3 flex items-center gap-2 sticky z-40"
        style={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}
      >
        <div className="size-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30 shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold leading-tight text-sm">Daily Pulse</div>
          <div className="text-[10px] text-slate-500 leading-tight truncate">
            {NAV.find((n) => n.id === active)?.label}
          </div>
        </div>
        <button onClick={onOpenCapture} className="size-9 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center relative" aria-label="Quick capture" title="Quick capture (i)">
          <Inbox size={15} />
          {inboxCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white text-[9px] font-bold grid place-items-center">{inboxCount > 9 ? '9+' : inboxCount}</span>
          )}
        </button>
        <button onClick={onOpenPalette} className="size-9 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center" aria-label="Open command palette" title="Search (⌘K)">
          <Search size={15} />
        </button>
        <ThemeToggle theme={theme} setTheme={setTheme} compact />
        <button onClick={() => setDrawerOpen(true)} className="size-9 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center" aria-label="Open menu">
          <Menu size={16} />
        </button>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed left-3 right-3 z-30 card p-1.5 flex items-center justify-between overflow-x-auto scroll-area no-print"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        {MOBILE_NAV.map((n) => (<NavButton key={n.id} item={n} compact />))}
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)}>
          <div
            className="absolute right-3 left-3 card p-4 pt-5 animate-pop-in overflow-y-auto scroll-area"
            style={{
              top: 'calc(1rem + env(safe-area-inset-top))',
              maxHeight: 'calc(100vh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Settings</div>
              <button onClick={() => setDrawerOpen(false)} className="size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center" aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="mb-3">
              <ProfileSwitcher
                profiles={profiles}
                activeId={activeProfile}
                onSwitch={onSwitchProfile}
                onCreate={onCreateProfile}
                onRename={onRenameProfile}
                onDelete={onDeleteProfile}
              />
            </div>
            <div className="space-y-1 mb-3">
              {NAV.filter((n) => !MOBILE_NAV.find((m) => m.id === n.id)).map((n) => (<NavButton key={n.id} item={n} />))}
            </div>
            <div className="mb-3"><div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 px-1">Theme</div><ThemeToggle theme={theme} setTheme={setTheme} /></div>
            <div className="mb-3"><PresetSwatches /></div>
            <div className="mb-3"><SoundPicker /></div>

            <details className="group rounded-xl border border-slate-200/70 dark:border-white/10 mb-2 bg-white/40 dark:bg-white/[0.02]">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium select-none">
                <span className="flex items-center gap-2"><HelpCircle size={14} /> Help &amp; install</span>
                <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-slate-400" />
              </summary>
              <div className="p-2 pt-0 space-y-1">
                <button onClick={onOpenCheatSheet} className="w-full btn-ghost justify-start"><Keyboard size={14} /> Keyboard shortcuts</button>
                {onRestartTour && (
                  <button onClick={onRestartTour} className="w-full btn-ghost justify-start"><Compass size={14} /> Restart tour</button>
                )}
                {onInstallApp && (
                  <button onClick={onInstallApp} className="w-full btn-ghost justify-start"><Smartphone size={14} /> Install app</button>
                )}
              </div>
            </details>

            <details className="group rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2.5 text-sm font-medium select-none">
                <span className="flex items-center gap-2"><Database size={14} /> Backup &amp; data</span>
                <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-slate-400" />
              </summary>
              <div className="p-2 pt-0 space-y-1">
                <button onClick={onExport} className="w-full btn-ghost justify-start"><Download size={14} /> Export JSON</button>
                <button onClick={onCsvExport} className="w-full btn-ghost justify-start"><FileSpreadsheet size={14} /> Export CSV</button>
                <button onClick={() => fileRef.current?.click()} className="w-full btn-ghost justify-start"><Upload size={14} /> Import JSON</button>
                <button onClick={onEncrypt} className="w-full btn-ghost justify-start"><Lock size={14} /> Encrypted backup</button>
                <button onClick={onDecrypt} className="w-full btn-ghost justify-start"><Unlock size={14} /> Restore from blob</button>
                <button onClick={onPrint} className="w-full btn-ghost justify-start"><Printer size={14} /> Print today</button>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-64 shrink-0 no-print">
        <div className="card p-4 lg:h-full flex flex-col">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold leading-tight">Daily Pulse</div>
              <div className="text-[11px] text-slate-500 leading-tight">Local-first tracker</div>
            </div>
          </div>

          <div className="mt-3">
            <ProfileSwitcher
              profiles={profiles}
              activeId={activeProfile}
              onSwitch={onSwitchProfile}
              onCreate={onCreateProfile}
              onDelete={onDeleteProfile}
            />
          </div>

          <button
            onClick={onOpenPalette}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 text-xs text-slate-500 hover:bg-white dark:hover:bg-white/10 transition"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="text-[10px] bg-white/60 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">⌘K</kbd>
          </button>
          <button
            onClick={onOpenCapture}
            className="mt-1.5 w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-tr from-violet-600/10 to-cyan-500/10 border border-violet-500/20 text-xs text-slate-700 dark:text-slate-200 hover:from-violet-600/20 hover:to-cyan-500/20 transition"
          >
            <Inbox size={13} className="text-violet-500" />
            <span className="flex-1 text-left">Quick capture{inboxCount > 0 ? ` · ${inboxCount}` : ''}</span>
            <kbd className="text-[10px] bg-white/60 dark:bg-white/10 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">I</kbd>
          </button>

          <nav className="mt-3 space-y-1 flex-1 overflow-y-auto scroll-area">
            {NAV.map((n) => (<NavButton key={n.id} item={n} />))}
          </nav>

          <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-white/10">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <PresetSwatches />
            <SoundPicker />
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onOpenCheatSheet} className="btn-ghost text-[11px]">
                <Keyboard size={12} /> Shortcuts
              </button>
              {onRestartTour && (
                <button onClick={onRestartTour} className="btn-ghost text-[11px]">
                  <Compass size={12} /> Tour
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onExport} className="btn-ghost text-[11px] !px-2"><Download size={12} /> JSON</button>
              <button onClick={onCsvExport} className="btn-ghost text-[11px] !px-2"><FileSpreadsheet size={12} /> CSV</button>
              <button onClick={() => fileRef.current?.click()} className="btn-ghost text-[11px] !px-2"><Upload size={12} /> Import</button>
              <button onClick={onPrint} className="btn-ghost text-[11px] !px-2"><Printer size={12} /> Print</button>
              <button onClick={onEncrypt} className="btn-ghost text-[11px] !px-2"><Lock size={12} /> Encrypt</button>
              <button onClick={onDecrypt} className="btn-ghost text-[11px] !px-2"><Unlock size={12} /> Restore</button>
            </div>
          </div>
        </div>
      </aside>

      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
    </>
  );
}
