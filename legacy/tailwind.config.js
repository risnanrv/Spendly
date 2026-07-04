/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          DEFAULT: '#5B45E0',
          dark: '#4332B8',
          light: '#EEEBFF',
          surface: '#120F2A',
        },
        // Spendly semantic palette (light mode)
        bg: {
          primary: '#FFFFFF',
          secondary: '#F6F5FF',
          card: '#FFFFFF',
          elevated: '#FFFFFF',
        },
        text: {
          primary: '#0F0E17',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
          brand: '#5B45E0',
        },
        border: {
          subtle: '#F0EFF8',
          DEFAULT: '#E5E3F3',
          strong: '#C4C0E6',
        },
        // Semantic
        success: { DEFAULT: '#10B981', bg: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', bg: '#FEF2F2' },
        info: { DEFAULT: '#3B82F6', bg: '#EFF6FF' },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        'sans-extrabold': ['Inter_800ExtraBold'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
      },
    },
  },
  plugins: [],
};
