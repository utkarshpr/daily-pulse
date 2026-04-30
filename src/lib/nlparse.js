// Lightweight natural-language parser for reminder phrases.
// Returns { title, when, repeat } where when is an ISO string or null.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const setTime = (date, h, m = 0) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const parseTime = (text) => {
  // 9, 9am, 9pm, 9:30, 9:30am, 21:00, 21:30
  const re = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i;
  const m = text.match(re);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (h > 23 || min > 59) return null;
  if (ap?.startsWith('p') && h < 12) h += 12;
  if (ap?.startsWith('a') && h === 12) h = 0;
  return { h, min, idx: m.index, raw: m[0] };
};

export const parseReminder = (raw) => {
  let text = (raw || '').trim();
  if (!text) return { title: '', when: null, repeat: 'none' };

  const lower = text.toLowerCase();
  const now = new Date();
  let when = null;
  let consumed = '';
  let repeat = 'none';

  // Repeat detection
  if (/\b(every\s+day|daily)\b/.test(lower)) repeat = 'daily';
  else if (/\b(every\s+week|weekly)\b/.test(lower)) repeat = 'weekly';
  else if (/\b(every\s+month|monthly)\b/.test(lower)) repeat = 'monthly';

  // Relative: "in 30 min", "in 2 hours", "in 1 day"
  const inMatch = lower.match(/\bin\s+(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const ms = unit.startsWith('day') ? n * 86_400_000 : unit.startsWith('h') ? n * 3_600_000 : n * 60_000;
    when = new Date(now.getTime() + ms);
    consumed = inMatch[0];
  }

  // "tomorrow [at TIME]"
  if (!when && /\btomorrow\b/.test(lower)) {
    const t = parseTime(lower);
    const base = new Date(now);
    base.setDate(base.getDate() + 1);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
    consumed = 'tomorrow';
  }

  // "tonight [at TIME]"
  if (!when && /\btonight\b/.test(lower)) {
    const t = parseTime(lower);
    when = t ? setTime(now, t.h, t.min) : setTime(now, 20, 0);
    if (when <= now) when = setTime(now, 21, 0);
    consumed = 'tonight';
  }

  // "today [at TIME]"
  if (!when && /\btoday\b/.test(lower)) {
    const t = parseTime(lower);
    when = t ? setTime(now, t.h, t.min) : null;
    consumed = 'today';
  }

  // weekday
  if (!when) {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      const re = new RegExp(`\\b(?:next\\s+)?${WEEKDAYS[i]}\\b`);
      if (re.test(lower)) {
        const t = parseTime(lower);
        const dow = i;
        const base = new Date(now);
        let diff = (dow - base.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        if (lower.includes('next ' + WEEKDAYS[i])) diff = diff <= 7 ? diff + 7 : diff;
        base.setDate(base.getDate() + diff);
        when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
        consumed = WEEKDAYS[i];
        break;
      }
    }
  }

  // standalone time only
  if (!when) {
    const t = parseTime(lower);
    if (t) {
      when = setTime(now, t.h, t.min);
      if (when <= now) when.setDate(when.getDate() + 1);
      consumed = t.raw;
    }
  }

  // strip time/keyword phrases from title
  let title = text
    .replace(/\b(remind\s+me\s+to\s+|remind\s+me\s+|to\s+)/i, '')
    .replace(/\b(every\s+day|daily|every\s+week|weekly|every\s+month|monthly)\b/gi, '')
    .replace(/\b(tomorrow|tonight|today)\b/gi, '')
    .replace(/\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\bin\s+\d+\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/gi, '')
    .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || text,
    when: when ? when.toISOString() : null,
    repeat,
  };
};
