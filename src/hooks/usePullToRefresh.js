import { useEffect, useRef, useState } from 'react';

const TRIGGER = 70;

export function usePullToRefresh(onRefresh) {
  const startY = useRef(null);
  const [pull, setPull] = useState(0);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        setPull(Math.min(dy, 120));
      }
    };
    const onTouchEnd = () => {
      if (pull >= TRIGGER) onRefresh?.();
      startY.current = null;
      setPull(0);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pull, onRefresh]);

  return { pull, ready: pull >= TRIGGER };
}
