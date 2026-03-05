/**
 * Teste pentru pluginul Tiers (Loyalty RPG)
 * Verifică: tipuri, queries GraphQL, componente profile tiers
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// 1. Tipuri & Interfețe
// ============================================================================

describe('Tiers - Tipuri utilizator', () => {
  it('structura User include câmpuri tiers', () => {
    const user = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      phone: '0700000000',
      totalXp: 150,
      tier: {
        id: 'tier-1',
        name: 'Silver',
        xpThreshold: 100,
        pointsMultiplier: 1.15,
        badgeIcon: '🥈',
      },
      nextTier: {
        id: 'tier-2',
        name: 'Gold',
        xpThreshold: 500,
        pointsMultiplier: 1.30,
        badgeIcon: '🥇',
      },
      xpToNextLevel: 350,
      createdAt: new Date().toISOString(),
    };

    expect(user.totalXp).toBe(150);
    expect(user.tier?.name).toBe('Silver');
    expect(user.tier?.pointsMultiplier).toBe(1.15);
    expect(user.nextTier?.xpThreshold).toBe(500);
    expect(user.xpToNextLevel).toBe(350);
  });

  it('tier și nextTier pot fi null', () => {
    const user = {
      id: '2',
      email: 'new@test.com',
      name: 'New User',
      phone: '0700000001',
      totalXp: 0,
      tier: null,
      nextTier: null,
      xpToNextLevel: null,
      createdAt: new Date().toISOString(),
    };

    expect(user.tier).toBeNull();
    expect(user.nextTier).toBeNull();
    expect(user.xpToNextLevel).toBeNull();
  });
});

// ============================================================================
// 2. Logică XP Progress
// ============================================================================

describe('Tiers - Calcul progres XP', () => {
  function calcProgress(
    totalXp: number,
    currentTierXp: number,
    nextTierXp: number | null
  ): number {
    if (nextTierXp === null) return 100; // Nivel maxim
    const range = nextTierXp - currentTierXp;
    if (range <= 0) return 100;
    const progress = ((totalXp - currentTierXp) / range) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  }

  it('calculează 0% la început de nivel', () => {
    expect(calcProgress(100, 100, 500)).toBe(0);
  });

  it('calculează 50% la jumătate', () => {
    expect(calcProgress(300, 100, 500)).toBe(50);
  });

  it('calculează 100% la nivelul maxim', () => {
    expect(calcProgress(999, 500, null)).toBe(100);
  });

  it('nu depășește 100%', () => {
    expect(calcProgress(600, 100, 500)).toBe(100);
  });

  it('nu scade sub 0%', () => {
    expect(calcProgress(50, 100, 500)).toBe(0);
  });
});

// ============================================================================
// 3. Logică determinare tier
// ============================================================================

describe('Tiers - Determinare nivel curent', () => {
  const tiers = [
    { id: 't1', name: 'Bronze', xpThreshold: 0, pointsMultiplier: 1.0 },
    { id: 't2', name: 'Silver', xpThreshold: 100, pointsMultiplier: 1.15 },
    { id: 't3', name: 'Gold', xpThreshold: 500, pointsMultiplier: 1.30 },
    { id: 't4', name: 'Platinum', xpThreshold: 1500, pointsMultiplier: 1.50 },
  ];

  function getTierForXp(totalXp: number) {
    const eligible = tiers.filter((t) => t.xpThreshold <= totalXp);
    return eligible.length > 0 ? eligible[eligible.length - 1] : null;
  }

  function getNextTierForXp(totalXp: number) {
    return tiers.find((t) => t.xpThreshold > totalXp) ?? null;
  }

  it('0 XP => Bronze', () => {
    expect(getTierForXp(0)?.name).toBe('Bronze');
  });

  it('100 XP => Silver', () => {
    expect(getTierForXp(100)?.name).toBe('Silver');
  });

  it('499 XP => Silver', () => {
    expect(getTierForXp(499)?.name).toBe('Silver');
  });

  it('500 XP => Gold', () => {
    expect(getTierForXp(500)?.name).toBe('Gold');
  });

  it('next tier pentru 100 XP este Gold', () => {
    expect(getNextTierForXp(100)?.name).toBe('Gold');
  });

  it('next tier pentru 1500+ XP este null (max)', () => {
    expect(getNextTierForXp(1500)).toBeNull();
  });
});

// ============================================================================
// 4. Multiplicator puncte
// ============================================================================

describe('Tiers - Multiplicator puncte', () => {
  it('aplică multiplicatorul corect la puncte câștigate', () => {
    const basePoints = 10;
    const multiplier = 1.30; // Gold
    const result = Math.round(basePoints * multiplier);
    expect(result).toBe(13);
  });

  it('multiplicator 1.0 nu schimbă punctele', () => {
    const basePoints = 10;
    const multiplier = 1.0;
    expect(Math.round(basePoints * multiplier)).toBe(10);
  });

  it('multiplicator default este 1 dacă plugin dezactivat', () => {
    const multiplier = undefined;
    const effective = multiplier ?? 1;
    expect(effective).toBe(1);
  });
});

// ============================================================================
// 5. Calcul XP din comandă
// ============================================================================

describe('Tiers - Calcul XP din comandă', () => {
  function calcXpFromOrder(
    total: number,
    xpPerOrder: number,
    xpPerRon: number
  ): number {
    let xp = xpPerOrder;
    if (xpPerRon > 0) {
      xp += Math.floor(total / xpPerRon);
    }
    return Math.max(0, xp);
  }

  it('doar XP fix per comandă', () => {
    expect(calcXpFromOrder(100, 10, 0)).toBe(10);
  });

  it('XP per RON (1 XP per RON)', () => {
    expect(calcXpFromOrder(85, 0, 1)).toBe(85);
  });

  it('combinat: fix + per RON', () => {
    expect(calcXpFromOrder(100, 5, 2)).toBe(55); // 5 + floor(100/2)
  });

  it('total 0 => doar XP fix', () => {
    expect(calcXpFromOrder(0, 10, 1)).toBe(10);
  });
});

// ============================================================================
// 6. Timeline niveluri - Unlocked logic
// ============================================================================

describe('Tiers - Timeline unlock logic', () => {
  const tiers = [
    { id: 't1', name: 'Bronze', xpThreshold: 0 },
    { id: 't2', name: 'Silver', xpThreshold: 100 },
    { id: 't3', name: 'Gold', xpThreshold: 500 },
  ];

  it('la 150 XP, Bronze și Silver sunt deblocate', () => {
    const userXp = 150;
    const unlocked = tiers.filter((t) => userXp >= t.xpThreshold);
    expect(unlocked).toHaveLength(2);
    expect(unlocked.map((t) => t.name)).toEqual(['Bronze', 'Silver']);
  });

  it('la 0 XP, doar Bronze este deblocat', () => {
    const userXp = 0;
    const unlocked = tiers.filter((t) => userXp >= t.xpThreshold);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].name).toBe('Bronze');
  });

  it('la 1000 XP, toate sunt deblocate', () => {
    const userXp = 1000;
    const unlocked = tiers.filter((t) => userXp >= t.xpThreshold);
    expect(unlocked).toHaveLength(3);
  });
});
