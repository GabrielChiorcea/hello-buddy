/**
 * Color configuration for the application
 * All colors reference CSS variables defined in index.css
 * Use semantic tokens from Tailwind classes (e.g., bg-primary, text-foreground)
 *
 * To re-brand: change HSL values in index.css — everything updates automatically.
 * See THEMING_GUIDE.md for instructions.
 */

export const colors = {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))',
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))',
  },
  reward: {
    DEFAULT: 'hsl(var(--reward))',
    foreground: 'hsl(var(--reward-foreground))',
    light: 'hsl(var(--reward-light))',
    accent: 'hsl(var(--reward-accent))',
    surface: 'hsl(var(--reward-surface))',
    surfaceForeground: 'hsl(var(--reward-surface-foreground))',
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

export type ColorKey = keyof typeof colors;
