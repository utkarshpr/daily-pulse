export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatLong = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export const formatTime = (d) =>
  d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export const cn = (...xs) => xs.filter(Boolean).join(' ');

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const PALETTE = [
  { name: 'violet', from: 'from-violet-500', to: 'to-fuchsia-500', ring: 'ring-violet-500/40', text: 'text-violet-600', bg: 'bg-violet-500', tintFrom: 'from-violet-500/15', tintTo: 'to-fuchsia-500/10', border: 'border-violet-400/30 dark:border-violet-400/20' },
  { name: 'cyan', from: 'from-cyan-500', to: 'to-sky-500', ring: 'ring-cyan-500/40', text: 'text-cyan-600', bg: 'bg-cyan-500', tintFrom: 'from-cyan-500/15', tintTo: 'to-sky-500/10', border: 'border-cyan-400/30 dark:border-cyan-400/20' },
  { name: 'emerald', from: 'from-emerald-500', to: 'to-teal-500', ring: 'ring-emerald-500/40', text: 'text-emerald-600', bg: 'bg-emerald-500', tintFrom: 'from-emerald-500/15', tintTo: 'to-teal-500/10', border: 'border-emerald-400/30 dark:border-emerald-400/20' },
  { name: 'amber', from: 'from-amber-500', to: 'to-orange-500', ring: 'ring-amber-500/40', text: 'text-amber-600', bg: 'bg-amber-500', tintFrom: 'from-amber-500/15', tintTo: 'to-orange-500/10', border: 'border-amber-400/30 dark:border-amber-400/20' },
  { name: 'rose', from: 'from-rose-500', to: 'to-pink-500', ring: 'ring-rose-500/40', text: 'text-rose-600', bg: 'bg-rose-500', tintFrom: 'from-rose-500/15', tintTo: 'to-pink-500/10', border: 'border-rose-400/30 dark:border-rose-400/20' },
  { name: 'indigo', from: 'from-indigo-500', to: 'to-blue-500', ring: 'ring-indigo-500/40', text: 'text-indigo-600', bg: 'bg-indigo-500', tintFrom: 'from-indigo-500/15', tintTo: 'to-blue-500/10', border: 'border-indigo-400/30 dark:border-indigo-400/20' },
];

export const colorFor = (name) => PALETTE.find((p) => p.name === name) || PALETTE[0];

export const NOTE_COLORS = [
  { name: 'sun', bg: 'bg-amber-100', dark: 'dark:bg-amber-500/15', border: 'border-amber-300/60 dark:border-amber-400/30' },
  { name: 'mint', bg: 'bg-emerald-100', dark: 'dark:bg-emerald-500/15', border: 'border-emerald-300/60 dark:border-emerald-400/30' },
  { name: 'sky', bg: 'bg-sky-100', dark: 'dark:bg-sky-500/15', border: 'border-sky-300/60 dark:border-sky-400/30' },
  { name: 'rose', bg: 'bg-rose-100', dark: 'dark:bg-rose-500/15', border: 'border-rose-300/60 dark:border-rose-400/30' },
  { name: 'lilac', bg: 'bg-violet-100', dark: 'dark:bg-violet-500/15', border: 'border-violet-300/60 dark:border-violet-400/30' },
  { name: 'slate', bg: 'bg-slate-100', dark: 'dark:bg-slate-500/15', border: 'border-slate-300/60 dark:border-slate-400/30' },
];

export const noteColor = (name) =>
  NOTE_COLORS.find((c) => c.name === name) || NOTE_COLORS[0];

// Routine completion helpers (handle both checkbox and count-style)
export const getCount = (val) => {
  if (val == null || val === false) return 0;
  if (typeof val === 'number') return val;
  return 1; // legacy truthy value (timestamp string) means done
};

export const isComplete = (task, val) => {
  if (val == null || val === false || val === 0) return false;
  if (task?.goalCount && task.goalCount > 0) {
    return getCount(val) >= task.goalCount;
  }
  return !!val;
};

export const isQuant = (task) => !!(task?.goalCount && task.goalCount > 0);

// Skip status: stored separately so streak math can ignore intentional skips
export const isSkipped = (skips, dateKey, taskId) => !!skips?.[dateKey]?.[taskId];

// Day-level helpers
export const dayTasksFor = (tasks, date) => {
  const dow = date.getDay();
  return tasks.filter((t) => !t.days || t.days.length === 0 || t.days.includes(dow));
};

export const isDayComplete = (tasks, date, completions, freezes = [], skips = {}) => {
  const k = todayKey(date);
  if (freezes.includes(k)) return true;
  const dt = dayTasksFor(tasks, date);
  if (dt.length === 0) return false;
  const c = completions[k] || {};
  const s = skips[k] || {};
  // A day counts as "done" only when every scheduled, non-skipped routine is complete
  const required = dt.filter((t) => !s[t.id]);
  if (required.length === 0) return false; // all skipped — don't count for streak
  return required.every((t) => isComplete(t, c[t.id]));
};

export const computeStreak = (tasks, completions, freezes = [], skips = {}) => {
  let s = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = todayKey(d);
    if (freezes.includes(k)) {
      // Frozen day preserves streak but does not increment
      d = addDays(d, -1);
      continue;
    }
    const dt = dayTasksFor(tasks, d);
    if (dt.length === 0) break;
    if (isDayComplete(tasks, d, completions, freezes, skips)) {
      s += 1;
    } else if (i !== 0) {
      break;
    }
    d = addDays(d, -1);
  }
  return s;
};

export const computeLongestStreak = (tasks, completions, freezes = [], skips = {}) => {
  let longest = 0;
  let cur = 0;
  let d = new Date();
  for (let i = 0; i < 365; i++) {
    const k = todayKey(d);
    if (freezes.includes(k)) { d = addDays(d, -1); continue; }
    const dt = dayTasksFor(tasks, d);
    if (dt.length === 0) { d = addDays(d, -1); continue; }
    if (isDayComplete(tasks, d, completions, freezes, skips)) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else if (i !== 0) {
      cur = 0;
    }
    d = addDays(d, -1);
  }
  return longest;
};

export const totalChecks = (tasks, completions) => {
  let n = 0;
  for (const day of Object.values(completions)) {
    for (const [id, val] of Object.entries(day)) {
      const t = tasks.find((x) => x.id === id);
      if (t && isComplete(t, val)) n += 1;
    }
  }
  return n;
};
