export const sizes = {
  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
  button: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  input: {
    height: 52,
  },
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
} as const;

export type AvatarSizeToken = keyof typeof sizes.avatar;
export type ButtonSizeToken = keyof typeof sizes.button;
export type IconSizeToken = keyof typeof sizes.icon;
