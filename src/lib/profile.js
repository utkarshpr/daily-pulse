// Manages multi-profile localStorage namespacing.
// All per-profile keys are prefixed with `dp.profiles.<id>.`.

const PROFILES_KEY = 'dp.profiles.list';
const ACTIVE_KEY = 'dp.profiles.active';

export const getProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [{ id: 'default', name: 'Default', color: 'violet' }];
};

export const setProfiles = (list) => {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch { /* ignore */ }
};

export const getActiveProfile = () => {
  try { return localStorage.getItem(ACTIVE_KEY) || 'default'; } catch { return 'default'; }
};

export const setActiveProfile = (id) => {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
};

export const profileKey = (profileId, key) => `dp.profiles.${profileId}.${key}`;
