import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const readKey = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() =>
    typeof window === 'undefined' ? initialValue : readKey(key, initialValue)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota — ignore */ }
  }, [key, value]);

  return [value, setValue];
}

// Profile-aware variant.
//
// Correctness:
// - Reload triggers synchronously (useLayoutEffect) when the key changes, so
//   no render ever shows the old profile's data under the new profile's key.
// - Persistence happens inside the wrapped setter — never via an effect that
//   could fire with stale state against the new key, which would corrupt data
//   when switching profiles.
export function useProfileStorage(profileId, suffix, initialValue) {
  const key = `dp.profiles.${profileId}.${suffix}`;
  const [state, setStateInternal] = useState(() => readKey(key, initialValue));
  const lastKeyRef = useRef(key);

  // Reload state when profile changes (sync, before paint)
  useLayoutEffect(() => {
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setStateInternal(readKey(key, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setState = useCallback((next) => {
    setStateInternal((cur) => {
      const value = typeof next === 'function' ? next(cur) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch { /* quota — ignore */ }
      return value;
    });
  }, [key]);

  return [state, setState];
}
