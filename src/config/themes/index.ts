/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIGURARE CENTRALIZATĂ — TEME & STILURI VIZUALE
 * ═══════════════════════════════════════════════════════════════
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

export const DEFAULT_THEME: ThemeName = 'tomato';

export const themes: Record<ThemeName, ThemePreset> = {
  orange,
  tomato,
  freshGreen,
  mustard,
};

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
// ║   CONFIGURARE STILURI VIZUALE — schimbă individual            ║
// ╚═══════════════════════════════════════════════════════════════════╝

export const STYLES = {
  /** Streak, Points, Rewards */
  component: 'gamified' as StyleName,

  /** TierProgressBar (ranguri) */
  tier: 'gamified' as StyleName,

  /** Carduri de produse */
  productCard: 'gamified' as StyleName,

  /** Navbar desktop + MobileBottomNav (varianta premium: bordură fină = culoarea primary din tema activă — ThemeName) */
  navbar: 'premium' as StyleName,

  /** Pagina Coș */
  cart: 'gamified' as StyleName,

  /** Pagina Checkout */
  checkout: 'gamified' as StyleName,

  /** Pagina Home (Hero, Categorii, Recomandate, CTA) */
  home: 'clean' as StyleName,

  /** Footer */
  footer: 'gamified' as StyleName,
} as const;

// ── Contexte React ──

const ComponentStyleCtx = createContext<StyleName>(STYLES.component);
const TierStyleCtx = createContext<StyleName>(STYLES.tier);
const ProductCardStyleCtx = createContext<StyleName>(STYLES.productCard);
const NavbarStyleCtx = createContext<StyleName>(STYLES.navbar);
const CartStyleCtx = createContext<StyleName>(STYLES.cart);
const CheckoutStyleCtx = createContext<StyleName>(STYLES.checkout);
const HomeStyleCtx = createContext<StyleName>(STYLES.home);
const FooterStyleCtx = createContext<StyleName>(STYLES.footer);

// Provideri
export const ComponentStyleProvider = ComponentStyleCtx.Provider;
export const TierStyleProvider = TierStyleCtx.Provider;
export const ProductCardStyleProvider = ProductCardStyleCtx.Provider;
export const NavbarStyleProvider = NavbarStyleCtx.Provider;
export const CartStyleProvider = CartStyleCtx.Provider;
export const CheckoutStyleProvider = CheckoutStyleCtx.Provider;
export const HomeStyleProvider = HomeStyleCtx.Provider;
export const FooterStyleProvider = FooterStyleCtx.Provider;

// Hook-uri
export const useComponentStyle = () => useContext(ComponentStyleCtx);
export const useTierStyle = () => useContext(TierStyleCtx);
export const useProductCardStyle = () => useContext(ProductCardStyleCtx);
export const useNavbarStyle = () => useContext(NavbarStyleCtx);
export const useCartStyle = () => useContext(CartStyleCtx);
export const useCheckoutStyle = () => useContext(CheckoutStyleCtx);
export const useHomeStyle = () => useContext(HomeStyleCtx);
export const useFooterStyle = () => useContext(FooterStyleCtx);

export type { ThemePreset } from './types';
