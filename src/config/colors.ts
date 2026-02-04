/**
 * Color configuration for the application
 * These colors map to CSS variables defined in index.css
 * Use semantic tokens from Tailwind classes (e.g., bg-primary, text-foreground)
 */

export const colors = {
  // Primary colors - used for main actions, buttons, links
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  
  // Secondary colors - used for secondary actions
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  
  // Background colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  
  // Card colors
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))',
  },
  
  // Muted colors - for subtle backgrounds
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  
  // Accent colors
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  
  // Destructive/Error colors
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  
  // Success color - custom addition for food ordering
  success: {
    DEFAULT: 'hsl(142.1 76.2% 36.3%)', // Green
    foreground: 'hsl(0 0% 100%)',
  },
  
  // Warning color
  warning: {
    DEFAULT: 'hsl(45 93.4% 47.5%)', // Amber
    foreground: 'hsl(0 0% 0%)',
  },
  
  // Border and input colors
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

export type ColorKey = keyof typeof colors;
