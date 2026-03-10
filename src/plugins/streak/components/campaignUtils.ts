/**
 * Shared utility functions for campaign cards
 */
import type { StreakCampaign } from '../types';

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
