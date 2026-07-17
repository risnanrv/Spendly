export interface CategoryColorSet {
  bg: string;
  text: string;
  fill: string;
  border: string;
}

export const getCategoryColorClasses = (color: string): CategoryColorSet => {
  const map: Record<string, CategoryColorSet> = {
    indigo: { bg: 'bg-[#111111]/10', text: 'text-[#111111]', fill: 'bg-[#111111]', border: 'border-[#111111]/20' },
    orange: { bg: 'bg-[#222222]/10', text: 'text-[#222222]', fill: 'bg-[#222222]', border: 'border-[#222222]/20' },
    blue: { bg: 'bg-[#333333]/10', text: 'text-[#333333]', fill: 'bg-[#333333]', border: 'border-[#333333]/20' },
    purple: { bg: 'bg-[#444444]/10', text: 'text-[#444444]', fill: 'bg-[#444444]', border: 'border-[#444444]/20' },
    red: { bg: 'bg-[#555555]/10', text: 'text-[#555555]', fill: 'bg-[#555555]', border: 'border-[#555555]/20' },
    pink: { bg: 'bg-[#666666]/10', text: 'text-[#666666]', fill: 'bg-[#666666]', border: 'border-[#666666]/20' },
    emerald: { bg: 'bg-[#2B2B2B]/10', text: 'text-[#2B2B2B]', fill: 'bg-[#2B2B2B]', border: 'border-[#2B2B2B]/20' },
    violet: { bg: 'bg-[#4B4B4B]/10', text: 'text-[#4B4B4B]', fill: 'bg-[#4B4B4B]', border: 'border-[#4B4B4B]/20' },
    cyan: { bg: 'bg-[#5B5B5B]/10', text: 'text-[#5B5B5B]', fill: 'bg-[#5B5B5B]', border: 'border-[#5B5B5B]/20' },
    amber: { bg: 'bg-[#6B6B6B]/10', text: 'text-[#6B6B6B]', fill: 'bg-[#6B6B6B]', border: 'border-[#6B6B6B]/20' },
    slate: { bg: 'bg-[#777777]/10', text: 'text-[#777777]', fill: 'bg-[#777777]', border: 'border-[#777777]/20' },
    rose: { bg: 'bg-[#888888]/10', text: 'text-[#888888]', fill: 'bg-[#888888]', border: 'border-[#888888]/20' },
    teal: { bg: 'bg-[#999999]/10', text: 'text-[#999999]', fill: 'bg-[#999999]', border: 'border-[#999999]/20' },
    yellow: { bg: 'bg-[#AAAAAA]/10', text: 'text-[#AAAAAA]', fill: 'bg-[#AAAAAA]', border: 'border-[#AAAAAA]/20' },
    lightBlue: { bg: 'bg-[#555555]/10', text: 'text-[#555555]', fill: 'bg-[#555555]', border: 'border-[#555555]/20' },
    gray: { bg: 'bg-[#707070]/10', text: 'text-[#707070]', fill: 'bg-[#707070]', border: 'border-[#707070]/20' },
  };

  return map[color] || { bg: 'bg-[#707070]/10', text: 'text-[#707070]', fill: 'bg-[#707070]', border: 'border-[#707070]/20' };
};
