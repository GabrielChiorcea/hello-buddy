/**
 * Shared utility functions for campaign cards
 */
import type { StreakCampaign, StreakEnrollment } from '../types';
import type { PointsReward } from '@/plugins/points/types';

/** Pragul (în zile) sub care o campanie e considerată „urgentă" pentru selecția hero. */
export const HERO_URGENCY_THRESHOLD_DAYS = 7;

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
  const today = getTodayBucharest();
  const endDay = endDate.slice(0, 10);
  const oneDayMs = 1000 * 60 * 60 * 24;

  // Calendar-day diff (inclusive) to avoid partial-day timezone issues.
  const todayUtc = new Date(`${today}T12:00:00Z`);
  const endUtc = new Date(`${endDay}T12:00:00Z`);
  const diffDaysInclusive = Math.floor((endUtc.getTime() - todayUtc.getTime()) / oneDayMs) + 1;

  return Math.max(0, diffDaysInclusive);
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

/**
 * Hide campaigns that are impossible to complete for current user progress.
 * Exception: rolling + steps campaigns can still grant partial rewards.
 */
export function shouldHideImpossibleCampaign(enrollment: StreakEnrollment | null, campaign: StreakCampaign): boolean {
  // Keep currently enrolled campaign visible so user can leave/unroll.
  if (enrollment) return false;
  if (enrollment?.completedAt) return false;

  const remaining = daysRemaining(campaign.endDate);
  const currentCount = enrollment?.currentStreakCount ?? 0;
  const ordersNeeded = campaign.ordersRequired - currentCount;

  if (ordersNeeded <= 0) return false;

  const impossibleToFinish = remaining < ordersNeeded;
  if (!impossibleToFinish) return false;

  const allowsPartialRewards = campaign.recurrenceType === 'rolling' && campaign.rewardType === 'steps';
  return !allowsPartialRewards;
}

/**
 * Recompensa SPECIFICĂ streak-ului (ce primește userul ÎN PLUS pentru că face campania,
 * față de comenzi obișnuite): bonusPoints + Σ rewardSteps.pointsAwarded (pentru `steps`).
 *
 * NU include `points_per_order` (acelea sunt puncte standard primite pentru orice comandă,
 * inclusiv în afara campaniei — includerea lor pe card e înșelătoare).
 *
 * Folosit pentru: afișarea pe carduri (Home) și pentru evaluarea „valorii" campaniei
 * din perspectiva userului.
 */
export function calculateCampaignStreakReward(campaign: StreakCampaign): number {
  const stepsPoints =
    campaign.rewardType === 'steps'
      ? campaign.rewardSteps.reduce((sum, step) => sum + step.pointsAwarded, 0)
      : 0;
  return campaign.bonusPoints + stepsPoints;
}

/**
 * Totalul de puncte pe care îl va acumula userul dacă termină campania:
 *   recompensă streak + ordersRequired × pointsPerOrder (puncte standard pe comandă).
 *
 * Folosit DOAR pentru calcule care depind de toate punctele acumulate
 * (ex.: estimarea reducerii maxime în RON via `calculateMaxDiscountFromPoints`).
 * NU folosi pentru afișaj pe card — vezi `calculateCampaignStreakReward`.
 */
export function calculateCampaignTotalPoints(
  campaign: StreakCampaign,
  pointsPerOrder: number
): number {
  const standardOrderPoints = Math.max(0, campaign.ordersRequired) * Math.max(0, pointsPerOrder);
  return calculateCampaignStreakReward(campaign) + standardOrderPoints;
}

/**
 * Strategie hibridă pentru a alege O campanie „erou" când userul nu este înrolat
 * și există mai multe campanii active simultan:
 *
 * 1. Dacă există campanii care expiră în ≤ HERO_URGENCY_THRESHOLD_DAYS (7) zile, ne restrângem
 *    selecția DOAR la acelea (urgența contează în prima fază).
 * 2. Altfel, alegem din toate campaniile.
 * 3. În cadrul subsetului ales, sortăm după totalul real de puncte (calculateCampaignTotalPoints)
 *    descrescător; tiebreak: campania care expiră prima (ascendent pe daysRemaining).
 *
 * Asigură coerența pe card: bonusul afișat și badge-ul „X zile rămase" provin din ACEEAȘI campanie.
 */
export function pickHeroCampaign(
  campaigns: StreakCampaign[],
  pointsPerOrder: number
): StreakCampaign | null {
  if (campaigns.length === 0) return null;
  if (campaigns.length === 1) return campaigns[0];

  const urgent = campaigns.filter((c) => daysRemaining(c.endDate) <= HERO_URGENCY_THRESHOLD_DAYS);
  const pool = urgent.length > 0 ? urgent : campaigns;

  const sorted = [...pool].sort((a, b) => {
    const totalA = calculateCampaignTotalPoints(a, pointsPerOrder);
    const totalB = calculateCampaignTotalPoints(b, pointsPerOrder);
    if (totalB !== totalA) return totalB - totalA;
    return daysRemaining(a.endDate) - daysRemaining(b.endDate);
  });

  return sorted[0] ?? null;
}

/**
 * Estimează reducerea maximă (în RON) ce poate fi obținută din `totalPoints` puncte,
 * dat fiind catalogul `pointsRewards` și un cap de `maxRedemptions` utilizări.
 *
 * Implementare: knapsack 2D cu repetare permisă a recompenselor (până la `maxRedemptions` total).
 * Folosit anterior duplicat în 5 fișiere — acum centralizat aici.
 */
export function calculateMaxDiscountFromPoints(
  totalPoints: number,
  pointsRewards: PointsReward[],
  maxRedemptions: number
): number {
  const rewards = pointsRewards.filter(
    (reward) => reward.isActive && reward.pointsCost > 0 && reward.discountAmount > 0
  );
  if (rewards.length === 0 || totalPoints <= 0 || maxRedemptions <= 0) return 0;

  const cap = Math.floor(totalPoints);
  const usesCap = Math.floor(maxRedemptions);
  const dp = Array.from({ length: usesCap + 1 }, () => new Array<number>(cap + 1).fill(0));

  for (let use = 1; use <= usesCap; use++) {
    for (let p = 0; p <= cap; p++) {
      dp[use][p] = dp[use - 1][p];
      for (const reward of rewards) {
        if (reward.pointsCost <= p) {
          dp[use][p] = Math.max(
            dp[use][p],
            dp[use - 1][p - reward.pointsCost] + reward.discountAmount
          );
        }
      }
    }
  }

  return dp[usesCap][cap];
}
