/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Brand (Minimal Black & White)
        brand: {
          DEFAULT: '#111111',
          dark: '#000000',
          light: '#F7F7F7',
          surface: '#FFFFFF',
        },
        // Spendly semantic palette (light mode default)
        bg: {
          primary: '#FFFFFF',
          secondary: '#FFFFFF',
          card: '#F7F7F7',
          elevated: '#F7F7F7',
        },
        text: {
          primary: '#111111',
          secondary: '#707070',
          tertiary: '#A0A0A0',
          inverse: '#FFFFFF',
          brand: '#111111',
        },
        border: {
          subtle: '#F7F7F7',
          DEFAULT: '#EAEAEA',
          strong: '#707070',
        },
        success: { DEFAULT: '#10B981', bg: '#F0FDF4' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', bg: '#FEF2F2' },
        info: { DEFAULT: '#3B82F6', bg: '#EFF6FF' },

        // shadcn/ui generic mappings
        background: "hsl(var(--background, 0 0% 100%))",
        foreground: "hsl(var(--foreground, 224 71.4% 4.1%))",
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 224 71.4% 4.1%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 224 71.4% 4.1%))",
        },
        primary: {
          DEFAULT: "#5B45E0",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 220 14.3% 95.9%))",
          foreground: "hsl(var(--secondary-foreground, 220.9 39.3% 11%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 220 14.3% 95.9%))",
          foreground: "hsl(var(--muted-foreground, 220 8.9% 46.1%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 220 14.3% 95.9%))",
          foreground: "hsl(var(--accent-foreground, 220.9 39.3% 11%))",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        input: "hsl(var(--input, 214.3 31.8% 91.4%))",
        ring: "hsl(var(--ring, 262.1 83.3% 57.8%))",
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
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
