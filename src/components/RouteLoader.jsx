import React, { useEffect, useState } from 'react';

// Thin top progress bar that animates whenever `route` changes. Plays a quick
// 0% -> ~80% sweep, then completes & fades.
export default function RouteLoader({ route }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'load' | 'finish'

  useEffect(() => {
    setPhase('load');
    const t1 = setTimeout(() => setPhase('finish'), 220);
    const t2 = setTimeout(() => setPhase('idle'), 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [route]);

  if (phase === 'idle') return null;

  const width = phase === 'load' ? '70%' : '100%';
  const opacity = phase === 'finish' ? 0 : 1;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] h-0.5 pointer-events-none"
      style={{ opacity, transition: 'opacity .25s ease' }}
    >
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
        style={{ width, transition: 'width .35s cubic-bezier(.2,.8,.2,1)' }}
      />
    </div>
  );
}
