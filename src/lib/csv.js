import { isComplete, getCount } from './utils';

const escape = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export const completionsToCSV = (tasks, completions) => {
  const rows = [['date', 'routine', 'category', 'completed', 'count', 'target', 'unit']];
  const dates = Object.keys(completions).sort();
  for (const d of dates) {
    const day = completions[d] || {};
    for (const t of tasks) {
      const v = day[t.id];
      if (v == null) continue;
      rows.push([
        d,
        t.name,
        t.category || '',
        isComplete(t, v) ? '1' : '0',
        getCount(v),
        t.goalCount || '',
        t.unit || '',
      ]);
    }
  }
  return rows.map((r) => r.map(escape).join(',')).join('\n');
};

export const downloadCSV = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
