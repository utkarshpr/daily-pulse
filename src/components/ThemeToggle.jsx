import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ThemeToggle({ theme, setTheme, compact = false }) {
  const isDark = theme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  if (compact) {
    // Hard-coded pixel layout to make the thumb position math literal and
    // immune to font-size scaling, parent flex stretching, or rem rounding.
    //   track 60px wide × 32px tall, padding 3px → thumb area 54×26
    //   thumb 26×26 sits flush to one side → travel = 54 − 26 = 28px
    const TRACK_W = 60;
    const TRACK_H = 32;
    const THUMB = 26;
    const PAD = 3;
    return (
      <button
        onClick={toggle}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={cn(
          'relative shrink-0 rounded-full border transition-colors overflow-hidden',
          isDark
            ? 'bg-slate-800 border-white/10'
            : 'bg-gradient-to-r from-amber-200 to-sky-200 border-white/60'
        )}
        style={{ width: TRACK_W, height: TRACK_H, minWidth: TRACK_W, maxWidth: TRACK_W }}
      >
        <span
          className={cn(
            'absolute rounded-full grid place-items-center text-white shadow-md transition-transform duration-300 ease-out',
            isDark
              ? 'bg-gradient-to-tr from-indigo-500 to-violet-600'
              : 'bg-gradient-to-tr from-amber-400 to-orange-500'
          )}
          style={{
            top: PAD,
            left: PAD,
            width: THUMB,
            height: THUMB,
            transform: `translateX(${isDark ? TRACK_W - THUMB - PAD * 2 : 0}px)`,
          }}
        >
          {isDark ? <Moon size={13} /> : <Sun size={13} />}
        </span>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-between text-[9px] font-bold tracking-wider pointer-events-none',
            isDark ? 'text-white/40 pl-2 pr-9' : 'text-slate-600/60 pl-9 pr-2'
          )}
        >
          {isDark ? <span>DARK</span> : <span className="ml-auto">LITE</span>}
        </span>
      </button>
    );
  }

  return (
    <div className="relative bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-full p-1 flex">
      <span
        className={cn(
          'absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full shadow-md transition-all duration-300 ease-out bg-gradient-to-tr',
          isDark ? 'left-[calc(50%+0.125rem)] from-indigo-500 to-violet-600' : 'left-1 from-amber-400 to-orange-500'
        )}
      />
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
          !isDark ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        )}
        aria-pressed={!isDark}
      >
        <Sun size={13} />
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors',
          isDark ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        )}
        aria-pressed={isDark}
      >
        <Moon size={13} />
        Dark
      </button>
    </div>
  );
}
