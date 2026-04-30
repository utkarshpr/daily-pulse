import { useEffect } from 'react';

// Adds an IntersectionObserver that toggles `.in` on `.reveal` elements
// the first time they enter the viewport. Idempotent and self-cleaning.
export function useReveal(deps = []) {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal:not(.in)');
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
