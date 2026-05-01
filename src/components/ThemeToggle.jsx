import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ThemeToggle({ theme, setTheme, compact = false }) {
  const isDark = theme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  if (compact) {
    // Hard-coded pixel layout to make the thumb position math literal and
    // immune to font-size scaling, parent flex stretching, or rem rounding.
    //   track 50px wide × 28px tall, padding 3px → thumb area 44×22
    //   thumb 22×22 sits flush to one side → travel = 44 − 22 = 22px
    const TRACK_W = 50;
    const TRACK_H = 28;
    const THUMB = 22;
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
          {isDark ? <Moon size={12} /> : <Sun size={12} />}
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
