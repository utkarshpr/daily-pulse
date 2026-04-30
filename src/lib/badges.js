import { computeLongestStreak, totalChecks } from './utils';

export const BADGES = [
  {
    id: 'first-step',
    name: 'First step',
    description: 'Complete your first routine',
    icon: '🌱',
    grad: 'from-emerald-500 to-teal-500',
    target: 1,
    progress: ({ tasks, completions }) => Math.min(1, totalChecks(tasks, completions)),
  },
  {
    id: 'getting-started',
    name: 'Getting started',
    description: '7-day perfect streak',
    icon: '🔥',
    grad: 'from-amber-500 to-orange-500',
    target: 7,
    progress: ({ tasks, completions, freezes, skips }) =>
      computeLongestStreak(tasks, completions, freezes, skips),
  },
  {
    id: 'habit-forming',
    name: 'Habit forming',
    description: '21-day perfect streak',
    icon: '⚡',
    grad: 'from-yellow-500 to-amber-500',
    target: 21,
    progress: ({ tasks, completions, freezes, skips }) =>
      computeLongestStreak(tasks, completions, freezes, skips),
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: '30-day perfect streak',
    icon: '🏃',
    grad: 'from-rose-500 to-pink-500',
    target: 30,
    progress: ({ tasks, completions, freezes, skips }) =>
      computeLongestStreak(tasks, completions, freezes, skips),
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: '100-day perfect streak',
    icon: '👑',
    grad: 'from-fuchsia-500 to-violet-600',
    target: 100,
    progress: ({ tasks, completions, freezes, skips }) =>
      computeLongestStreak(tasks, completions, freezes, skips),
  },
  {
    id: 'half-century',
    name: 'Half century',
    description: '50 routines completed',
    icon: '🎯',
    grad: 'from-cyan-500 to-blue-500',
    target: 50,
    progress: ({ tasks, completions }) => totalChecks(tasks, completions),
  },
  {
    id: 'centi-checks',
    name: 'Hundred up',
    description: '100 routines completed',
    icon: '🏅',
    grad: 'from-indigo-500 to-violet-600',
    target: 100,
    progress: ({ tasks, completions }) => totalChecks(tasks, completions),
  },
  {
    id: 'kilo-checks',
    name: 'Lifestyle',
    description: '1,000 routines completed',
    icon: '💎',
    grad: 'from-violet-500 to-fuchsia-500',
    target: 1000,
    progress: ({ tasks, completions }) => totalChecks(tasks, completions),
  },
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Track 5+ active routines',
    icon: '🌈',
    grad: 'from-pink-500 to-rose-500',
    target: 5,
    progress: ({ tasks }) => tasks.length,
  },
  {
    id: 'note-collector',
    name: 'Note collector',
    description: '25 notes created',
    icon: '📚',
    grad: 'from-sky-500 to-cyan-500',
    target: 25,
    progress: ({ notes }) => notes.length,
  },
  {
    id: 'goal-setter',
    name: 'Goal setter',
    description: 'Define your first goal',
    icon: '🎯',
    grad: 'from-emerald-500 to-cyan-500',
    target: 1,
    progress: ({ goals }) => goals.length,
  },
  {
    id: 'reflective',
    name: 'Reflective',
    description: '7 daily reviews logged',
    icon: '🪞',
    grad: 'from-violet-500 to-purple-500',
    target: 7,
    progress: ({ reviews }) => Object.keys(reviews || {}).length,
  },
  {
    id: 'planner',
    name: 'Planner',
    description: '5 reminders set',
    icon: '📅',
    grad: 'from-blue-500 to-indigo-500',
    target: 5,
    progress: ({ reminders }) => reminders.length,
  },
];

export const computeBadgeStates = (state) =>
  BADGES.map((b) => {
    let p = 0;
    try { p = b.progress(state); } catch { p = 0; }
    const earned = p >= b.target;
    return { ...b, progress: Math.min(p, b.target), earned, ratio: Math.min(1, p / b.target) };
  });

export const computeEarned = (state) =>
  computeBadgeStates(state).filter((b) => b.earned).map((b) => b.id);
