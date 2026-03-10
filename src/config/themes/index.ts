/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIGURARE CENTRALIZATĂ — TEME & STILURI VIZUALE
 * ═══════════════════════════════════════════════════════════════
 *
 * Acest fișier este SINGURUL loc de configurare vizuală.
 *
 * ── CULORI (Theme) ──
 *   Schimbă DEFAULT_THEME pentru a alege paleta de culori.
 *   Teme disponibile: 'orange' | 'tomato' | 'freshGreen' | 'mustard'
 *
 * ── STILURI COMPONENTE (Styles) ──
 *   Schimbă valorile din STYLES pentru a alege skinul fiecărei secțiuni.
 *   Stiluri disponibile: 'gamified' | 'clean' | 'premium' | 'friendly'
 *
 * Exemplu:
 *   DEFAULT_THEME = 'tomato'      → culori roșu-cald
 *   STYLES.navbar = 'premium'     → navigație cu glassmorphism
 *   STYLES.productCard = 'clean'  → carduri minimaliste
 */

import { createContext, useContext } from 'react';
import orange from './orange';
import tomato from './tomato';
import freshGreen from './freshGreen';
import mustard from './mustard';
import type { ThemePreset } from './types';

// ═══════════════════════════════════════════════════════════════
// 1. CULORI — Paleta de culori a aplicației
// ═══════════════════════════════════════════════════════════════

export type ThemeName = 'orange' | 'tomato' | 'freshGreen' | 'mustard';

// ╔═══════════════════════════════════════════╗
// ║  👇 SCHIMBĂ TEMA AICI (change theme here) ║
// ╚═══════════════════════════════════════════╝
export const DEFAULT_THEME: ThemeName = 'freshGreen';

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

  for (const [key, value] of Object.entries(theme.light)) {
    root.style.setProperty(key, value);
  }

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

// ═══════════════════════════════════════════════════════════════
// 2. STILURI — Skinul vizual al fiecărei secțiuni
// ═══════════════════════════════════════════════════════════════

export type StyleName = 'gamified' | 'clean' | 'premium' | 'friendly';

// ╔═══════════════════════════════════════════════════════════════════╗
// ║  👇 CONFIGURARE STILURI VIZUALE — schimbă individual            ║
// ╚═══════════════════════════════════════════════════════════════════╝

export const STYLES = {
  /** Streak, Points, Rewards */
  component: 'friendly' as StyleName,

  /** TierProgressBar (ranguri) */
  tier: 'friendly' as StyleName,

  /** Carduri de produse */
  productCard: 'friendly' as StyleName,

  /** Navbar desktop + MobileBottomNav */
  navbar: 'friendly' as StyleName,

  // ── Viitoare ──
  // cart: 'friendly' as StyleName,
  // checkout: 'friendly' as StyleName,
  // welcomeBonus: 'friendly' as StyleName,
  // home: 'friendly' as StyleName,
  // footer: 'friendly' as StyleName,
} as const;

// ── Contexte React ──

const ComponentStyleCtx = createContext<StyleName>(STYLES.component);
const TierStyleCtx = createContext<StyleName>(STYLES.tier);
const ProductCardStyleCtx = createContext<StyleName>(STYLES.productCard);
const NavbarStyleCtx = createContext<StyleName>(STYLES.navbar);

// Provideri
export const ComponentStyleProvider = ComponentStyleCtx.Provider;
export const TierStyleProvider = TierStyleCtx.Provider;
export const ProductCardStyleProvider = ProductCardStyleCtx.Provider;
export const NavbarStyleProvider = NavbarStyleCtx.Provider;

// Hook-uri
export const useComponentStyle = () => useContext(ComponentStyleCtx);
export const useTierStyle = () => useContext(TierStyleCtx);
export const useProductCardStyle = () => useContext(ProductCardStyleCtx);
export const useNavbarStyle = () => useContext(NavbarStyleCtx);

export type { ThemePreset } from './types';
