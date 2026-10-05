/**
 * Shared design tokens for every platform app. Colors resolve to CSS variables
 * (see src/base.css) so a storefront can re-theme per store by overriding
 * --brand / --brand-foreground at runtime.
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--foreground) / <alpha-value>)' },
        muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
        brand: { DEFAULT: 'hsl(var(--brand) / <alpha-value>)', foreground: 'hsl(var(--brand-foreground) / <alpha-value>)' },
        destructive: { DEFAULT: 'hsl(var(--destructive) / <alpha-value>)', foreground: 'hsl(0 0% 100% / <alpha-value>)' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
};
