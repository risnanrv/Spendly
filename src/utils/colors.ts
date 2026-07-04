export interface CategoryColorSet {
  bg: string;
  text: string;
  fill: string;
  border: string;
}

export const getCategoryColorClasses = (color: string): CategoryColorSet => {
  const map: Record<string, CategoryColorSet> = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', fill: 'bg-indigo-500', border: 'border-indigo-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', fill: 'bg-orange-500', border: 'border-orange-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', fill: 'bg-blue-500', border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', fill: 'bg-purple-500', border: 'border-purple-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', fill: 'bg-red-500', border: 'border-red-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', fill: 'bg-pink-500', border: 'border-pink-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', fill: 'bg-emerald-500', border: 'border-emerald-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', fill: 'bg-violet-500', border: 'border-violet-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', fill: 'bg-cyan-500', border: 'border-cyan-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', fill: 'bg-amber-500', border: 'border-amber-500/20' },
    slate: { bg: 'bg-slate-500/10', text: 'text-slate-400', fill: 'bg-slate-500', border: 'border-slate-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', fill: 'bg-rose-500', border: 'border-rose-500/20' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', fill: 'bg-teal-500', border: 'border-teal-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', fill: 'bg-yellow-500', border: 'border-yellow-500/20' },
    lightBlue: { bg: 'bg-sky-500/10', text: 'text-sky-400', fill: 'bg-sky-500', border: 'border-sky-500/20' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', fill: 'bg-gray-500', border: 'border-gray-500/20' },
  };

  return map[color] || { bg: 'bg-slate-500/10', text: 'text-slate-400', fill: 'bg-slate-500', border: 'border-slate-500/20' };
};
