export const borders = {
  width: {
    none: 0,
    thin: 1,
    medium: 2,
    thick: 4,
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
} as const;

export type BorderWidthToken = keyof typeof borders.width;
export type BorderStyleToken = keyof typeof borders.style;
