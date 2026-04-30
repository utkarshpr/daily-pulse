import { useEffect } from 'react';

// Attaches a single global mousemove listener that updates --mx / --my custom
// properties on any .card element under the cursor. Cheap, no per-card listeners.
export function useCardSpotlight() {
  useEffect(() => {
    const onMove = (e) => {
      const target = e.target.closest?.('.card');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      target.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
}
