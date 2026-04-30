// Natural-language parser for reminders and routines.
//
// `parseSmart(text)` extracts every signal it can find. `parseReminder` and
// `parseRoutine` are thin wrappers that pick the fields each consumer needs.
//
// English + Hinglish (Roman-script Hindi) supported in the same input —
// "kal subah 7 baje yoga" parses cleanly alongside "tomorrow at 7am yoga".
//
// Recognized patterns (examples):
//   "remind me to call mom tomorrow at 9"           → title + when
//   "kal subah 8 baje doctor ko call karna"          → tomorrow 8 AM + title
//   "every monday and friday at 7pm yoga"           → days + time + repeat
//   "har roz 8 glass paani peena"                   → daily + goal 8 glasses
//   "💪 deadlifts weekdays 6:30am"                  → icon + days + time
//   "urgent: pay rent on the 1st"                   → priority high
//   "every other week team sync"                    → biweekly (→ weekly)
//   "@gym workout daily"                            → category 'Health' via @tag

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// Hinglish day names. Indexed parallel to WEEKDAYS.
const WEEKDAYS_HI = ['ravivar', 'somvar', 'mangalvar', 'budhvar', 'guruvar', 'shukravar', 'shanivar'];

// Time keywords as a variants list. Each entry maps several spellings to the
// same time. Order matters: longer phrases must come before shorter ones that
// they contain (e.g. "before lunch" before "lunch", "aadhi raat" before "raat")
// so the longer match wins.
//
// `ambiguous: true` marks variants that collide with everyday English words
// ("rat" the rodent, "sham" the fake). We only accept those when a Hindi
// context cue (kal, parso, aaj, baje, …) sits within ~20 chars on either side.
const TIME_KEYWORDS = [
  // Meal/work cues — multi-word forms first so they outmatch the single word.
  { variants: ['before lunch'], h: 12, min: 0 },
  { variants: ['after lunch'], h: 14, min: 0 },
  { variants: ['lunch'], h: 13, min: 0 },
  { variants: ['before dinner'], h: 18, min: 0 },
  { variants: ['after dinner'], h: 20, min: 0 },
  { variants: ['dinner'], h: 19, min: 0 },
  { variants: ['breakfast'], h: 8, min: 0 },
  { variants: ['before bed'], h: 22, min: 0 },
  { variants: ['bedtime'], h: 22, min: 0 },
  // Business shorthand
  { variants: ['end of the day', 'end of day'], h: 18, min: 0 },
  { variants: ['close of business'], h: 18, min: 0 },
  { variants: ['eod'], h: 18, min: 0 },
  { variants: ['cob'], h: 18, min: 0 },
  // English time-of-day
  { variants: ['noon'], h: 12, min: 0 },
  { variants: ['midnight'], h: 0, min: 0 },
  { variants: ['morning'], h: 8, min: 0 },
  { variants: ['afternoon'], h: 14, min: 0 },
  { variants: ['evening'], h: 18, min: 0 },
  { variants: ['night'], h: 21, min: 0 },
  // Hinglish — including the typos people actually type in Roman script.
  { variants: ['subah', 'subha', 'subhah'], h: 8, min: 0 },
  { variants: ['sawera', 'savera'], h: 6, min: 0 },
  { variants: ['dopahar', 'dupahar', 'dopaher', 'dophar'], h: 14, min: 0 },
  { variants: ['shaam'], h: 18, min: 0 },
  { variants: ['sham'], h: 18, min: 0, ambiguous: true },
  // 'aadhi raat' must come before 'raat' (substring of the multi-word form).
  { variants: ['aadhi raat', 'adhi raat'], h: 0, min: 0 },
  { variants: ['raat'], h: 21, min: 0 },
  { variants: ['rat'], h: 21, min: 0, ambiguous: true },
];

