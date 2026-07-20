export interface CategoryColorSet {
  bg: string;
  text: string;
  fill: string;
  border: string;
}

export const getCategoryColorClasses = (color: string): CategoryColorSet => {
  const map: Record<string, CategoryColorSet> = {
    black: { bg: 'bg-neutral-950/10', text: 'text-neutral-950', fill: 'bg-neutral-950', border: 'border-neutral-950/20' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-500', fill: 'bg-gray-500', border: 'border-gray-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500', fill: 'bg-red-500', border: 'border-red-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', fill: 'bg-orange-500', border: 'border-orange-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', fill: 'bg-amber-500', border: 'border-amber-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', fill: 'bg-yellow-500', border: 'border-yellow-500/20' },
    lime: { bg: 'bg-lime-500/10', text: 'text-lime-500', fill: 'bg-lime-500', border: 'border-lime-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', fill: 'bg-green-500', border: 'border-green-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', fill: 'bg-emerald-500', border: 'border-emerald-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-500', fill: 'bg-teal-500', border: 'border-teal-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', fill: 'bg-cyan-500', border: 'border-cyan-500/20' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', fill: 'bg-sky-500', border: 'border-sky-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', fill: 'bg-blue-500', border: 'border-blue-500/20' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', fill: 'bg-indigo-500', border: 'border-indigo-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', fill: 'bg-violet-500', border: 'border-violet-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', fill: 'bg-purple-500', border: 'border-purple-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', fill: 'bg-pink-500', border: 'border-pink-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', fill: 'bg-rose-500', border: 'border-rose-500/20' },
    brown: { bg: 'bg-amber-800/10', text: 'text-amber-800', fill: 'bg-amber-800', border: 'border-amber-800/20' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-500', fill: 'bg-slate-500', border: 'border-slate-500/20' },
  };

  return map[color] || { bg: 'bg-slate-500/10', text: 'text-slate-500', fill: 'bg-slate-500', border: 'border-slate-500/20' };
};
