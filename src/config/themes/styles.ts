/**
 * ═══ Sistem Centralizat de Stiluri Vizuale ═══
 *
 * Toate selectoarele de stil configurabile la build-time.
 * Fiecare proprietate poate fi setată independent.
 *
 * Stiluri disponibile:
 *  - gamified: Energic, casino-like (glow, shimmer, sparkles)
 *  - clean:    Minimal și discret
 *  - premium:  Elegant și rafinat
 *  - friendly: Cald și accesibil
 */

import React, { createContext, useContext } from 'react';

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
