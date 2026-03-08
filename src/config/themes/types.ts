/** HSL value string, e.g. "16 90% 50%" */
export type HslValue = string;

/** All CSS custom properties that define a theme */
export type ThemeTokens = Record<string, HslValue>;

export interface ThemePreset {
  name: string;
  light: ThemeTokens;
  dark: ThemeTokens;
}
