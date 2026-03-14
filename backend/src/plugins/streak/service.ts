/**
 * Streak campaign service V2 — motor de reguli complet
 * Recurență (calendar/rolling/consecutive), Praguri (scăriță/multiplicator),
 * Validare (min order), Resetare (hard/soft decay)
 * Plugin: plugins/streak
 */

import * as CampaignsRepo from './repositories/campaignsRepository.js';
import * as EnrollmentsRepo from './repositories/enrollmentsRepository.js';
import * as StreakLogsRepo from './repositories/streakLogsRepository.js';
import { getJoinCampaignEmailContent } from './email.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { logError } from '../../utils/safeErrorLogger.js';

export async function getActiveCampaign() {
  return CampaignsRepo.getActiveCampaign();
}

export async function getActiveCampaigns() {
  return CampaignsRepo.getActiveCampaigns();
}

export async function getCampaignWithDetails(campaignId: string) {
  const campaign = await CampaignsRepo.getCampaignById(campaignId);
  if (!campaign) return null;
  const rewardSteps = await CampaignsRepo.getRewardSteps(campaignId);
  return { ...campaign, rewardSteps };
}

export async function enrollUser(userId: string, campaignId: string) {
  const campaign = await CampaignsRepo.getCampaignById(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (!CampaignsRepo.isCampaignActive(campaign)) throw new Error('Campaign is not active');

  const activeEnrollments = await EnrollmentsRepo.getActiveEnrollmentsForUser(userId);
  const alreadyInThis = activeEnrollments.some((e) => e.campaignId === campaignId);
  if (!alreadyInThis && activeEnrollments.length > 0) {
    throw new Error('Ești deja înscris la o campanie. Poți participa doar la o campanie în același timp.');
  }

  const enrollment = await EnrollmentsRepo.enrollUser(userId, campaignId);
  getJoinCampaignEmailContent(campaign, { name: '', email: '' });
  return enrollment;
}

export async function getEnrollment(userId: string, campaignId: string) {
  return EnrollmentsRepo.getEnrollment(userId, campaignId);
}

export async function getEnrollmentByUserAndActive(userId: string) {
  return EnrollmentsRepo.getEnrollmentByUserAndActive(userId);
}

/* ─── Date helpers ─────────────────────────────────────────── */




function getRollingRange(dateStr: string, windowDays: number): [string, string] {
  const d = new Date(dateStr + 'T12:00:00Z');
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - windowDays + 1);
  return [start.toISOString().slice(0, 10), dateStr];
}

function consecutiveRunLength(sortedDates: string[], endDate: string): number {
  const set = new Set(sortedDates);
  if (!set.has(endDate)) return 0;
  let count = 0;
  let d = new Date(endDate + 'T12:00:00Z');
  const oneDay = 24 * 60 * 60 * 1000;
  while (set.has(d.toISOString().slice(0, 10))) {
    count++;
    d = new Date(d.getTime() - oneDay);
  }
  return count;
}

/* ─── Reward calculation ───────────────────────────────────── */

async function calculateStepReward(campaignId: string, currentCount: number, rewardType: CampaignsRepo.RewardType, bonusPoints: number, baseMultiplier: number, multiplierIncrement: number): Promise<number> {
  if (rewardType === 'single') {
    return bonusPoints;
  }

  if (rewardType === 'steps') {
    const steps = await CampaignsRepo.getRewardSteps(campaignId);
    let total = 0;
    for (const step of steps) {
      if (step.stepNumber <= currentCount) {
        total += step.pointsAwarded;
      }
    }
    return total;
  }

  if (rewardType === 'multiplier') {
    // baseMultiplier + (currentCount - 1) * multiplierIncrement → applied to bonusPoints
    const mult = baseMultiplier + (currentCount - 1) * multiplierIncrement;
    return Math.round(bonusPoints * mult);
  }

  return bonusPoints;
}

/** Calculate new reward points to award for reaching currentCount from previousCount */
async function getIncrementalReward(
  campaign: CampaignsRepo.StreakCampaign,
  previousCount: number,
  currentCount: number
): Promise<number> {
  if (campaign.rewardType === 'single') {
    // Only award when completed
    return 0;
  }

  if (campaign.rewardType === 'steps') {
    const steps = await CampaignsRepo.getRewardSteps(campaign.id);
    let reward = 0;
    for (const step of steps) {
      if (step.stepNumber > previousCount && step.stepNumber <= currentCount) {
        reward += step.pointsAwarded;
      }
    }
    return reward;
  }

  if (campaign.rewardType === 'multiplier') {
    const mult = campaign.baseMultiplier + (currentCount - 1) * campaign.multiplierIncrement;
    return Math.round(campaign.bonusPoints * mult);
  }

  return 0;
}

