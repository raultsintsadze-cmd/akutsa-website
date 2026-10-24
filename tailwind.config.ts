import type { Config } from 'tailwindcss';

// Design tokens live as CSS variables in src/app/globals.css; Tailwind maps onto them.
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: token('--color-cream'),
        forest: token('--color-forest'),
        gold: token('--color-gold'),
        // Dark green for text on gold (WCAG AA).
        ink: token('--color-ink')
      },
      fontFamily: {
        sans: ['var(--font-body)', 'var(--font-georgian)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-heading)', 'var(--font-georgian)', 'Georgia', 'serif']
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)'
      },
      spacing: {
        gutter: 'var(--gutter)',
        section: 'var(--section-y)',
        bar: 'var(--mobile-bar-h)'
      },
      height: {
        header: 'var(--header-h)'
      }
    }
  },
  plugins: []
};

export default config;
