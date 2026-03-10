/**
 * ═══ Component Style System ═══
 *
 * Defines visual variants for gamification components.
 * Independent of color theme — allows different "feel" for different restaurant types.
 *
 * Two independent style selectors (both build-time only):
 *  1. Component Style  — controls streak, points, rewards components
 *  2. Tier Style       — controls TierProgressBar (rank display)
 *
 * Styles:
 *  - gamified: Energic, casino-like (glow, shimmer, sparkles) — fast-food, burger, pizza
 *  - clean:    Minimal and discreet — healthy brands, salad bars
 *  - premium:  Elegant and refined — upscale restaurants
 *  - friendly: Warm and approachable — bistro, Italian restaurants
 */

import React, { createContext, useContext } from 'react';

export type ComponentStyleName = 'gamified' | 'clean' | 'premium' | 'friendly';

// ╔═══════════════════════════════════════════════════════════════╗
// ║  👇 SCHIMBĂ STILUL STREAK / POINTS (change component style) ║
// ╚═══════════════════════════════════════════════════════════════╝
export const DEFAULT_COMPONENT_STYLE: ComponentStyleName = 'friendly';

// ╔═══════════════════════════════════════════════════════════════╗
// ║  👇 SCHIMBĂ STILUL TIER / RANK (change tier style)          ║
// ╚═══════════════════════════════════════════════════════════════╝
export const DEFAULT_TIER_STYLE: ComponentStyleName = 'friendly';

// ── Contexts ──

const ComponentStyleContext = createContext<ComponentStyleName>(DEFAULT_COMPONENT_STYLE);
const TierStyleContext = createContext<ComponentStyleName>(DEFAULT_TIER_STYLE);

export const ComponentStyleProvider = ComponentStyleContext.Provider;
export const TierStyleProvider = TierStyleContext.Provider;

export function useComponentStyle(): ComponentStyleName {
  return useContext(ComponentStyleContext);
}

export function useTierStyle(): ComponentStyleName {
  return useContext(TierStyleContext);
}

