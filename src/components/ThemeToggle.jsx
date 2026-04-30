import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ThemeToggle({ theme, setTheme, compact = false }) {
  const isDark = theme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  if (compact) {
    return (
      <button
        onClick={toggle}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={cn(
          'relative h-9 w-16 rounded-full border transition-colors overflow-hidden',
          isDark
            ? 'bg-slate-800 border-white/10'
            : 'bg-gradient-to-r from-amber-200 to-sky-200 border-white/60'
        )}
      >
        <span
          className={cn(
            'absolute top-1 size-7 rounded-full grid place-items-center text-white shadow-md transition-all duration-300 ease-out',
            isDark
              ? 'left-[calc(100%-2rem)] bg-gradient-to-tr from-indigo-500 to-violet-600'
              : 'left-1 bg-gradient-to-tr from-amber-400 to-orange-500'
          )}
        >
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </span>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold tracking-wider transition-opacity',
            isDark ? 'text-white/40' : 'text-slate-600/60'
          )}
        >
          <span className={cn(isDark ? 'opacity-100' : 'opacity-0')}>DARK</span>
          <span className={cn(isDark ? 'opacity-0' : 'opacity-100')}>LITE</span>
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
