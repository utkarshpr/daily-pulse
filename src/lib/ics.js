// Generate an iCalendar (.ics) blob from a set of reminders so the user can
// import them into Apple/Google/Outlook Calendar without any backend.

const pad = (n) => String(n).padStart(2, '0');

const toICSDate = (iso) => {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
};

const escapeText = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const RRULE = {
  daily: 'FREQ=DAILY',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
};

export const remindersToICS = (reminders, calName = 'Daily Pulse Reminders') => {
  const now = toICSDate(new Date().toISOString());
  const events = (reminders || [])
    .filter((r) => r && r.when && !r.done)
    .map((r) => {
      const lines = [
        'BEGIN:VEVENT',
        `UID:${r.id}@dailypulse`,
        `DTSTAMP:${now}`,
        `DTSTART:${toICSDate(r.when)}`,
        `SUMMARY:${escapeText(r.title || 'Reminder')}`,
      ];
      if (r.notes) lines.push(`DESCRIPTION:${escapeText(r.notes)}`);
      if (r.repeat && RRULE[r.repeat]) lines.push(`RRULE:${RRULE[r.repeat]}`);
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT0M', `DESCRIPTION:${escapeText(r.title || 'Reminder')}`, 'END:VALARM');
      lines.push('END:VEVENT');
      return lines.join('\r\n');
    });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Pulse//Reminders 1.0//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(calName)}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadICS = (filename, content) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
