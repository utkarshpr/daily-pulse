// Keyword-driven starter routine suggestions. Returns an array of partial
// task objects (no id) that can be merged into a full task.

export const HABIT_GROUPS = [
  {
    keywords: ['run', 'marathon', '5k', '10k', 'jog'],
    label: 'Running',
    suggestions: [
      { name: 'Morning run', icon: '🏃', goalCount: 0, category: 'Health', color: 'emerald' },
      { name: 'Stretch & cool down', icon: '🧘', goalCount: 0, category: 'Health', color: 'cyan' },
      { name: 'Track distance', icon: '📏', goalCount: 5, unit: 'km', category: 'Health', color: 'violet' },
    ],
  },
  {
    keywords: ['weight', 'lose', 'fitness', 'workout', 'gym', 'lift', 'strong'],
    label: 'Fitness',
    suggestions: [
      { name: 'Workout session', icon: '💪', goalCount: 0, category: 'Health', color: 'rose' },
      { name: 'Hydrate', icon: '💧', goalCount: 8, unit: 'glasses', category: 'Health', color: 'cyan' },
      { name: 'Track meals', icon: '🥗', goalCount: 0, category: 'Health', color: 'emerald' },
    ],
  },
  {
    keywords: ['read', 'book', 'reading'],
    label: 'Reading',
    suggestions: [
      { name: 'Read', icon: '📚', goalCount: 30, unit: 'pages', category: 'Learning', color: 'amber' },
      { name: 'Reflect on what you read', icon: '✍️', goalCount: 0, category: 'Learning', color: 'violet' },
    ],
  },
  {
    keywords: ['learn', 'study', 'language', 'course'],
    label: 'Learning',
    suggestions: [
      { name: 'Study session', icon: '🧠', goalCount: 30, unit: 'min', category: 'Learning', color: 'violet' },
      { name: 'Practice exercises', icon: '✏️', goalCount: 0, category: 'Learning', color: 'cyan' },
    ],
  },
  {
    keywords: ['meditate', 'mindful', 'calm', 'stress', 'sleep'],
    label: 'Wellbeing',
    suggestions: [
      { name: 'Meditation', icon: '🧘', goalCount: 10, unit: 'min', category: 'Health', color: 'violet' },
      { name: 'Sleep by 11pm', icon: '😴', goalCount: 0, category: 'Evening', color: 'indigo' },
    ],
  },
  {
    keywords: ['write', 'blog', 'novel', 'journal'],
    label: 'Writing',
    suggestions: [
      { name: 'Daily writing', icon: '✍️', goalCount: 500, unit: 'words', category: 'Work', color: 'amber' },
      { name: "Edit yesterday's draft", icon: '📝', goalCount: 0, category: 'Work', color: 'rose' },
    ],
  },
  {
    keywords: ['save', 'money', 'budget', 'finance'],
    label: 'Finance',
    suggestions: [
      { name: 'Log expenses', icon: '💰', goalCount: 0, category: 'Finance', color: 'emerald' },
      { name: 'No-spend day', icon: '🚫', goalCount: 0, category: 'Finance', color: 'rose' },
    ],
  },
];

export const STARTER_ROUTINES = [
  { name: 'Hydrate', icon: '💧', goalCount: 8, unit: 'glasses', category: 'Morning', color: 'cyan' },
  { name: 'Move your body', icon: '🏃', goalCount: 0, category: 'Health', color: 'emerald' },
  { name: 'Read 20 minutes', icon: '📚', goalCount: 20, unit: 'min', category: 'Learning', color: 'amber' },
  { name: 'Reflect & journal', icon: '📓', goalCount: 0, category: 'Evening', color: 'violet' },
];

export const suggestHabits = (text) => {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return null;
  for (const group of HABIT_GROUPS) {
    if (group.keywords.some((k) => t.includes(k))) return group;
  }
  return null;
};
