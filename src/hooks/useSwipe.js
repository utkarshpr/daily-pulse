import { useRef } from 'react';

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 } = {}) {
  const startX = useRef(null);
  const startY = useRef(null);
  const dx = useRef(0);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    dx.current = 0;
  };

  const onTouchMove = (e) => {
    if (startX.current == null) return;
    const t = e.touches[0];
    dx.current = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (Math.abs(dx.current) > Math.abs(dy)) {
      // primarily horizontal — prevent default page scroll? leave native
    }
  };

  const onTouchEnd = () => {
    const d = dx.current;
    if (Math.abs(d) >= threshold) {
      if (d > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }
    startX.current = null;
    startY.current = null;
    dx.current = 0;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
