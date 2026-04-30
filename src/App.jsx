import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Today from './components/Today';
import Tasks from './components/Tasks';
import Notes from './components/Notes';
import Reminders from './components/Reminders';
import Stats from './components/Stats';
import Splash from './components/Splash';
import ReminderAlert from './components/ReminderAlert';
import CalendarView from './components/CalendarView';
import GoalsView from './components/GoalsView';
import Pomodoro from './components/Pomodoro';
import ReviewPrompt from './components/ReviewPrompt';
import CommandPalette from './components/CommandPalette';
import EncryptDialog from './components/EncryptDialog';
import QuickCapture from './components/QuickCapture';
import InboxPanel from './components/InboxPanel';
import Journal from './components/Journal';
import News from './components/News';
import FreezeOverlay from './components/FreezeOverlay';
import WeeklySummary from './components/WeeklySummary';
import OnThisDay from './components/OnThisDay';
import CheatSheet from './components/CheatSheet';
import Onboarding from './components/Onboarding';
import RouteLoader from './components/RouteLoader';
import InstallPrompt from './components/InstallPrompt';
import { useLocalStorage, useProfileStorage } from './hooks/useLocalStorage';
import { useConfirm } from './hooks/useConfirm';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { syncAllViaSw, requestPushPermission, pushPermission } from './lib/push';
import { uid, todayKey } from './lib/utils';
import { playChime, vibrate } from './lib/chime';
import { nextOccurrence } from './lib/recurrence';
import { applyPreset } from './lib/presets';
import { computeBadgeStates, BADGES } from './lib/badges';
import { completionsToCSV, downloadCSV } from './lib/csv';
import { Spinner } from './components/Splash';

const SEED_TASKS = [
  { id: uid(), name: 'Hydrate (1 glass of water)', icon: '💧', time: '07:00', color: 'cyan', days: [0,1,2,3,4,5,6], category: 'Morning', description: 'Start the day with water' },
  { id: uid(), name: 'Move your body', icon: '🏃', time: '07:30', color: 'emerald', days: [1,2,3,4,5], category: 'Health', description: '20+ min of movement' },
  { id: uid(), name: 'Deep work block', icon: '🧠', time: '10:00', color: 'violet', days: [1,2,3,4,5], category: 'Work', description: 'Single-task on what matters' },
  { id: uid(), name: 'Reflect & journal', icon: '📓', time: '21:00', color: 'amber', days: [0,1,2,3,4,5,6], category: 'Evening', description: '3 lines about the day' },
];

