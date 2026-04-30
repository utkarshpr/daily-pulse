export const PRESETS = {
  aurora: {
    label: 'Aurora',
    swatch: ['#8b5cf6', '#06b6d4', '#ec4899'],
    light:
      'radial-gradient(1200px 600px at 10% -10%, rgba(139, 92, 246, .25), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(6, 182, 212, .22), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(236, 72, 153, .18), transparent 60%),' +
      '#f8fafc',
    dark:
      'radial-gradient(1200px 600px at 10% -10%, rgba(139, 92, 246, .25), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(6, 182, 212, .18), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(236, 72, 153, .15), transparent 60%),' +
      '#020617',
  },
  sunset: {
    label: 'Sunset',
    swatch: ['#f97316', '#ec4899', '#8b5cf6'],
    light:
      'radial-gradient(1200px 600px at 10% -10%, rgba(249, 115, 22, .25), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(236, 72, 153, .25), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(139, 92, 246, .18), transparent 60%),' +
      '#fff7ed',
    dark:
      'radial-gradient(1200px 600px at 10% -10%, rgba(249, 115, 22, .22), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(236, 72, 153, .20), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(139, 92, 246, .18), transparent 60%),' +
      '#1c1917',
  },
  forest: {
    label: 'Forest',
    swatch: ['#10b981', '#14b8a6', '#84cc16'],
    light:
      'radial-gradient(1200px 600px at 10% -10%, rgba(16, 185, 129, .22), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(20, 184, 166, .22), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(132, 204, 22, .18), transparent 60%),' +
      '#f0fdf4',
    dark:
      'radial-gradient(1200px 600px at 10% -10%, rgba(16, 185, 129, .18), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(20, 184, 166, .18), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(132, 204, 22, .14), transparent 60%),' +
      '#0a0f0a',
  },
  ocean: {
    label: 'Ocean',
    swatch: ['#0ea5e9', '#6366f1', '#06b6d4'],
    light:
      'radial-gradient(1200px 600px at 10% -10%, rgba(14, 165, 233, .25), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(99, 102, 241, .22), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(6, 182, 212, .20), transparent 60%),' +
      '#f0f9ff',
    dark:
      'radial-gradient(1200px 600px at 10% -10%, rgba(14, 165, 233, .22), transparent 60%),' +
      'radial-gradient(900px 500px at 110% 10%, rgba(99, 102, 241, .18), transparent 60%),' +
      'radial-gradient(800px 400px at 50% 110%, rgba(6, 182, 212, .18), transparent 60%),' +
      '#020617',
  },
};

export const applyPreset = (name, theme) => {
  const p = PRESETS[name] || PRESETS.aurora;
  document.body.style.background = theme === 'dark' ? p.dark : p.light;
};