/* ─── Main order processing ────────────────────────────────── */

export async function recordOrderDelivered(
  userId: string,
  orderId: string,
  orderDate: Date,
  orderTotal?: number,
  orderProductIds?: string[]
): Promise<void> {
  const orderDateStr = CampaignsRepo.getDateInBucharest(orderDate);

  console.log(`[STREAK DEBUG] ═══════════════════════════════════════`);
  console.log(`[STREAK DEBUG] recordOrderDelivered called`);
  console.log(`[STREAK DEBUG]   userId=${userId}, orderId=${orderId}`);
  console.log(`[STREAK DEBUG]   orderDate=${orderDate.toISOString()}, orderDateStr=${orderDateStr}`);
  console.log(`[STREAK DEBUG]   orderTotal=${orderTotal}`);

  const enrollments = await EnrollmentsRepo.getActiveEnrollmentsForUser(userId);
  console.log(`[STREAK DEBUG]   activeEnrollments found: ${enrollments.length}`);

  if (enrollments.length === 0) {
    console.log(`[STREAK DEBUG]   ⚠️ No active enrollments — exiting`);
  }

  for (const enrollment of enrollments) {
    try {
      console.log(`[STREAK DEBUG]   ── enrollment ${enrollment.id} (campaign=${enrollment.campaignId}, currentStreak=${enrollment.currentStreakCount})`);

      const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
      if (!campaign) {
        console.log(`[STREAK DEBUG]     ⚠️ Campaign not found — skipping`);
        continue;
      }

      console.log(`[STREAK DEBUG]     campaign: name="${campaign.name}", recurrence=${campaign.recurrenceType}, rewardType=${campaign.rewardType}, ordersRequired=${campaign.ordersRequired}, minOrderValue=${campaign.minOrderValue}`);

      // ─── Validation: min order value ───
      if (campaign.minOrderValue > 0 && orderTotal != null && orderTotal < campaign.minOrderValue) {
        console.log(`[STREAK DEBUG]     ⚠️ Order total ${orderTotal} < minOrderValue ${campaign.minOrderValue} — skipping`);
        continue;
      }

      // ─── Insert log (poate fi duplicate day – ziua deja înregistrată) ───
      const inserted = await StreakLogsRepo.insertLog(enrollment.id, orderId, orderDateStr, orderTotal);
      console.log(`[STREAK DEBUG]     insertLog result: inserted=${inserted}`);

      // ─── Recalculăm mereu progresul din streak_logs ───
      const previousCount = enrollment.currentStreakCount;
      let currentCount = 0;

      if (campaign.recurrenceType === 'consecutive') {
        const allDates = await StreakLogsRepo.getOrderDatesForEnrollment(enrollment.id);
        console.log(`[STREAK DEBUG]     consecutive: allDates=[${allDates.join(', ')}], orderDateStr=${orderDateStr}`);
        currentCount = consecutiveRunLength(allDates, orderDateStr);
        console.log(`[STREAK DEBUG]     consecutive: consecutiveRunLength=${currentCount}`);

      } else if (campaign.recurrenceType === 'rolling') {
        const [rangeStart, rangeEnd] = getRollingRange(orderDateStr, campaign.rollingWindowDays);
        const rangeDates = await StreakLogsRepo.getOrderDatesInRange(enrollment.id, rangeStart, rangeEnd);
        console.log(`[STREAK DEBUG]     rolling: range=[${rangeStart}, ${rangeEnd}], rangeDates=[${rangeDates.join(', ')}]`);
        currentCount = rangeDates.length;
      }

      const completed = currentCount >= campaign.ordersRequired;
      const currentLevel = completed ? campaign.ordersRequired : currentCount;
      const now = new Date();

      console.log(`[STREAK DEBUG]     RESULT: previousCount=${previousCount} → currentCount=${currentCount}, completed=${completed}`);

      await EnrollmentsRepo.updateEnrollmentProgress(
        enrollment.id,
        currentCount,
        currentLevel,
        completed ? now : null,
        completed ? now : null
      );
      console.log(`[STREAK DEBUG]     ✅ Progress updated in DB`);

      // ─── Acordăm puncte doar când ziua a fost nou inserată ───
      if (inserted) {
        const pointsEnabled = await isPluginEnabled('points');
        if (pointsEnabled) {
          const { addPoints } = await import('../points/repositories/transactionsRepository.js');

          if (campaign.rewardType === 'single' && completed && campaign.bonusPoints > 0) {
            console.log(`[STREAK DEBUG]     🎁 Awarding single bonus: ${campaign.bonusPoints} points`);
            await addPoints(userId, campaign.bonusPoints, null, 'earned');
          } else if (campaign.rewardType === 'steps' || campaign.rewardType === 'multiplier') {
            const reward = await getIncrementalReward(campaign, previousCount, currentCount);
            console.log(`[STREAK DEBUG]     🎁 Incremental reward: ${reward} points`);
            if (reward > 0) {
              await addPoints(userId, reward, null, 'earned');
            }
            if (completed && campaign.bonusPoints > 0 && campaign.rewardType === 'steps') {
              console.log(`[STREAK DEBUG]     🎁 Steps completion bonus: ${campaign.bonusPoints} points`);
              await addPoints(userId, campaign.bonusPoints, null, 'earned');
            }
          }
        }
      }
    } catch (err) {
      console.error(`[STREAK DEBUG]     ❌ Error:`, err);
      logError('streak recordOrderDelivered', err);
    }
  }
  console.log(`[STREAK DEBUG] ═══════════════════════════════════════`);
}

