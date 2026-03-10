/**
 * ═══ Component Style System ═══
 *
 * Defines visual variants for gamification components (streak, points, rewards).
 * Independent of color theme — allows different "feel" for different restaurant types.
 *
 * Styles:
 *  - gamified: Energic, casino-like (glow, shimmer, sparkles) — fast-food, burger, pizza
 *  - clean:    Minimal and discreet — healthy brands, salad bars
 *  - premium:  Elegant and refined — upscale restaurants
 *  - friendly: Warm and approachable — bistro, Italian restaurants
 */

import React, { createContext, useContext } from 'react';

export type ComponentStyleName = 'gamified' | 'clean' | 'premium' | 'friendly';

// ╔═══════════════════════════════════════════════════╗
// ║  👇 SCHIMBĂ STILUL AICI (change component style) ║
// ╚═══════════════════════════════════════════════════╝
export const DEFAULT_COMPONENT_STYLE: ComponentStyleName = 'gamified';

const ComponentStyleContext = createContext<ComponentStyleName>(DEFAULT_COMPONENT_STYLE);

export const ComponentStyleProvider = ComponentStyleContext.Provider;

export function useComponentStyle(): ComponentStyleName {
  return useContext(ComponentStyleContext);
}

/** Human-readable labels for admin UI */
export const COMPONENT_STYLE_LABELS: Record<ComponentStyleName, { label: string; description: string }> = {
  gamified: {
    label: 'Gamified',
    description: 'Stil energic cu badge-uri, glow și animații — ideal pentru fast-food',
  },
  clean: {
    label: 'Clean / Minimal',
    description: 'Design simplu și discret — ideal pentru healthy brands',
  },
  premium: {
    label: 'Premium',
    description: 'Stil elegant și sobru — ideal pentru restaurante upscale',
  },
  friendly: {
    label: 'Friendly / Casual',
    description: 'Stil cald și accesibil — ideal pentru bistro sau restaurante italiene',
  },
};
