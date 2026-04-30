import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BadgeShelf({ badges }) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">Trophy shelf</h2>
          <p className="text-xs text-slate-500">{earnedCount} of {badges.length} earned</p>
        </div>
        <div className="text-2xl tabular-nums font-bold bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
          {Math.round((earnedCount / badges.length) * 100)}%
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={cn(
              'rounded-2xl p-3 text-center border transition relative overflow-hidden group',
              b.earned
                ? 'border-transparent bg-gradient-to-br shadow-lg ' + b.grad
                : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-violet-400/40'
            )}
            title={`${b.name} — ${b.description}`}
          >
            <div className="text-3xl sm:text-4xl mb-1 transition-transform group-hover:scale-110">
              {b.earned ? b.icon : <Lock size={24} className="mx-auto text-slate-400" />}
            </div>
            <div className={cn('text-[11px] font-bold leading-tight', b.earned && 'text-white')}>{b.name}</div>
            <div className={cn('text-[9px] leading-tight mt-0.5', b.earned ? 'text-white/80' : 'text-slate-500')}>
              {b.description}
            </div>
            {!b.earned && b.target > 1 && (
              <div className="mt-2">
                <div className="h-1 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                    style={{ width: `${b.ratio * 100}%` }}
                  />
                </div>
                <div className="text-[9px] tabular-nums text-slate-400 mt-0.5">{b.progress}/{b.target}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
