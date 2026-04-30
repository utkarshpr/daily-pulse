import confetti from 'canvas-confetti';

export const celebrate = () => {
  const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
  const end = Date.now() + 800;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.85 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.85 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  // a final burst from the centre
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, colors });
  }, 400);
};