// Cues that signal Hindi/Hinglish context. When an ambiguous time variant
// (rat, sham) sits within HINDI_CONTEXT_WINDOW chars of one of these, we trust
// it's the time-of-day word rather than the English homograph. Kept tight on
// purpose — common English words like "this" or "next" produce false positives
// (e.g. "this is a sham") and are deliberately excluded.
const HINDI_CONTEXT_RE = /\b(?:kal|parso(?:on)?|aaj|baje|tomorrow|tonight|today|har\s+(?:roz|hafte|mahine|maheene))\b/;
const HINDI_CONTEXT_WINDOW = 20;

// Goal/unit hints. Covers metric + imperial — same parser works for "8
// glasses of water", "5 km run", "30 pages", "20 lbs". Matters mostly for
// routines.
const QUANT_UNITS = [
  // Volume
  'glass', 'glasses', 'cup', 'cups',
  'liter', 'liters', 'litre', 'litres', 'ml',
  'oz', 'ounce', 'ounces', 'pint', 'pints', 'gallon', 'gallons',
  // Distance
  'km', 'kilometer', 'kilometers', 'kilometre', 'kilometres',
  'mi', 'mile', 'miles',
  'meter', 'meters', 'metre', 'metres',
  'step', 'steps',
  // Weight
  'kg', 'kgs', 'kilogram', 'kilograms',
  'gram', 'grams',
  'lb', 'lbs', 'pound', 'pounds',
  // Reading
  'page', 'pages', 'chapter', 'chapters',
  'word', 'words',
  // Reps & sets
  'rep', 'reps', 'set', 'sets',
  // Energy
  'cal', 'calorie', 'calories', 'kcal',
  // Time (mostly used as a goal duration)
  'min', 'mins', 'minute', 'minutes',
  'hour', 'hours', 'hr', 'hrs',
];

// Normalize unit aliases to one canonical form so storage + display stay tidy.
const UNIT_ALIAS = {
  // time
  mins: 'min', minute: 'min', minutes: 'min',
  hrs: 'hour', hr: 'hour', hours: 'hour',
  // volume
  glasses: 'glasses', glass: 'glasses',
  cups: 'cups', cup: 'cups',
  liters: 'liters', litre: 'liters', litres: 'liters', liter: 'liters', l: 'liters',
  ounce: 'oz', ounces: 'oz',
  pints: 'pints', pint: 'pints',
  gallons: 'gallons', gallon: 'gallons',
  // distance
  kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km',
  miles: 'miles', mile: 'miles',
  meter: 'm', meters: 'm', metre: 'm', metres: 'm',
  steps: 'steps', step: 'steps',
  // weight
  kgs: 'kg', kilogram: 'kg', kilograms: 'kg',
  gram: 'g', grams: 'g',
  lbs: 'lb', pound: 'lb', pounds: 'lb',
  // reading
  pages: 'pages', page: 'pages',
  chapters: 'chapters', chapter: 'chapters',
  words: 'words', word: 'words',
  // reps & sets
  reps: 'reps', rep: 'reps',
  sets: 'sets', set: 'sets',
  // energy
  calorie: 'cal', calories: 'cal', kcal: 'cal',
};

const setTime = (date, h, m = 0) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const pad2 = (n) => String(n).padStart(2, '0');

