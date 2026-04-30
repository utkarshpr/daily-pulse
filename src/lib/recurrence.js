export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const labelForRepeat = (v) => REPEAT_OPTIONS.find((o) => o.value === v)?.label || 'Once';

export const nextOccurrence = (iso, repeat) => {
  if (!iso || !repeat || repeat === 'none') return null;
  const d = new Date(iso);
  if (repeat === 'daily') d.setDate(d.getDate() + 1);
  else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
  else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
  // If still in the past (e.g. user just created in past), keep advancing
  while (d.getTime() <= Date.now()) {
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
    else break;
  }
  return d.toISOString();
};
