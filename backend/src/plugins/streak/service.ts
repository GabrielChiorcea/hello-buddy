/**
 * Streak campaign service - active campaign, enrollment, progress on order delivered
 * Plugin: plugins/streak
 */

import * as CampaignsRepo from './repositories/campaignsRepository.js';
import * as EnrollmentsRepo from './repositories/enrollmentsRepository.js';
import * as StreakLogsRepo from './repositories/streakLogsRepository.js';
import { getJoinCampaignEmailContent } from './email.js';
import { isPluginEnabled } from '../../utils/pluginFlags.js';
import { logError } from '../../utils/safeErrorLogger.js';

export async function getActiveCampaign(): Promise<CampaignsRepo.StreakCampaign | null> {
  return CampaignsRepo.getActiveCampaign();
}

export async function getActiveCampaigns(): Promise<CampaignsRepo.StreakCampaign[]> {
  return CampaignsRepo.getActiveCampaigns();
}

export async function enrollUser(userId: string, campaignId: string): Promise<EnrollmentsRepo.UserStreakCampaign> {
  const campaign = await CampaignsRepo.getCampaignById(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (!CampaignsRepo.isCampaignActive(campaign)) throw new Error('Campaign is not active');

  const activeEnrollments = await EnrollmentsRepo.getActiveEnrollmentsForUser(userId);
  const alreadyInThis = activeEnrollments.some((e) => e.campaignId === campaignId);
  if (!alreadyInThis && activeEnrollments.length > 0) {
    throw new Error('Ești deja înscris la o campanie. Poți participa doar la o campanie în același timp.');
  }

  const enrollment = await EnrollmentsRepo.enrollUser(userId, campaignId);
  // Prepare email content for future email service (no send)
  getJoinCampaignEmailContent(campaign, { name: '', email: '' });
  return enrollment;
}

export async function getEnrollment(userId: string, campaignId: string) {
  return EnrollmentsRepo.getEnrollment(userId, campaignId);
}

export async function getEnrollmentByUserAndActive(userId: string) {
  return EnrollmentsRepo.getEnrollmentByUserAndActive(userId);
}

/** ISO week: Monday = start. Returns [weekStart YYYY-MM-DD, weekEnd YYYY-MM-DD] */
function getISOWeekRange(dateStr: string): [string, string] {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return [fmt(monday), fmt(sunday)];
}

/** Whether date YYYY-MM-DD is Mon-Fri (1-5 in ISO) */
function isWorkingDay(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

/** Consecutive run length ending at endDate (inclusive), from sorted list of YYYY-MM-DD. If resetOnMiss, run is only from endDate backwards until a gap. */
function consecutiveRunLength(sortedDates: string[], endDate: string, resetOnMiss: boolean): number {
  const set = new Set(sortedDates);
  if (!set.has(endDate)) return 0;

  let count = 0;
  let d = new Date(endDate + 'T12:00:00Z');
  const oneDay = 24 * 60 * 60 * 1000;

  while (true) {
    const str = d.toISOString().slice(0, 10);
    if (!set.has(str)) break;
    count++;
    d = new Date(d.getTime() - oneDay);
  }
  return count;
}

/** Consecutive working-days run ending at endDate. */
function consecutiveWorkingDaysRun(sortedDates: string[], endDate: string, resetOnMiss: boolean): number {
  const workingDates = sortedDates.filter(isWorkingDay).sort();
  return consecutiveRunLength(workingDates, endDate, resetOnMiss);
}

export async function recordOrderDelivered(
  userId: string,
  orderId: string,
  orderDate: Date
): Promise<void> {
  const orderDateStr = orderDate.toISOString().slice(0, 10);

  const enrollments = await EnrollmentsRepo.getActiveEnrollmentsForUser(userId);
  for (const enrollment of enrollments) {
    try {
      await StreakLogsRepo.insertLog(enrollment.id, orderId, orderDateStr);
      const campaign = await CampaignsRepo.getCampaignById(enrollment.campaignId);
      if (!campaign) continue;

      const allDates = await StreakLogsRepo.getOrderDatesForEnrollment(enrollment.id);
      let currentCount = 0;

      if (campaign.streakType === 'consecutive_days') {
        currentCount = consecutiveRunLength(allDates, orderDateStr, campaign.resetOnMiss);
      } else if (campaign.streakType === 'days_per_week') {
        const [weekStart, weekEnd] = getISOWeekRange(orderDateStr);
        const weekDates = await StreakLogsRepo.getOrderDatesInWeek(enrollment.id, weekStart, weekEnd);
        currentCount = weekDates.length;
      } else {
        // working_days
        currentCount = consecutiveWorkingDaysRun(allDates, orderDateStr, campaign.resetOnMiss);
      }

      const completed = currentCount >= campaign.ordersRequired;
      const now = new Date();
      await EnrollmentsRepo.updateEnrollmentProgress(
        enrollment.id,
        currentCount,
        completed ? now : null,
        completed ? now : null
      );

      if (completed && campaign.bonusPoints > 0) {
        const pointsEnabled = await isPluginEnabled('points');
        if (pointsEnabled) {
          const { addPoints } = await import('../points/repositories/transactionsRepository.js');
          await addPoints(userId, campaign.bonusPoints, null, 'earned');
        }
      }
    } catch (err) {
      logError('streak recordOrderDelivered', err);
    }
  }
}