const parseTime = (text) => {
  // Time must be unambiguous — bare digits count as a quantity ("8 potatoes"),
  // not a time. Accepted forms:
  //   1. With "at" prefix:   "at 8", "at 9:30", "at 9 pm"
  //   2. With colon:         "9:30", "21:00"
  //   3. With AM/PM suffix:  "9am", "9 PM"
  //   4. With "o'clock":     "8 o'clock"
  //   5. Hinglish "baje":    "8 baje", "9:30 baje" (= "X o'clock")
  const re = new RegExp(
    [
      // 1: at + hour + optional minutes + optional ampm
      /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/.source,
      // 2: hour:minute (with optional ampm)
      /\b(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\b/.source,
      // 3: hour + ampm (no separator required)
      /\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/.source,
      // 4: hour + o'clock
      /\b(\d{1,2})\s*o['’]?clock\b/.source,
      // 5: hour [+ optional minutes] + baje (Hindi "o'clock")
      /\b(\d{1,2})(?::(\d{2}))?\s*baje\b/.source,
    ].join('|'),
    'i'
  );
  const m = text.match(re);
  if (!m) return null;
  let h, min, ap;
  if (m[1] !== undefined) { h = parseInt(m[1], 10); min = m[2] ? parseInt(m[2], 10) : 0; ap = m[3]; }
  else if (m[4] !== undefined) { h = parseInt(m[4], 10); min = parseInt(m[5], 10); ap = m[6]; }
  else if (m[7] !== undefined) { h = parseInt(m[7], 10); min = 0; ap = m[8]; }
  else if (m[9] !== undefined) { h = parseInt(m[9], 10); min = 0; ap = null; }
  else { h = parseInt(m[10], 10); min = m[11] ? parseInt(m[11], 10) : 0; ap = null; }
  ap = ap?.toLowerCase();
  if (h > 23 || min > 59) return null;
  if (ap?.startsWith('p') && h < 12) h += 12;
  if (ap?.startsWith('a') && h === 12) h = 0;
  return { h, min, idx: m.index, raw: m[0] };
};

// "on the 25th", "on the 5", "by the 1st" — recurring day-of-month.
const parseDayOfMonth = (lower) => {
  const m = lower.match(/\b(?:on|by)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  if (day < 1 || day > 31) return null;
  return day;
};

const parseTimeKeyword = (lower) => {
  for (const entry of TIME_KEYWORDS) {
    for (const variant of entry.variants) {
      const re = new RegExp(`\\b${variant.replace(/\s+/g, '\\s+')}\\b`);
      const m = lower.match(re);
      if (!m) continue;
      if (entry.ambiguous) {
        // Look for a Hindi/Hinglish cue within a small window on either side.
        // Without one, we treat the token as the English homograph and skip.
        const before = lower.slice(Math.max(0, m.index - HINDI_CONTEXT_WINDOW), m.index);
        const after = lower.slice(m.index + m[0].length, m.index + m[0].length + HINDI_CONTEXT_WINDOW);
        if (!HINDI_CONTEXT_RE.test(before) && !HINDI_CONTEXT_RE.test(after)) continue;
      }
      return { h: entry.h, min: entry.min, raw: m[0] };
    }
  }
  return null;
};

// Returns Set of weekday indices (0=Sun..6=Sat) detected in the phrase.
// Recognizes English ("monday"), short ("mon"), and Hinglish ("somvar").
const parseDays = (lower) => {
  const days = new Set();
  if (/\bweekday(s)?\b/.test(lower)) [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  if (/\bweekend(s)?\b/.test(lower)) [0, 6].forEach((d) => days.add(d));
  if (/\bevery\s*day\b|\bdaily\b|\b(?:har\s+roz|rozana|rozaana|roz)\b/.test(lower)) {
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => days.add(d));
  }
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const re = new RegExp(`\\b(?:next\\s+)?(?:${WEEKDAYS[i]}|${WEEKDAY_SHORT[i]}|${WEEKDAYS_HI[i]})s?\\b`);
    if (re.test(lower)) days.add(i);
  }
  return days;
};

// "8 glasses of water", "30 pages", "20 min", "5.5 km", "20 times", "3 baar"
const parseQuant = (lower) => {
  const unitGroup = QUANT_UNITS.join('|');
  // Allow decimals (5.5 km) and generic count units (times, bar/baar).
  const numericRe = new RegExp(`\\b(\\d{1,4}(?:\\.\\d{1,2})?)\\s+(${unitGroup}|times?|bar|baar)\\b`, 'i');
  const m = lower.match(numericRe);
  if (m) {
    const n = parseFloat(m[1]);
    const rawUnit = m[2].toLowerCase();
    let unit;
    if (rawUnit.startsWith('time') || rawUnit === 'bar' || rawUnit === 'baar') unit = 'times';
    else unit = UNIT_ALIAS[rawUnit] || rawUnit;
    return { count: Number.isInteger(n) ? n : Number(n.toFixed(2)), unit, raw: m[0] };
  }
  // Word-multipliers: "twice daily", "thrice a week"
  const wordRe = /\b(twice|thrice|once)\b/;
  const wm = lower.match(wordRe);
  if (wm) {
    const map = { once: 1, twice: 2, thrice: 3 };
    return { count: map[wm[1]], unit: 'times', raw: wm[0] };
  }
  return null;
};

// Concrete month-day: "May 5", "5 May", "Jan 15", "15 Jan", with optional year.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = new RegExp(`\\b(${[...MONTHS, ...MONTHS_SHORT].join('|')})\\b`, 'i');

const parseMonthDay = (lower) => {
  const monthMatch = lower.match(MONTH_RE);
  if (!monthMatch) return null;
  const monthName = monthMatch[1].toLowerCase();
  const monthIdx = (MONTHS.indexOf(monthName) >= 0
    ? MONTHS.indexOf(monthName)
    : MONTHS_SHORT.indexOf(monthName));
  if (monthIdx < 0) return null;
  // Look for a day number near the month (within 8 chars on either side).
  const around = lower.slice(Math.max(0, monthMatch.index - 8), monthMatch.index + monthMatch[0].length + 8);
  const dayMatch = around.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!dayMatch) return null;
  const day = parseInt(dayMatch[1], 10);
  if (day < 1 || day > 31) return null;
  return { month: monthIdx, day };
};

// "in 2 weeks", "in 3 months" (extends "in N min/hr/day").
const parseRelativeBigUnit = (lower, now) => {
  const m = lower.match(/\bin\s+(\d+)\s*(week|weeks|month|months)\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const d = new Date(now);
  if (m[2].startsWith('week')) d.setDate(d.getDate() + n * 7);
  else d.setMonth(d.getMonth() + n);
  return d;
};

// Detect a single emoji anywhere in the text (uses a coarse range; good
// enough for the common everyday emojis users actually type).
const EMOJI_RE = /([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/u;
const parseEmoji = (text) => {
  const m = text.match(EMOJI_RE);
  return m ? m[1] : null;
};

const parsePriority = (lower) => {
  if (/\b(urgent|asap|important|critical|high\s+priority)\b|!{2,}/.test(lower)) return 'high';
  if (/\b(low\s+priority|whenever|someday)\b/.test(lower)) return 'low';
  return null;
};

// Map common keywords to category labels used elsewhere in the app.
const CATEGORY_KEYWORDS = [
  { match: /\b(work|meeting|email|standup|standups|project|deadline|client|office)\b/, label: 'Work' },
  { match: /\b(workout|exercise|run|gym|yoga|stretch|hydrate|water|paani|meditat|sleep|walk|steps)\b/, label: 'Health' },
  { match: /\b(read|study|learn|practice|course|book|padhna|padhai)\b/, label: 'Learning' },
  { match: /\b(morning|breakfast|wake|subah|sawera)\b/, label: 'Morning' },
  { match: /\b(evening|dinner|wind\s*down|bedtime|shaam|raat)\b/, label: 'Evening' },
];

// "@home", "@office", "@gym" → category from explicit tag.
const LOCATION_TAGS = {
  home: 'Home',
  ghar: 'Home',
  office: 'Work',
  work: 'Work',
  gym: 'Health',
  school: 'Learning',
  college: 'Learning',
  uni: 'Learning',
};

const parseCategory = (lower) => {
  // @tag wins over keyword inference — it's an explicit signal.
  const tagMatch = lower.match(/@(\w+)/);
  if (tagMatch) {
    const tag = tagMatch[1].toLowerCase();
    if (LOCATION_TAGS[tag]) return LOCATION_TAGS[tag];
  }
  for (const c of CATEGORY_KEYWORDS) {
    if (c.match.test(lower)) return c.label;
  }
  return null;
};

const parseRepeat = (lower, days) => {
  if (/\b(every\s+day|daily|har\s+roz|rozana|rozaana|roz)\b/.test(lower)) return 'daily';
  // "every other day" → daily approximation (no biweekly-style stride yet).
  if (/\bevery\s+other\s+day\b/.test(lower)) return 'daily';
  // Biweekly / fortnightly / every other week / every 2 weeks → fall back to
  // weekly until a true biweekly recurrence is added to the model.
  if (/\b(biweekly|fortnightly|every\s+other\s+week|every\s+2\s+weeks?)\b/.test(lower)) return 'weekly';
  if (/\b(every\s+week|weekly|har\s+hafte|every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|somvar|mangalvar|budhvar|guruvar|shukravar|shanivar|ravivar))\b/.test(lower)) return 'weekly';
  if (/\b(every\s+month|monthly|har\s+mahine|har\s+maheene)\b/.test(lower)) return 'monthly';
  // Multiple specific weekdays implies weekly recurrence.
  if (days && days.size > 0 && /\bevery\b|\bweekdays?\b|\bweekends?\b/.test(lower)) return 'weekly';
  return 'none';
};

// Strip everything we recognized from the title so what remains is the
// user-meaningful action.
const STRIP_PATTERNS = [
  /\bset\s+(?:a|an)?\s*(?:reminder|alarm|notification)\s+(?:to\s+|for\s+|about\s+|that\s+)?/i,
  /\b(remind\s+me\s+(?:to\s+|about\s+|that\s+)?|remind\s+me\s+|to\s+)/i,
  /\bping\s+me\s+(?:to\s+|about\s+|when\s+)?/i,
  // Hindi recurrence + Hindi date keywords + "baje".
  /\b(har\s+roz|rozana|rozaana|roz|har\s+hafte|har\s+mahine|har\s+maheene)\b/gi,
  /\b(aaj\s+raat|aaj|kal|parso|parsoon)\b/gi,
  /\b\d{1,2}(?::\d{2})?\s*baje\b/gi,
  /\b(subah|subha|subhah|sawera|savera|dopahar|dupahar|dopaher|dophar|shaam|raat|aadhi\s+raat|adhi\s+raat)\b/gi,
  /\b(somvar|mangalvar|budhvar|guruvar|shukravar|shanivar|ravivar)s?\b/gi,
  /\b(\d+\s+)?(bar|baar)\b/gi,
  // Biweekly / fortnightly / every other.
  /\b(biweekly|fortnightly|every\s+other\s+(?:day|week)|every\s+2\s+weeks?)\b/gi,
  // Inline @tag — drop from title (we already extracted it as category).
  /@\w+/g,
  /\b(every\s+day|daily|every\s+week|weekly|every\s+month|monthly)\b/gi,
  /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)s?\b/gi,
  /\bweekdays?\b|\bweekends?\b/gi,
  /\b(tomorrow|tonight|today)\b/gi,
  /\b(?:next\s+|this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)s?\b/gi,
  /\b(?:in|for|after)\s+(?:a\s+few\s+)?\d*\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks|month|months)\b/gi,
  /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?\b/gi,
  /\b\d{1,2}\s*o['’]?clock\b/gi,
  /\b(noon|midnight|morning|afternoon|evening|night)\b/gi,
  /\b(?:before|after)\s+(lunch|dinner|breakfast|bed|work)\b/gi,
  /\b(lunch|dinner|breakfast|bedtime)\b/gi,
  /\b(eod|cob|eow|eom|end\s+of\s+(?:the\s+)?(?:day|week|month)|close\s+of\s+business)\b/gi,
  /\b(?:right\s+)?now\b|\bright\s+away\b/gi,
  /\blater\s+today\b/gi,
  /\bday\s+after\s+tomorrow\b/gi,
  /\b(?:this|coming|next)\s+weekend\b/gi,
  /\bon\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\b/gi,
  /\b(urgent|asap|important|critical|high\s+priority|low\s+priority|whenever|someday)\b/gi,
  /\b(once|twice|thrice)\b/gi,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/gi,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
  /!{2,}/g,
  /\b(and|&|,)\s+(?=(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))/gi,
];

const cleanTitle = (text, quant, timeKeywordRaw) => {
  let out = text;
  for (const re of STRIP_PATTERNS) out = out.replace(re, ' ');
  // Ambiguous time keywords (rat, sham) are kept out of STRIP_PATTERNS so
  // "feed the rat" doesn't lose "rat". When the parser confirmed one as a
  // time, strip that exact word here.
  if (timeKeywordRaw) {
    const escaped = timeKeywordRaw
      .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
      .replaceAll(/\s+/g, String.raw`\s+`);
    out = out.replaceAll(new RegExp(String.raw`\b${escaped}\b`, 'gi'), ' ');
  }
  if (quant) {
    const re = new RegExp(`\\b${quant.count}\\s+${quant.unit}s?\\b`, 'gi');
    out = out.replace(re, ' ');
    out = out.replace(/\bof\s+/gi, ' '); // "8 glasses of water" → "water"
  }
  return out.replace(/[:#@]+/g, ' ').replace(/\s+/g, ' ').trim();
};

// Capitalize first letter only — keeps acronyms like "PR" intact.
const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const parseSmart = (raw) => {
  const text = (raw || '').trim();
  if (!text) {
    return { title: '', when: null, time: null, days: null, repeat: 'none', icon: null, priority: null, goalCount: null, unit: null, category: null };
  }

  const lower = text.toLowerCase();
  const now = new Date();

  // Days first — informs both `repeat` and routine `days`.
  const daySet = parseDays(lower);
  const days = daySet.size > 0 ? Array.from(daySet).sort((a, b) => a - b) : null;
  const repeat = parseRepeat(lower, daySet);

  // Time parsing: numeric wins for the actual time, but we still detect a
  // keyword match so its raw word can be stripped from the title (otherwise
  // "kal rat 11pm call" would keep "rat" in the cleaned title).
  const numericTime = parseTime(lower);
  const keywordTime = parseTimeKeyword(lower);
  const t = numericTime || keywordTime;

  // Date resolution for reminders.
  let when = null;

  // Immediate: "now", "right now", "right away"
  if (/\b(?:right\s+)?now\b|\bright\s+away\b/.test(lower)) {
    when = new Date(now.getTime() + 60_000); // ~1 min from now (avoid firing during the same render)
  }

  // "later today" → +3 hours, capped to before midnight
  if (!when && /\blater\s+today\b/.test(lower)) {
    const cand = new Date(now.getTime() + 3 * 3_600_000);
    const eod = setTime(now, 22, 0);
    when = cand > eod ? eod : cand;
  }

  // "day after tomorrow"
  if (!when && /\bday\s+after\s+tomorrow\b/.test(lower)) {
    const base = new Date(now);
    base.setDate(base.getDate() + 2);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
  }

  // "in a few minutes" → +5 min
  if (!when && /\bin\s+a\s+few\s+(min|mins|minutes)\b/.test(lower)) {
    when = new Date(now.getTime() + 5 * 60_000);
  }

  // Relative: "in 30 min", "in 2 hours", "in 1 day", "for 10 mins",
  // "set a reminder for 5 hours". Both "in" and "for" map to the same offset.
  const inMatch = lower.match(/\b(?:in|for|after)\s+(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/);
  if (!when && inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const ms = unit.startsWith('day') ? n * 86_400_000 : unit.startsWith('h') ? n * 3_600_000 : n * 60_000;
    when = new Date(now.getTime() + ms);
  }

  // Weekend phrases — Saturday is the "weekend day" we anchor to.
  if (!when && /\b(this|coming)\s+weekend\b/.test(lower)) {
    const base = new Date(now);
    const diff = (6 - base.getDay() + 7) % 7 || 7;
    base.setDate(base.getDate() + diff);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 10, 0);
  }
  if (!when && /\bnext\s+weekend\b/.test(lower)) {
    const base = new Date(now);
    const diff = ((6 - base.getDay() + 7) % 7 || 7) + 7;
    base.setDate(base.getDate() + diff);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 10, 0);
  }

  // "end of week" / "EOW" → upcoming Friday EOD
  if (!when && /\b(?:eow|end\s+of\s+(?:the\s+)?week)\b/.test(lower)) {
    const base = new Date(now);
    let diff = (5 - base.getDay() + 7) % 7;
    if (diff === 0 && base.getHours() >= 17) diff = 7;
    base.setDate(base.getDate() + diff);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 17, 0);
  }

  // "end of month" / "EOM" → last day of current month
  if (!when && /\b(?:eom|end\s+of\s+(?:the\s+)?month)\b/.test(lower)) {
    const base = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 0 = last day prev month
    when = t ? setTime(base, t.h, t.min) : setTime(base, 17, 0);
  }

  // Larger relative: "in 2 weeks", "in 3 months"
  if (!when) {
    const big = parseRelativeBigUnit(lower, now);
    if (big) when = t ? setTime(big, t.h, t.min) : setTime(big, 9, 0);
  }

  // Concrete month-day: "May 5", "Jan 15"
  if (!when) {
    const md = parseMonthDay(lower);
    if (md) {
      const base = new Date(now);
      base.setMonth(md.month, md.day);
      // If that date already passed this year, jump to next year.
      if (base < now) base.setFullYear(base.getFullYear() + 1);
      when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
    }
  }

  // Day-of-month only ("on the 25th", "by the 1st"): next occurrence.
  if (!when) {
    const dom = parseDayOfMonth(lower);
    if (dom) {
      const base = new Date(now);
      base.setDate(dom);
      if (base < now) base.setMonth(base.getMonth() + 1);
      when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
    }
  }

  // tomorrow / kal (Hindi)
  if (!when && /\btomorrow\b|\bkal\b/.test(lower)) {
    const base = new Date(now); base.setDate(base.getDate() + 1);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
  }

  // tonight / aaj raat
  if (!when && /\btonight\b|\baaj\s+raat\b/.test(lower)) {
    when = t ? setTime(now, t.h, t.min) : setTime(now, 20, 0);
    if (when <= now) when = setTime(now, 21, 0);
  }

  // today / aaj
  if (!when && /\btoday\b|\baaj\b/.test(lower)) {
    when = t ? setTime(now, t.h, t.min) : null;
  }

  // parso / parsoon (Hindi: day after tomorrow when forward-looking)
  if (!when && /\bparso(?:on)?\b/.test(lower)) {
    const base = new Date(now); base.setDate(base.getDate() + 2);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
  }

  // First named weekday wins for the date.
  if (!when && days) {
    const firstDow = days[0];
    const base = new Date(now);
    let diff = (firstDow - base.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    if (lower.includes('next ' + WEEKDAYS[firstDow])) diff = diff <= 7 ? diff + 7 : diff;
    base.setDate(base.getDate() + diff);
    when = t ? setTime(base, t.h, t.min) : setTime(base, 9, 0);
  }

  // Bare time (no date) → next occurrence of that time.
  if (!when && t && !daySet.size) {
    when = setTime(now, t.h, t.min);
    if (when <= now) when.setDate(when.getDate() + 1);
  }

  const time = t ? `${pad2(t.h)}:${pad2(t.min)}` : null;
  const quant = parseQuant(lower);
  const icon = parseEmoji(text);
  const priority = parsePriority(lower);
  const category = parseCategory(lower);

  let title = cleanTitle(text, quant, keywordTime?.raw);
  if (icon) title = title.replace(icon, '').replace(/\s+/g, ' ').trim();
  title = capFirst(title);

  return {
    title: title || text,
    when: when ? when.toISOString() : null,
    time,
    days,
    repeat,
    icon,
    priority,
    goalCount: quant?.count ?? null,
    unit: quant?.unit ?? null,
    category,
  };
};

// Backward-compat: existing callers keep working unchanged.
export const parseReminder = (raw) => {
  const r = parseSmart(raw);
  return { title: r.title, when: r.when, repeat: r.repeat };
};

// Routine-shaped subset.
export const parseRoutine = (raw) => {
  const r = parseSmart(raw);
  return {
    name: r.title,
    time: r.time || '',
    days: r.days || null,
    icon: r.icon || null,
    category: r.category || '',
    goalCount: r.goalCount || 0,
    unit: r.unit || '',
  };
};