export default function App() {
  // ---- Profiles (global) ----
  const [profiles, setProfiles] = useLocalStorage('dp.profiles.list', [{ id: 'default', name: 'Default', color: 'violet' }]);
  const [activeProfile, setActiveProfile] = useLocalStorage('dp.profiles.active', 'default');

  // ---- Per-profile data ----
  const [tasks, setTasks] = useProfileStorage(activeProfile, 'tasks.v1', SEED_TASKS);
  const [completions, setCompletions] = useProfileStorage(activeProfile, 'completions.v1', {});
  const [notes, setNotes] = useProfileStorage(activeProfile, 'notes.v1', []);
  const [reminders, setReminders] = useProfileStorage(activeProfile, 'reminders.v1', []);
  const [goals, setGoals] = useProfileStorage(activeProfile, 'goals.v1', []);
  const [reviews, setReviews] = useProfileStorage(activeProfile, 'reviews.v1', {});
  const [inbox, setInbox] = useProfileStorage(activeProfile, 'inbox.v1', []);
  const [seenBadges, setSeenBadges] = useProfileStorage(activeProfile, 'seenBadges.v1', []);
  const [pomodoro, setPomodoro] = useProfileStorage(activeProfile, 'pomodoro.v1', { focus: 25, break: 5 });
  const [pomoState, setPomoState] = useProfileStorage(activeProfile, 'pomoState.v1', {
    mode: 'focus',
    endTime: null,
    remaining: 25 * 60,
    completedFocuses: 0,
    linkedTaskId: '',
    completedFocusesDate: null, // YYYY-MM-DD — counter resets on date change
  });
  const [reviewTime, setReviewTime] = useProfileStorage(activeProfile, 'reviewTime.v1', '21:30');
  const [freezes, setFreezes] = useProfileStorage(activeProfile, 'freezes.v1', []);
  const [skips, setSkips] = useProfileStorage(activeProfile, 'skips.v1', {});
  const [routineNotes, setRoutineNotes] = useProfileStorage(activeProfile, 'routineNotes.v1', {});
  const [weeklyDismissed, setWeeklyDismissed] = useProfileStorage(activeProfile, 'weeklyDismissed.v1', '');
  // External calendar subscriptions — each feed: { id, name, url?, source: 'url'|'file', events: [...], importedAt, color }.
  const [icsFeeds, setIcsFeeds] = useProfileStorage(activeProfile, 'icsFeeds.v1', []);

  // ---- Global UI state ----
  const [active, setActive] = useLocalStorage('dp.active.v1', 'today');
  const [theme, setTheme] = useLocalStorage('dp.theme.v1', 'light');
  const [preset, setPreset] = useLocalStorage('dp.preset.v1', 'aurora');
  const [soundPack, setSoundPack] = useLocalStorage('dp.soundPack.v1', 'chime');
  const [onboarded, setOnboarded] = useLocalStorage('dp.onboarded.v1', false);
  const [installPromptShown, setInstallPromptShown] = useLocalStorage('dp.installPromptShown.v1', false);

  // ---- Ephemeral state ----
  const [viewDate, setViewDate] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [booting, setBooting] = useState(true);
  const [alertQueue, setAlertQueue] = useState([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Hand-off when SmartInput on one tab detects the input belongs on the
  // other (e.g. a one-shot date typed on Routines → suggest Reminders).
  // Shape: { target: 'reminder' | 'routine', raw: string, parsed: object }.
  const [pendingCapture, setPendingCapture] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [encryptMode, setEncryptMode] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const titleTimerRef = useRef(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    applyPreset(preset, theme);
  }, [theme, preset]);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Onboarding: show on first launch, after splash
  useEffect(() => {
    if (booting || onboarded) return;
    const t = setTimeout(() => setOnboardingOpen(true), 200);
    return () => clearTimeout(t);
  }, [booting, onboarded]);

  // Install prompt: shown right after onboarding the very first time, only on
  // mobile/web where add-to-home-screen makes sense. Skipped if already running
  // standalone.
  useEffect(() => {
    if (booting || onboardingOpen || installPromptShown) return;
    if (!onboarded) return; // wait for onboarding to be either done or skipped
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) return;
    const t = setTimeout(() => setInstallOpen(true), 600);
    return () => clearTimeout(t);
  }, [booting, onboardingOpen, onboarded, installPromptShown]);

  // Sync pending reminders to the service worker so they fire even when this
  // tab is closed (subject to browser permission + Notification Triggers / SW
  // lifetime).
  useEffect(() => {
    syncAllViaSw(reminders);
  }, [reminders]);

  // ---- Pomodoro timer (lifted to App so it survives navigation) ----
  // A 1Hz ticker only runs while a timer is active. Time math derives from
  // endTime so it stays correct even if the component remounts.
  const [, pomoForce] = useState(0);
  useEffect(() => {
    if (!pomoState.endTime) return;
    const t = setInterval(() => pomoForce((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [pomoState.endTime]);

  const pomoSeconds = pomoState.endTime
    ? Math.max(0, Math.round((pomoState.endTime - Date.now()) / 1000))
    : pomoState.remaining;

  // Reset focus-counter daily
  useEffect(() => {
    const today = todayKey();
    if (pomoState.completedFocusesDate && pomoState.completedFocusesDate !== today) {
      setPomoState((cur) => ({ ...cur, completedFocuses: 0, completedFocusesDate: today }));
    }
  }, [pomoState.completedFocusesDate, setPomoState]);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (!pomoState.endTime) return;
    if (pomoSeconds > 0) return;
    // Capture current mode for messaging before mutating
    const finishedMode = pomoState.mode;
    playChime(soundPack);
    vibrate();
    setPomoState((cur) => {
      if (cur.mode === 'focus') {
        if (cur.linkedTaskId) completeTaskForTodayInline(cur.linkedTaskId);
        return {
          ...cur,
          mode: 'break',
          endTime: null,
          remaining: (pomodoro.break ?? 5) * 60,
          completedFocuses: cur.completedFocuses + 1,
          completedFocusesDate: todayKey(),
        };
      }
      return {
        ...cur,
        mode: 'focus',
        endTime: null,
        remaining: (pomodoro.focus ?? 25) * 60,
      };
    });
    flash(finishedMode === 'focus' ? 'Focus complete — break time' : 'Break over — back to focus');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomoSeconds, pomoState.endTime]);

  // Sync remaining to current preset when paused & idle
  useEffect(() => {
    if (pomoState.endTime) return;
    const total = (pomoState.mode === 'focus' ? pomodoro.focus : pomodoro.break) * 60;
    if (pomoState.remaining !== total) {
      setPomoState((cur) => ({ ...cur, remaining: total }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.focus, pomodoro.break, pomoState.mode, pomoState.endTime]);

  // Inline avoids forward-reference; calls into the same logic as below.
  const completeTaskForTodayInline = (taskId) => {
    const k = todayKey();
    setCompletions((prev) => {
      const day = { ...(prev[k] || {}) };
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.goalCount > 0) {
        const cur = typeof day[taskId] === 'number' ? day[taskId] : 0;
        day[taskId] = cur + 1;
      } else {
        day[taskId] = new Date().toISOString();
      }
      return { ...prev, [k]: day };
    });
  };

  const pomoActions = {
    toggle: () => {
      setPomoState((cur) => {
        if (cur.endTime) {
          // Pause
          return {
            ...cur,
            remaining: Math.max(0, Math.round((cur.endTime - Date.now()) / 1000)),
            endTime: null,
          };
        }
        // Start
        const total = (cur.mode === 'focus' ? pomodoro.focus : pomodoro.break) * 60;
        const r = cur.remaining > 0 ? cur.remaining : total;
        return { ...cur, remaining: 0, endTime: Date.now() + r * 1000 };
      });
    },
    reset: () => {
      setPomoState((cur) => ({
        ...cur,
        endTime: null,
        remaining: (cur.mode === 'focus' ? pomodoro.focus : pomodoro.break) * 60,
      }));
    },
    switchMode: (m) => {
      setPomoState((cur) => ({
        ...cur,
        mode: m,
        endTime: null,
        remaining: (m === 'focus' ? pomodoro.focus : pomodoro.break) * 60,
      }));
    },
    setLinkedTaskId: (id) => setPomoState((cur) => ({ ...cur, linkedTaskId: id })),
  };

  // Service worker can postMessage when a system notification is clicked
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMsg = (e) => {
      if (e.data?.type === 'reminder-clicked' && e.data.id) {
        // Mark as fired so the in-app alert flow handles the rest
        setReminders((prev) =>
          prev.map((r) => (r.id === e.data.id ? { ...r, fired: true } : r))
        );
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, []);

  // Reminder firing
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = reminders.filter(
        (r) => !r.done && !r.fired && r.when && new Date(r.when).getTime() <= now
      );
      if (due.length === 0) return;
      setReminders((prev) =>
        prev.map((r) => (due.find((d) => d.id === r.id) ? { ...r, fired: true } : r))
      );
      setAlertQueue((prev) => [...prev, ...due]);
      const hasHigh = due.some((r) => r.priority === 'high');
      playChime(hasHigh ? 'alarm' : soundPack);
      vibrate(hasHigh ? [400, 200, 400, 200, 600] : [200, 100, 200, 100, 400]);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        due.forEach((r) => {
          try {
            new Notification((r.priority === 'high' ? '🚨 ' : '⏰ ') + r.title, {
              body: r.notes || 'Reminder is due',
              tag: r.id,
            });
          } catch { /* ignore */ }
        });
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [reminders, setReminders, soundPack]);

  // Review prompt
  useEffect(() => {
    const check = () => {
      const k = todayKey();
      if (reviews[k]) return;
      const [h, m] = (reviewTime || '21:30').split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h || 21, m || 30, 0, 0);
      if (now >= target) setReviewOpen(true);
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [reviews, reviewTime]);

  // Title flash
  useEffect(() => {
    if (alertQueue.length === 0) {
      if (titleTimerRef.current) {
        clearInterval(titleTimerRef.current);
        titleTimerRef.current = null;
      }
      document.title = 'Daily Pulse — Track your routines, notes & reminders';
      return;
    }
    let on = false;
    titleTimerRef.current = setInterval(() => {
      on = !on;
      document.title = on ? '⏰ Reminder is due' : 'Daily Pulse';
    }, 900);
    return () => { if (titleTimerRef.current) clearInterval(titleTimerRef.current); };
  }, [alertQueue.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const map = { t: 'today', r: 'tasks', g: 'goals', c: 'calendar', n: 'notes', m: 'reminders', s: 'stats', j: 'journal' };
      if (map[k]) { e.preventDefault(); setActive(map[k]); }
      if (k === 'i') { e.preventDefault(); setCaptureOpen(true); }
      if (e.key === '?') { e.preventDefault(); setCheatOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reset scroll position whenever the user switches tabs. Without this, a
  // long Today page leaves you mid-scroll when you click News, etc.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  // Compute badges
  const badgeStates = useMemo(
    () => computeBadgeStates({ tasks, completions, notes, reminders, goals, reviews, freezes, skips }),
    [tasks, completions, notes, reminders, goals, reviews, freezes, skips]
  );
  const earnedBadges = useMemo(() => badgeStates.filter((b) => b.earned).map((b) => b.id), [badgeStates]);

  useEffect(() => {
    const newlyEarned = earnedBadges.filter((id) => !seenBadges.includes(id));
    if (newlyEarned.length === 0) return;
    const badge = BADGES.find((b) => b.id === newlyEarned[0]);
    if (badge) flash(`${badge.icon} Achievement unlocked: ${badge.name}`);
    setSeenBadges(earnedBadges);
  }, [earnedBadges]);

  // ---- Alert handlers ----
  const currentAlert = alertQueue[0] || null;

  const dismissAlert = () => {
    if (currentAlert?.repeat && currentAlert.repeat !== 'none') {
      const next = nextOccurrence(currentAlert.when, currentAlert.repeat);
      if (next) {
        setReminders((prev) => prev.map((r) => (r.id === currentAlert.id ? { ...r, when: next, fired: false } : r)));
      }
    }
    setAlertQueue((q) => q.slice(1));
  };

  const completeAlert = () => {
    if (!currentAlert) return;
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== currentAlert.id) return r;
        if (r.repeat && r.repeat !== 'none') {
          const next = nextOccurrence(r.when, r.repeat);
          return next ? { ...r, when: next, fired: false } : { ...r, done: true };
        }
        return { ...r, done: true };
      })
    );
    setAlertQueue((q) => q.slice(1));
    flash(currentAlert.repeat && currentAlert.repeat !== 'none' ? 'Rescheduled' : 'Reminder marked done');
  };

  const snoozeAlert = (minutes) => {
    if (!currentAlert) return;
    const newWhen = new Date(Date.now() + minutes * 60_000).toISOString();
    setReminders((prev) => prev.map((r) => (r.id === currentAlert.id ? { ...r, when: newWhen, fired: false } : r)));
    setAlertQueue((q) => q.slice(1));
    flash(`Snoozed for ${minutes} min`);
  };

  // ---- I/O ----
  const exportAll = () => {
    const blob = new Blob(
      [JSON.stringify({ tasks, completions, notes, reminders, goals, reviews, inbox, freezes, skips, routineNotes, profile: profiles.find((p) => p.id === activeProfile)?.name, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-pulse-${activeProfile}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Exported your data');
  };

  const exportCsv = () => {
    if (Object.keys(completions).length === 0) {
      flash('No completion data to export', true);
      return;
    }
    const csv = completionsToCSV(tasks, completions);
    downloadCSV(`daily-pulse-completions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    flash('CSV exported');
  };

  const importAll = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      applyImportedData(data);
      flash('Imported successfully');
    } catch {
      flash('Could not read that file', true);
    }
  };

  const applyImportedData = (data) => {
    if (Array.isArray(data.tasks)) setTasks(data.tasks);
    if (data.completions && typeof data.completions === 'object') setCompletions(data.completions);
    if (Array.isArray(data.notes)) setNotes(data.notes);
    if (Array.isArray(data.reminders)) setReminders(data.reminders);
    if (Array.isArray(data.goals)) setGoals(data.goals);
    if (data.reviews && typeof data.reviews === 'object') setReviews(data.reviews);
    if (Array.isArray(data.inbox)) setInbox(data.inbox);
    if (Array.isArray(data.freezes)) setFreezes(data.freezes);
    if (data.skips && typeof data.skips === 'object') setSkips(data.skips);
    if (data.routineNotes && typeof data.routineNotes === 'object') setRoutineNotes(data.routineNotes);
  };

  const getExportPlaintext = () => JSON.stringify({ tasks, completions, notes, reminders, goals, reviews, inbox, freezes, skips, routineNotes });

  const printToday = () => {
    setActive('today');
    setTimeout(() => window.print(), 100);
  };

  // Pomodoro auto-check
  const completeTaskForToday = (taskId) => {
    const k = todayKey();
    setCompletions((prev) => {
      const day = { ...(prev[k] || {}) };
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.goalCount > 0) {
        const cur = typeof day[taskId] === 'number' ? day[taskId] : 0;
        day[taskId] = cur + 1;
      } else {
        day[taskId] = new Date().toISOString();
      }
      return { ...prev, [k]: day };
    });
    flash('Routine checked');
  };

  // ---- Toast (with optional undo) ----
  const toastTimerRef = useRef(null);
  const flash = (msg, isError = false, undo = null) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, isError, id: Date.now(), undo });
    toastTimerRef.current = setTimeout(() => setToast(null), undo ? 6000 : 2400);
  };
  const flashWithTimer = flash; // alias for backward-compat with newer call sites

  // ---- Inbox ----
  const saveToInbox = (text) => {
    if (!text?.trim()) return;
    setInbox((prev) => [{ id: uid(), text: text.trim(), createdAt: Date.now() }, ...prev]);
    flashWithTimer('Saved to inbox');
  };
  const deleteInboxItem = (item) => setInbox((prev) => prev.filter((x) => x.id !== item.id));
  const captureToNote = (text) => {
    const t = (text || '').trim();
    if (!t) return;
    const now = Date.now();
    const firstLine = t.split('\n')[0].slice(0, 80);
    const body = t.split('\n').slice(1).join('\n');
    setNotes((prev) => [{ id: uid(), title: firstLine, body, color: 'sun', pinned: false, tags: [], createdAt: now, updatedAt: now }, ...prev]);
    flashWithTimer('Saved as note');
  };
  const captureToReminder = (text) => {
    const t = (text || '').trim();
    if (!t) return;
    const when = new Date(Date.now() + 30 * 60_000).toISOString();
    setReminders((prev) => [{ id: uid(), title: t.slice(0, 100), when, notes: '', repeat: 'none', priority: 'medium', done: false, fired: false }, ...prev]);
    flashWithTimer('Reminder set in 30 min — edit to adjust');
    setActive('reminders');
  };
  // Build a reminder from a routine using its time field. Schedules for today
  // if the time is still in the future, otherwise tomorrow. Repeats daily so
  // the routine fires every day at that time.
  const reminderFromRoutine = (task) => {
    if (!task.time) {
      flashWithTimer('Add a time to this routine first', true);
      return;
    }
    const [h, m] = task.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h || 0, m || 0, 0, 0);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
    setReminders((prev) => [
      {
        id: uid(),
        title: task.name,
        when: target.toISOString(),
        notes: task.description || '',
        repeat: 'daily',
        priority: 'medium',
        done: false,
        fired: false,
      },
      ...prev,
    ]);
    flashWithTimer(`Reminder set for ${task.name} at ${task.time}`);
  };

  const captureToRoutine = (text) => {
    const t = (text || '').trim();
    if (!t) return;
    setTasks((prev) => [...prev, { id: uid(), name: t.slice(0, 80), description: '', icon: '✨', time: '', color: 'violet', days: [0,1,2,3,4,5,6], category: '', goalCount: 0, unit: '' }]);
    flashWithTimer('Routine added');
    setActive('tasks');
  };
  const convertInboxToNote = (item) => { captureToNote(item.text); deleteInboxItem(item); };
  const convertInboxToReminder = (item) => { captureToReminder(item.text); deleteInboxItem(item); };
  const convertInboxToRoutine = (item) => { captureToRoutine(item.text); deleteInboxItem(item); };

  // ---- Profiles ----
  const switchProfile = (id) => {
    setActiveProfile(id);
    flashWithTimer(`Switched to ${profiles.find((p) => p.id === id)?.name || id}`);
  };
  const createProfile = ({ name, color }) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20) + '-' + uid().slice(0, 4);
    const newP = { id, name, color };
    setProfiles((prev) => [...prev, newP]);
    setActiveProfile(id);
    flashWithTimer(`Profile "${name}" created`);
  };
  const renameProfile = (id, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      flashWithTimer('Profile name cannot be empty', true);
      return;
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
    flashWithTimer(`Renamed to "${trimmed}"`);
  };
  const deleteProfile = async (id) => {
    if (id === activeProfile) {
      flashWithTimer('Switch to a different profile first', true);
      return;
    }
    const target = profiles.find((p) => p.id === id);
    const ok = await confirm({
      title: `Delete profile "${target?.name}"?`,
      message: 'All routines, notes, reminders, and history for this profile will be permanently removed.',
      confirmLabel: 'Delete profile',
    });
    if (!ok) return;
    // Remove all keys for this profile
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(`dp.profiles.${id}.`)) localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    flashWithTimer(`Profile "${target?.name}" deleted`);
  };

  // ---- Pull-to-refresh ----
  const handleRefresh = () => {
    setRefreshSpin(true);
    // Force re-evaluation of due reminders
    setReminders((prev) => prev.map((r) => ({ ...r })));
    setTimeout(() => setRefreshSpin(false), 800);
    flashWithTimer('Refreshed');
  };
  const ptr = usePullToRefresh(handleRefresh);

  // ---- Palette helpers ----
  const navigateAndFocus = (id, focus) => {
    setActive(id);
    if (focus) setPendingFocus(focus);
  };
  useEffect(() => {
    if (!pendingFocus) return;
    const t = setTimeout(() => {
      if (pendingFocus === 'note') document.querySelector('[data-action="new-note"]')?.click();
      else if (pendingFocus === 'reminder') document.querySelector('[data-action="new-reminder"]')?.click();
      setPendingFocus(null);
    }, 60);
    return () => clearTimeout(t);
  }, [pendingFocus, active]);

  // Today completion stats for review prompt
  const todayCompletionStats = (() => {
    const dow = new Date().getDay();
    const dayTasks = tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(dow));
    const c = completions[todayKey()] || {};
    return { completed: dayTasks.filter((t) => c[t.id]).length, total: dayTasks.length };
  })();

  // True only when *today* (live wall-clock day) is in the frozen set.
  // Freezing past days is retrospective and shouldn't paralyze the live UI.
  const isFrozenToday = freezes.includes(todayKey());

  return (
    <>
      {booting && <Splash />}

      <FreezeOverlay active={isFrozenToday} />

      <RouteLoader route={active + activeProfile} />

      {(ptr.pull > 0 || refreshSpin) && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center text-violet-500 transition-all pointer-events-none"
          style={{ height: refreshSpin ? 50 : Math.min(ptr.pull, 80), opacity: refreshSpin ? 1 : Math.min(1, ptr.pull / 60) }}
        >
          <div className={ptr.ready || refreshSpin ? 'animate-spin' : ''}><Spinner size={20} /></div>
        </div>
      )}

      {/* Frosted safe-area strips for mobile/PWA — gives the status bar and home
          indicator zone a blurred backdrop so scrolling content doesn't bleed
          through. Heights include the small bar offsets so the blur is also
          visible in regular browsers where the safe-area envs resolve to 0. */}
      <div
        aria-hidden="true"
        className="lg:hidden fixed top-0 left-0 right-0 z-[35] pointer-events-none bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl"
        style={{ height: 'calc(0.75rem + env(safe-area-inset-top))' }}
      />
      <div
        aria-hidden="true"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[25] pointer-events-none bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl"
        style={{ height: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      />

      <div className="min-h-screen p-3 lg:p-6 pb-24 lg:pb-6">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-3 lg:gap-6">
          <Sidebar
            active={active}
            setActive={setActive}
            theme={theme}
            setTheme={setTheme}
            preset={preset}
            setPreset={setPreset}
            soundPack={soundPack}
            setSoundPack={setSoundPack}
            onExport={exportAll}
            onImport={importAll}
            onCsvExport={exportCsv}
            onEncrypt={() => setEncryptMode('encrypt')}
            onDecrypt={() => setEncryptMode('decrypt')}
            onPrint={printToday}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenCapture={() => setCaptureOpen(true)}
            onOpenCheatSheet={() => setCheatOpen(true)}
            onRestartTour={() => setOnboardingOpen(true)}
            onInstallApp={() => setInstallOpen(true)}
            inboxCount={inbox.length}
            profiles={profiles}
            activeProfile={activeProfile}
            onSwitchProfile={switchProfile}
            onCreateProfile={createProfile}
            onRenameProfile={renameProfile}
            onDeleteProfile={deleteProfile}
            frozen={isFrozenToday}
          />
          <main className="flex-1 min-w-0">
            <div key={active + activeProfile} className="animate-fade-in space-y-6">
              {active === 'today' && (
                <>
                  <WeeklySummary
                    tasks={tasks}
                    completions={completions}
                    notes={notes}
                    reviews={reviews}
                    dismissed={weeklyDismissed}
                    setDismissed={setWeeklyDismissed}
                  />
                  <OnThisDay tasks={tasks} completions={completions} notes={notes} reviews={reviews} />
                  {inbox.length > 0 && (
                    <InboxPanel
                      inbox={inbox}
                      onConvertNote={convertInboxToNote}
                      onConvertReminder={convertInboxToReminder}
                      onConvertRoutine={convertInboxToRoutine}
                      onDelete={deleteInboxItem}
                    />
                  )}
                  <Today
                    tasks={tasks}
                    completions={completions}
                    setCompletions={setCompletions}
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    freezes={freezes}
                    setFreezes={setFreezes}
                    skips={skips}
                    setSkips={setSkips}
                    routineNotes={routineNotes}
                    setRoutineNotes={setRoutineNotes}
                  />
                  <Pomodoro
                    tasks={tasks}
                    settings={pomodoro}
                    setSettings={setPomodoro}
                    state={{
                      mode: pomoState.mode,
                      running: !!pomoState.endTime,
                      seconds: pomoSeconds,
                      completedFocuses: pomoState.completedFocuses || 0,
                      linkedTaskId: pomoState.linkedTaskId || '',
                    }}
                    actions={pomoActions}
                  />
                </>
              )}
              {active === 'tasks' && (
                <Tasks
                  tasks={tasks}
                  setTasks={setTasks}
                  goals={goals}
                  setGoals={setGoals}
                  confirm={confirm}
                  flash={flashWithTimer}
                  onSetReminder={reminderFromRoutine}
                  pendingCapture={pendingCapture}
                  clearPendingCapture={() => setPendingCapture(null)}
                  onSwitchToReminder={(raw, parsed) => {
                    setPendingCapture({ target: 'reminder', raw, parsed });
                    setActive('reminders');
                  }}
                />
              )}
              {active === 'goals' && (
                <GoalsView goals={goals} setGoals={setGoals} tasks={tasks} setTasks={setTasks} completions={completions} confirm={confirm} flash={flashWithTimer} />
              )}
              {active === 'calendar' && (
                <CalendarView
                  tasks={tasks}
                  completions={completions}
                  notes={notes}
                  reminders={reminders}
                  onJumpToDay={(d) => setViewDate(d)}
                  setActive={setActive}
                  icsFeeds={icsFeeds}
                  setIcsFeeds={setIcsFeeds}
                  flash={flashWithTimer}
                />
              )}
              {active === 'notes' && (
                <Notes notes={notes} setNotes={setNotes} confirm={confirm} flash={flashWithTimer} />
              )}
              {active === 'reminders' && (
                <Reminders
                  reminders={reminders}
                  setReminders={setReminders}
                  confirm={confirm}
                  flash={flashWithTimer}
                  pendingCapture={pendingCapture}
                  clearPendingCapture={() => setPendingCapture(null)}
                  onSwitchToRoutine={(raw, parsed) => {
                    setPendingCapture({ target: 'routine', raw, parsed });
                    setActive('tasks');
                  }}
                />
              )}
              {active === 'journal' && (
                <Journal reviews={reviews} setReviews={setReviews} tasks={tasks} completions={completions} flash={flashWithTimer} />
              )}
              {active === 'news' && (
                <News flash={flashWithTimer} />
              )}
              {active === 'stats' && (
                <Stats tasks={tasks} completions={completions} badgeStates={badgeStates} reviews={reviews} />
              )}
            </div>

            <footer className="mt-10 mb-4 text-center text-xs text-slate-400 no-print">
              Built with React · Press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 mx-1">⌘K</kbd> to search · <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/10 mx-1">?</kbd> for shortcuts
            </footer>
          </main>
        </div>

        {toast && (
          <div
            key={toast.id}
            className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-pop-in z-[80] no-print flex items-center gap-3 ${
              toast.isError ? 'bg-rose-500 text-white' : 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-violet-500/30'
            }`}
          >
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                onClick={() => { toast.undo(); setToast(null); }}
                className="underline underline-offset-2 font-bold hover:opacity-80"
              >
                Undo
              </button>
            )}
          </div>
        )}

        {confirmDialog}

        <ReminderAlert
          alert={currentAlert}
          onDismiss={dismissAlert}
          onSnooze={snoozeAlert}
          onComplete={completeAlert}
        />

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          navigate={(id) => setActive(id)}
          tasks={tasks}
          notes={notes}
          reminders={reminders}
          theme={theme}
          setTheme={setTheme}
          onNewNote={() => navigateAndFocus('notes', 'note')}
          onNewReminder={() => navigateAndFocus('reminders', 'reminder')}
          onQuickCapture={() => setCaptureOpen(true)}
          onExport={exportAll}
          onPrint={printToday}
          onRestartTour={() => setOnboardingOpen(true)}
          onInstallApp={() => setInstallOpen(true)}
        />

        <ReviewPrompt
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          reviews={reviews}
          setReviews={setReviews}
          completionStats={todayCompletionStats}
        />

        <EncryptDialog
          open={!!encryptMode}
          mode={encryptMode}
          onClose={() => setEncryptMode(null)}
          getPlaintext={getExportPlaintext}
          onDecrypted={applyImportedData}
          flash={flashWithTimer}
        />

        <QuickCapture
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
          onSaveInbox={saveToInbox}
          onConvertNote={captureToNote}
          onConvertReminder={captureToReminder}
          onConvertRoutine={captureToRoutine}
        />

        <CheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />

        <Onboarding
          open={onboardingOpen}
          onClose={() => {
            setOnboardingOpen(false);
            setOnboarded(true);
          }}
          setTasks={setTasks}
          setGoals={setGoals}
          flash={flash}
        />

        <InstallPrompt
          open={installOpen}
          onClose={() => {
            setInstallOpen(false);
            setInstallPromptShown(true);
          }}
        />
      </div>
    </>
  );
}
