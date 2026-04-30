let ctx = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

const tone = (audio, { type = 'sine', freq, startAt, duration = 0.35, gain = 0.15 }) => {
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g).connect(audio.destination);
  const t = audio.currentTime + startAt;
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

export const SOUND_PACKS = {
  chime: { label: 'Chime', description: 'Bright 3-note arpeggio' },
  bell: { label: 'Bell', description: 'Resonant single ring' },
  pop: { label: 'Soft pop', description: 'Subtle short chirp' },
  alarm: { label: 'Alarm', description: 'Insistent two-tone (high priority)' },
  silent: { label: 'Silent', description: 'No sound' },
};

const PACKS = {
  chime: (audio) => {
    tone(audio, { freq: 880, startAt: 0 });
    tone(audio, { freq: 1175, startAt: 0.18 });
    tone(audio, { freq: 1568, startAt: 0.36, duration: 0.5 });
  },
  bell: (audio) => {
    tone(audio, { type: 'triangle', freq: 800, startAt: 0, duration: 1.4, gain: 0.18 });
    tone(audio, { type: 'sine', freq: 1200, startAt: 0, duration: 1.0, gain: 0.06 });
  },
  pop: (audio) => {
    tone(audio, { type: 'sine', freq: 660, startAt: 0, duration: 0.12, gain: 0.18 });
    tone(audio, { type: 'sine', freq: 990, startAt: 0.08, duration: 0.18, gain: 0.12 });
  },
  alarm: (audio) => {
    for (let i = 0; i < 4; i++) {
      tone(audio, { type: 'square', freq: 660, startAt: i * 0.3, duration: 0.15, gain: 0.1 });
      tone(audio, { type: 'square', freq: 880, startAt: i * 0.3 + 0.15, duration: 0.15, gain: 0.1 });
    }
  },
  silent: () => {},
};

export const playChime = (pack = 'chime') => {
  const audio = getCtx();
  if (!audio) return;
  (PACKS[pack] || PACKS.chime)(audio);
};

export const vibrate = (pattern) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern || [200, 100, 200, 100, 400]); } catch { /* ignore */ }
  }
};
