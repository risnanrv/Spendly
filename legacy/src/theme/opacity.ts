export const opacity = {
  transparent: 0,
  hover: 0.08,
  focus: 0.12,
  disabled: 0.4,
  pressed: 0.85,
  default: 1,
} as const;

export type OpacityToken = keyof typeof opacity;
