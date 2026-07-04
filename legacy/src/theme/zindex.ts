export const zIndex = {
  base: 0,
  layout: 10,
  sticky: 100,
  overlay: 1000,
  modal: 2000,
  toast: 3000,
} as const;

export type ZIndexToken = keyof typeof zIndex;
