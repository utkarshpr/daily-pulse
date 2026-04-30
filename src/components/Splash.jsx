import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Splash() {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/10 to-cyan-500/10 backdrop-blur-md" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-violet-500 to-cyan-500 blur-2xl opacity-60 animate-pulse-soft" />
          <div className="relative size-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-2xl shadow-violet-500/40 animate-pop-in">
            <Sparkles size={36} className="animate-pulse-soft" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
            Daily Pulse
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-1">Loading…</div>
        </div>
        <Spinner />
      </div>
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-violet-500"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