/**
 * Recalculează progresul unui enrollment din streak_logs (pentru date existente care nu s-au actualizat).
 */
export async function recalcEnrollmentProgressFromLogs(enrollmentId: string): Promise<{ currentCount: number; currentLevel: number; updated: boolean }> {
  const enrollment = await EnrollmentsRepo.getEnrollmentById(enrollmentId);
  if (!enrollment) return { currentCount: 0, currentLevel: 0, updated: false };
  const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
  if (!campaign) return { currentCount: 0, currentLevel: 0, updated: false };

  const allDates = await StreakLogsRepo.getOrderDatesForEnrollment(enrollmentId);
  let currentCount = 0;
  if (allDates.length > 0) {
    const lastDate = allDates[allDates.length - 1];
    if (campaign.recurrenceType === 'consecutive') {
      currentCount = consecutiveRunLength(allDates, lastDate);
    } else {
      const [rangeStart, rangeEnd] = getRollingRange(lastDate, campaign.rollingWindowDays);
      const rangeDates = await StreakLogsRepo.getOrderDatesInRange(enrollmentId, rangeStart, rangeEnd);
      currentCount = rangeDates.length;
    }
  }
  const completed = currentCount >= campaign.ordersRequired;
  const currentLevel = completed ? campaign.ordersRequired : currentCount;
  const now = new Date();
  await EnrollmentsRepo.updateEnrollmentProgress(
    enrollmentId,
    currentCount,
    currentLevel,
    completed ? now : null,
    completed ? now : null
  );
  return { currentCount, currentLevel, updated: true };
}

/**
 * Recalculează progresul pentru toate enrollment-urile (din streak_logs). Util după fix-uri când datele existente au rămas cu progres 0.
 */
export async function recalcAllEnrollmentsProgress(): Promise<{ processed: number; updated: number }> {
  const campaigns = await CampaignsRepo.listCampaigns();
  let processed = 0;
  let updated = 0;
  for (const c of campaigns) {
    const enrollments = await EnrollmentsRepo.listEnrollmentsByCampaign(c.id);
    for (const e of enrollments) {
      processed++;
      const result = await recalcEnrollmentProgressFromLogs(e.id);
      if (result.updated) updated++;
    }
  }
  return { processed, updated };
}

/* ─── Soft Decay (called by a cron/scheduler or on next order check) ── */

export async function applySoftDecay(enrollmentId: string): Promise<void> {
  const enrollment = await EnrollmentsRepo.getEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.completedAt) return;

  const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
  if (!campaign || campaign.resetType !== 'soft_decay') return;

  const newCount = Math.max(0, enrollment.currentStreakCount - 1);
  const newLevel = Math.max(0, enrollment.currentLevel - 1);
  await EnrollmentsRepo.updateEnrollmentProgress(enrollmentId, newCount, newLevel, null, null);
}
