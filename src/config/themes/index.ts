/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIGURARE CENTRALIZATĂ — TEME & STILURI VIZUALE
 * ═══════════════════════════════════════════════════════════════
 */

import { createContext, useContext } from 'react';
import type { ThemePreset } from './types';

// ═══════════════════════════════════════════════════════════════
// 1. CULORI — Paleta de culori a aplicației
// ═══════════════════════════════════════════════════════════════

export type ThemeName = 'orange' | 'tomato' | 'freshGreen' | 'mustard';

export const DEFAULT_THEME: ThemeName = 'orange';

const THEME_LOADERS: Record<ThemeName, () => Promise<{ default: ThemePreset }>> = {
  orange: () => import('./orange'),
  tomato: () => import('./tomato'),
  freshGreen: () => import('./freshGreen'),
  mustard: () => import('./mustard'),
};

function applyThemePreset(theme: ThemePreset): void {
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

/** Încarcă doar fișierul temei active (chunk separat per temă). */
export async function loadAndApplyTheme(name: ThemeName = DEFAULT_THEME): Promise<void> {
  const mod = await THEME_LOADERS[name]();
  applyThemePreset(mod.default);
}

// ═══════════════════════════════════════════════════════════════
// 2. STILURI — Skinul vizual al fiecărei secțiuni
//    (Pagina Home nu mai are variantă aici — sursa unică: pages/homeStyles/home.tsx)
// ═══════════════════════════════════════════════════════════════

export type StyleName = 'clean' | 'clean' | 'premium' | 'friendly';

// ╔═══════════════════════════════════════════════════════════════════╗
// ║   CONFIGURARE STILURI VIZUALE — schimbă individual            ║
// ╚═══════════════════════════════════════════════════════════════════╝

/** Înălțimi nav — sincronizate cu h-14 (clean) / h-16 (restul) din componentele nav. */
export const NAV_BAR_HEIGHT = {
  clean: { mobile: '3.5rem', desktop: '3.5rem' },
  friendly: { mobile: '4rem', desktop: '4rem' },
  gamified: { mobile: '4rem', desktop: '4rem' },
  premium: { mobile: '4rem', desktop: '4rem' },
} as const;

export type NavbarStyleName = keyof typeof NAV_BAR_HEIGHT;

/** Variabile CSS globale pentru toast (în afara Layout) și padding main. */
export function applyNavbarLayoutCssVars(
  navbarStyle: NavbarStyleName = STYLES.navbar as NavbarStyleName,
): void {
  const heights = NAV_BAR_HEIGHT[navbarStyle] ?? NAV_BAR_HEIGHT.clean;
  document.documentElement.style.setProperty('--mobile-bottom-nav-height', heights.mobile);
  document.documentElement.style.setProperty('--layout-nav-pad-desktop', heights.desktop);
}

export const STYLES = {
  /** Streak, Points, Rewards */
  component: 'clean' as StyleName,

  /** TierProgressBar (ranguri) */
  tier: 'clean' as StyleName,

  /** Carduri de produse */
  productCard: 'clean' as StyleName,

  /** Navbar desktop + MobileBottomNav */
  navbar: 'clean' as StyleName,

  /** Pagina Coș */
  cart: 'clean' as StyleName,

  /** Pagina Checkout */
  checkout: 'clean' as StyleName,

  /** Footer */
  footer: 'clean' as StyleName,
} as const;

// ── Contexte React ──

const ComponentStyleCtx = createContext<StyleName>(STYLES.component);
const TierStyleCtx = createContext<StyleName>(STYLES.tier);
const ProductCardStyleCtx = createContext<StyleName>(STYLES.productCard);
const NavbarStyleCtx = createContext<StyleName>(STYLES.navbar);
const CartStyleCtx = createContext<StyleName>(STYLES.cart);
const CheckoutStyleCtx = createContext<StyleName>(STYLES.checkout);
const FooterStyleCtx = createContext<StyleName>(STYLES.footer);

// Provideri
export const ComponentStyleProvider = ComponentStyleCtx.Provider;
export const TierStyleProvider = TierStyleCtx.Provider;
export const ProductCardStyleProvider = ProductCardStyleCtx.Provider;
export const NavbarStyleProvider = NavbarStyleCtx.Provider;
export const CartStyleProvider = CartStyleCtx.Provider;
export const CheckoutStyleProvider = CheckoutStyleCtx.Provider;
export const FooterStyleProvider = FooterStyleCtx.Provider;

// Hook-uri
export const useComponentStyle = () => useContext(ComponentStyleCtx);
export const useTierStyle = () => useContext(TierStyleCtx);
export const useProductCardStyle = () => useContext(ProductCardStyleCtx);
export const useNavbarStyle = () => useContext(NavbarStyleCtx);
export const useCartStyle = () => useContext(CartStyleCtx);
export const useCheckoutStyle = () => useContext(CheckoutStyleCtx);
export const useFooterStyle = () => useContext(FooterStyleCtx);

export type { ThemePreset } from './types';
