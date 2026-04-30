import React, { useMemo } from 'react';
import { Snowflake } from 'lucide-react';
import { cn } from '../lib/utils';

// Full-screen frost overlay shown when *today* is frozen. Captures all
// pointer events so the rest of the app is interaction-locked. The two
// allowed actions (Today's Freeze toggle and the News nav item) live
// elsewhere in the tree at a higher z-index so they punch through.
//
// Layers (bottom → top):
//   1. cyan tint + corner radial frost
//   2. drifting snowflakes (ambient motion)
const FLAKES = 14;

export default function FreezeOverlay({ active }) {
  // Pre-compute random per-flake props once so each render is stable. Without
  // this the flakes restart every state change, which feels janky.
  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKES }, (_, i) => ({
        key: i,
        left: `${Math.round((i / FLAKES) * 100 + Math.random() * 6 - 3)}%`,
        size: 12 + Math.round(Math.random() * 14),
        delay: `${Math.round(Math.random() * 14_000) / 1000}s`,
        duration: `${10 + Math.round(Math.random() * 10)}s`,
        opacity: 0.4 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <div
      aria-hidden={!active}
      // pointer-events on the overlay capture every click so the app behind
      // is locked. The Unfreeze badge below is the only escape hatch.
      className={cn(
        'fixed inset-0 z-[140] transition-opacity duration-700',
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Cyan tint + frost corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(165,243,252,0.55), transparent 45%),' +
            'radial-gradient(circle at 100% 0%, rgba(186,230,253,0.55), transparent 45%),' +
            'radial-gradient(circle at 100% 100%, rgba(207,250,254,0.55), transparent 45%),' +
            'radial-gradient(circle at 0% 100%, rgba(224,242,254,0.55), transparent 45%),' +
            'linear-gradient(180deg, rgba(186,230,253,0.18), rgba(165,243,252,0.10))',
          backdropFilter: active ? 'blur(2px) saturate(0.85)' : 'none',
          WebkitBackdropFilter: active ? 'blur(2px) saturate(0.85)' : 'none',
          transition: 'backdrop-filter .9s ease',
        }}
      />

      {/* Drifting flakes */}
      {active && flakes.map((f) => (
        <Snowflake
          key={f.key}
          size={f.size}
          className="absolute text-cyan-500 drop-shadow"
          style={{
            top: '-5vh',
            left: f.left,
            opacity: f.opacity,
            animation: `drift ${f.duration} linear infinite`,
            animationDelay: f.delay,
          }}
        />
      ))}

      {/* Hint chip — non-interactive, just tells the user what to do. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/95 text-white text-[11px] font-semibold shadow-lg shadow-cyan-500/40 animate-pop-in pointer-events-none">
        <Snowflake size={12} className="animate-pulse-soft" />
        Frozen · click Freeze on Today to unfreeze
      </div>
    </div>
  );
}
