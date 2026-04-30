import React, { useEffect, useRef, useState } from 'react';

// Smoothly animates from previous value to the new value.
// `format` lets callers customize display (e.g. `${n}%`).
export default function Ticker({ value, duration = 700, format = (n) => n }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    const target = Number(value) || 0;
    const from = Number(fromRef.current) || 0;
    if (target === from) {
      setDisplay(target);
      return;
    }
    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setDisplay(Number.isInteger(target) ? Math.round(v) : Number(v.toFixed(1)));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{format(display)}</>;
}
