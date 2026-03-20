/**
 * Shared utility functions for campaign cards
 */
import type { StreakCampaign, StreakEnrollment } from '../types';

export function buildRuleDescription(campaign: StreakCampaign): string {
  const { recurrenceType, ordersRequired, rollingWindowDays } = campaign;
  if (recurrenceType === 'consecutive') {
    return `Comandă ${ordersRequired} zile la rând pentru a completa streak-ul.`;
  }
  if (recurrenceType === 'rolling') {
    return `Plasează ${ordersRequired} comenzi în orice fereastră de ${rollingWindowDays} zile.`;
  }
  return `Completează ${ordersRequired} comenzi.`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function buildRewardDescription(campaign: StreakCampaign): string {
  if (campaign.rewardType === 'single') {
    return `Primești ${campaign.bonusPoints} puncte la completare.`;
  }
  if (campaign.rewardType === 'multiplier') {
    return `Puncte × multiplicator (baza ${campaign.baseMultiplier}x, +${campaign.multiplierIncrement}x/pas).`;
  }
  return `Câștigi puncte la fiecare prag + ${campaign.bonusPoints} bonus la final.`;
}

/**
 * Get today's date in Europe/Bucharest timezone as YYYY-MM-DD
 */
function getTodayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

/**
 * Get yesterday's date in Europe/Bucharest timezone as YYYY-MM-DD
 */
function getYesterdayBucharest(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

/**
 * For a consecutive streak: check if the streak is broken
 * (last order date is neither today nor yesterday)
 */
export function isConsecutiveStreakBroken(enrollment: StreakEnrollment | null, campaign: StreakCampaign): boolean {
  if (!enrollment || enrollment.completedAt) return false;
  if (campaign.recurrenceType !== 'consecutive') return false;
  if (enrollment.currentStreakCount === 0) return false;
  if (!enrollment.lastOrderDate) return false;

  const today = getTodayBucharest();
  const yesterday = getYesterdayBucharest();
  const lastDate = enrollment.lastOrderDate.slice(0, 10);

  return lastDate !== today && lastDate !== yesterday;
}

/**
 * Check if it's mathematically impossible to complete the campaign.
 * For rolling: remaining days < orders still needed
 * For consecutive: remaining days < orders still needed
 */
export function isImpossibleToComplete(enrollment: StreakEnrollment | null, campaign: StreakCampaign): boolean {
  if (!enrollment || enrollment.completedAt) return false;

  const remaining = daysRemaining(campaign.endDate);
  const ordersNeeded = campaign.ordersRequired - enrollment.currentStreakCount;

  if (ordersNeeded <= 0) return false;

  // Not enough days left in campaign
  return remaining < ordersNeeded;
}
