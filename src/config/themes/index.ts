/**
 * ═══ Theme Configuration ═══
 *
 * To change the app's color scheme, change the value below:
 *
 *   export const DEFAULT_THEME = 'tomato';
 *
 * Available themes: 'orange' | 'tomato' | 'freshGreen' | 'mustard'
 */

import orange from './orange';
import tomato from './blue';
import freshGreen from './green';
import mustard from './purple';
import type { ThemePreset } from './types';

export type ThemeName = 'orange' | 'tomato' | 'freshGreen' | 'mustard';

// ╔═══════════════════════════════════════════╗
// ║  👇 SCHIMBĂ TEMA AICI (change theme here) ║
// ╚═══════════════════════════════════════════╝
export const DEFAULT_THEME: ThemeName = 'tomato';

export const themes: Record<ThemeName, ThemePreset> = {
  orange,
  tomato,
  freshGreen,
  mustard,
};

/**
 * Applies theme CSS variables to <html>.
 * Call once at app startup in main.tsx.
 */
export function applyTheme(name: ThemeName = DEFAULT_THEME): void {
  const theme = themes[name];
  if (!theme) return;

  const root = document.documentElement;

  // Apply light tokens to :root
  for (const [key, value] of Object.entries(theme.light)) {
    root.style.setProperty(key, value);
  }

  // Store dark tokens as data attribute for dark-mode override
  const darkStyleId = 'theme-dark-overrides';
  let darkStyle = document.getElementById(darkStyleId) as HTMLStyleElement | null;
  if (!darkStyle) {
    darkStyle = document.createElement('style');
    darkStyle.id = darkStyleId;
    document.head.appendChild(darkStyle);
  }

  const darkRules = Object.entries(theme.dark)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  darkStyle.textContent = `.dark {\n${darkRules}\n}`;
}

export type { ThemePreset } from './types';
