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

// ---- Parser (the inverse direction) ----------------------------------------
//
// Reads an iCalendar string and returns a flat array of events:
//   { uid, title, description, start (ISO), end (ISO|null), allDay, rrule }
//
// Scope: enough to surface holiday + personal-calendar feeds inside Daily Pulse.
// We DO NOT expand RRULEs ourselves — for the holiday feeds the user typically
// imports, each occurrence is published as its own VEVENT, so expansion isn't
// needed. If a feed uses RRULE=YEARLY for a single seed event we'll only show
// the seed; a future iteration can add expansion if real users hit that case.

const unescapeText = (s) =>
  String(s ?? '')
    .replaceAll(/\\n/gi, '\n')
    .replaceAll(String.raw`\,`, ',')
    .replaceAll(String.raw`\;`, ';')
    .replaceAll(String.raw`\\`, '\\');

// "20260501" or "20260501T120000Z" or "20260501T120000" → ISO string.
// allDay means VALUE=DATE — we anchor those at local midnight so they line
// up with the user's calendar grid (UTC midnight could shift them a day).
const parseICSDate = (raw, allDay) => {
  const s = String(raw || '').trim();
  if (allDay && /^\d{8}$/.test(s)) {
    const y = +s.slice(0, 4);
    const m = +s.slice(4, 6) - 1;
    const d = +s.slice(6, 8);
    return new Date(y, m, d).toISOString();
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(s);
  if (!m) return null;
  const [, y, mo, d, h, mi, se, z] = m;
  if (z === 'Z') return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se)).toISOString();
  // No TZID handling — treat floating times as local. Acceptable for the
  // overlay use case; if a feed sends TZID-anchored times we'll be off by the
  // user's offset, which is fine for visual display of holidays.
  return new Date(+y, +mo - 1, +d, +h, +mi, +se).toISOString();
};

export const parseICS = (text) => {
  if (!text || typeof text !== 'string') return [];
  // RFC5545 line folding: a CRLF followed by SPACE or TAB continues the prior
  // line. Unfold first, then split on line breaks.
  const unfolded = text.replaceAll(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur && cur.start) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const left = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const [name, ...params] = left.split(';');
    const prop = name.toUpperCase();
    if (prop === 'SUMMARY') cur.title = unescapeText(value);
    else if (prop === 'DESCRIPTION') cur.description = unescapeText(value);
    else if (prop === 'UID') cur.uid = value;
    else if (prop === 'RRULE') cur.rrule = value;
    else if (prop === 'DTSTART' || prop === 'DTEND') {
      const allDay = params.some((p) => p.toUpperCase() === 'VALUE=DATE');
      const iso = parseICSDate(value, allDay);
      if (!iso) continue;
      if (prop === 'DTSTART') { cur.start = iso; cur.allDay = allDay; }
      else cur.end = iso;
    }
  }
  return events;
};

// Fetch an .ics URL from the browser. Direct first; if CORS blocks (most
// public calendars do), fall back to a free CORS proxy. If both fail the
// caller should offer the user a "download the file then upload it" path.
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

export const fetchICS = async (url) => {
  // 1. Try direct — works for hosts that send Access-Control-Allow-Origin.
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (r.ok) {
      const text = await r.text();
      if (text.includes('BEGIN:VCALENDAR')) return text;
    }
  } catch {
    // CORS or network error — fall through to proxy.
  }
  // 2. Proxy fallback. codetabs is free, no key, returns CORS headers.
  const proxied = CORS_PROXY + encodeURIComponent(url);
  const r = await fetch(proxied);
  if (!r.ok) throw new Error(`Feed fetch failed (${r.status})`);
  const text = await r.text();
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('Response was not a calendar file. Try downloading it and uploading instead.');
  }
  return text;
};
