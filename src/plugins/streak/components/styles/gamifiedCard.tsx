/**
 * Gamified style — Casino / Rewards look + Marketing FOMO triggers
 * Urgency badges, loss aversion, social proof, reward glow.
 * Broken/impossible streak detection with leave option.
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Gift, Sparkles, Shield, Calendar, Target, TrendingUp, AlertTriangle, Users, Zap, XCircle } from 'lucide-react';
import type { StreakCampaign, StreakEnrollment } from '../../types';
import { StreakProgressBar } from '../StreakProgressBar';
import { CampaignJoinButton } from '../CampaignJoinButton';
import { Skeleton } from '@/components/ui/skeleton';
import { buildRuleDescription, formatDate, daysRemaining } from '../campaignUtils';
import { RewardStepsLadder } from '../RewardStepsLadder';

interface Props {
  campaign: StreakCampaign;
  enrollment: StreakEnrollment | null;
  enrolledInOtherCampaign?: boolean;
  completed: boolean;
  isEnrolled: boolean;
  isFailed: boolean;
  failReason: 'broken' | 'impossible' | null;
  enrollmentLoading?: boolean;
}

/** Deterministic fake participant count based on campaign id */
function fakeParticipants(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return 120 + (Math.abs(hash) % 400);
}

export const GamifiedCard: React.FC<Props> = ({
  campaign, enrollment, enrolledInOtherCampaign, completed, isEnrolled, isFailed, failReason, enrollmentLoading,
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const hasSteps = campaign.rewardType === 'steps' && campaign.rewardSteps?.length > 0;
  const hasValidation = campaign.minOrderValue > 0;
  const isLastChance = remaining > 0 && remaining <= 3;
  const isUrgent = remaining > 3 && remaining <= 7;
  const participants = useMemo(() => fakeParticipants(campaign.id), [campaign.id]);

  // Loss aversion: enrolled but not completed
  const currentCount = enrollment?.currentStreakCount ?? 0;
  const ordersRequired = enrollment?.campaign?.ordersRequired ?? campaign.ordersRequired;
  const showLossAversion = isEnrolled && !completed && currentCount > 0;

  const streakBroken = failReason === 'broken';

  return (
    <div className={`gamified-casino-card relative overflow-hidden rounded-2xl h-full flex flex-col ${isFailed ? 'opacity-90' : ''}`}>
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-reward/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-reward-light/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating sparkles */}
      {!isFailed && (
        <>
          <div className="absolute top-4 right-6 pointer-events-none z-10">
            <Sparkles className="h-4 w-4 text-reward/50 streak-sparkle" />
          </div>
          <div className="absolute top-12 right-12 pointer-events-none z-10">
            <Sparkles className="h-3 w-3 text-reward-light/30 streak-sparkle" style={{ animationDelay: '0.7s' }} />
          </div>
        </>
      )}

      {/* ULTIMA ȘANSĂ badge */}
      {isLastChance && !isFailed && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 shadow-lg shadow-destructive/30 animate-pulse"
        >
          <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
          <span className="text-[10px] font-bold text-destructive-foreground uppercase tracking-wide">Ultima șansă!</span>
        </motion.div>
      )}

      {/* FAILED badge */}
      {isFailed && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 shadow-lg shadow-destructive/30"
        >
          <XCircle className="h-3 w-3 text-destructive-foreground" />
          <span className="text-[10px] font-bold text-destructive-foreground uppercase tracking-wide">
            {streakBroken ? 'Streak pierdut' : 'Nu mai poate fi completat'}
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isFailed ? 'from-muted to-muted-foreground/20' : 'from-reward to-reward-light'} flex items-center justify-center shadow-lg ${isFailed ? 'shadow-muted/20' : 'shadow-reward/40'} ${!completed && !isFailed ? 'streak-glow' : ''}`}>
              <Flame className={`h-5 w-5 ${isFailed ? 'text-muted-foreground' : 'text-reward-foreground'}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="gamified-casino-title truncate">{campaign.name}</h3>
            <p className="gamified-casino-body text-xs mt-0.5 opacity-90">
              {campaign.recurrenceType === 'consecutive' ? 'Zile consecutive' : campaign.recurrenceType === 'rolling' ? `Fereastră mobilă (${campaign.rollingWindowDays} zile)` : campaign.recurrenceType}
            </p>
          </div>
        </div>
      </div>

      {/* Failed state explanation */}
      {isFailed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-5 pb-3"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-destructive">
                {streakBroken
                  ? 'Ai pierdut o zi — streak-ul consecutiv s-a întrerupt'
                  : `Nu mai sunt suficiente zile (${remaining}) pentru a completa ${ordersRequired - currentCount} comenzi rămase`}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {streakBroken
                  ? 'Poți părăsi campania și te poți înscrie din nou sau la alta.'
                  : 'Poți părăsi campania și te poți înscrie la următoarea.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Social proof — hide when failed */}
      {!isFailed && (
        <div className="relative z-10 px-5 pb-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-reward-surface-foreground/[0.06] border border-reward-surface-foreground/10 px-2.5 py-1">
            <Users className="h-3 w-3 text-reward/80" />
            <span className="text-[10px] font-medium text-muted-foreground">{participants} participanți</span>
          </div>
        </div>
      )}

      {/* Rule description */}
      {!isFailed && (
        <div className="relative z-10 px-5 pb-2">
          <p className="gamified-casino-body leading-relaxed">
            {campaign.customText || buildRuleDescription(campaign)}
          </p>
        </div>
      )}

      {/* Period info */}
      <div className="relative z-10 px-5 pb-2 flex items-center gap-2 flex-wrap">
        <span className="gamified-casino-body text-xs flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-reward/90 flex-shrink-0" />
          {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
        </span>
        {!isFailed && isUrgent && (
          <span className="gamified-casino-badge-label bg-destructive/20 text-destructive rounded-full px-2.5 py-0.5 font-semibold">
            ⏰ {remaining} zile rămase
          </span>
        )}
        {!isFailed && isLastChance && (
          <span className="gamified-casino-badge-label bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 font-bold animate-pulse">
            🔥 {remaining} {remaining === 1 ? 'zi' : 'zile'} rămase!
          </span>
        )}
        {!isFailed && remaining > 7 && remaining <= 14 && (
          <span className="gamified-casino-badge-label bg-reward/30 text-reward-surface-foreground rounded-full px-2.5 py-0.5">
            {remaining} zile rămase
          </span>
        )}
      </div>

      {/* Reward highlight — glow card — hide when failed */}
      {!isFailed && (
        <div className="relative z-10 px-5 pb-2">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 rounded-xl border border-reward/30 bg-gradient-to-r from-reward/15 to-reward-light/10 px-3.5 py-2.5 shadow-sm shadow-reward/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-reward to-reward-light shadow-md shadow-reward/30">
              <Gift className="h-4 w-4 text-reward-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Câștigi +{campaign.bonusPoints} puncte</p>
              <p className="text-[10px] text-muted-foreground">
                {campaign.rewardType === 'single' ? 'La completarea streak-ului' : 'Bonus final + praguri intermediare'}
              </p>
            </div>
            <Sparkles className="ml-auto h-4 w-4 text-reward/50 streak-sparkle" />
          </motion.div>
        </div>
      )}

      {/* Loss aversion text — only when not failed */}
      {showLossAversion && !isFailed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-5 pb-2"
        >
          <div className="flex items-center gap-2 rounded-lg border border-reward/20 bg-reward/5 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-reward flex-shrink-0" />
            <p className="text-[11px] font-medium text-foreground">
              Ai deja <span className="font-bold text-reward">{currentCount}/{ordersRequired}</span> comenzi — <span className="font-bold text-destructive">nu pierde progresul!</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Reward badges — hide when failed */}
      {!isFailed && (
        <div className="relative z-10 px-5 pb-2 flex flex-wrap gap-2">
          <div className="gamified-badge-orders inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <Target className="h-3 w-3 text-reward flex-shrink-0" />
            <span className="gamified-casino-badge-label text-reward-surface-foreground">{campaign.ordersRequired} comenzi necesare</span>
          </div>
          {campaign.resetType === 'soft_decay' && (
            <div className="gamified-badge-softdecay inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
              <Shield className="h-3 w-3 text-status-confirmed flex-shrink-0" />
              <span className="gamified-casino-badge-label text-reward-surface-foreground">Soft Decay</span>
            </div>
          )}
        </div>
      )}

      {/* Steps ladder — only when not enrolled and not failed */}
      {hasSteps && !isEnrolled && !isFailed && (
        <div className="relative z-10 px-5 pb-3">
          <div className="rounded-xl p-3 bg-reward-surface-foreground/[0.04] border border-reward-surface-foreground/10">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-reward-surface-foreground/90" />
              <span className="gamified-casino-badge-label text-reward-surface-foreground uppercase tracking-wider">Praguri recompensă</span>
            </div>
            <RewardStepsLadder
              steps={campaign.rewardSteps}
              currentCount={null}
              styleName="gamified"
              bonusPoints={campaign.bonusPoints}
              completed={false}
            />
          </div>
        </div>
      )}

      {/* Multiplier info — hide when failed */}
      {campaign.rewardType === 'multiplier' && !isFailed && (
        <div className="relative z-10 px-5 pb-3">
          <div className="rounded-xl p-3 bg-reward-surface-foreground/[0.04] border border-reward-surface-foreground/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-reward-surface-foreground/90" />
              <span className="gamified-casino-badge-label text-reward-surface-foreground uppercase tracking-wider">Multiplicator</span>
            </div>
            <p className="gamified-casino-body text-xs">
              Baza {campaign.baseMultiplier}× · +{campaign.multiplierIncrement}× per pas · Aplicat la {campaign.bonusPoints} puncte
            </p>
          </div>
        </div>
      )}

      {/* Min. order — hide when failed */}
      {hasValidation && !isFailed && (
        <div className="relative z-10 px-5 pb-2 flex flex-wrap gap-2">
          <span className="gamified-badge-min gamified-casino-badge-label text-reward-surface-foreground rounded-full px-3 py-1">
            Min. {campaign.minOrderValue} RON/comandă
          </span>
        </div>
      )}

      {/* Progress — step nodes when enrolled and not failed */}
      {isEnrolled && !isFailed && (
        <div className="relative z-10 px-5 pb-4 flex-1 flex flex-col">
          {enrollmentLoading && !enrollment ? (
            <Skeleton className="h-12 w-full bg-reward-surface-foreground/10 rounded-lg" />
          ) : (
            <StreakProgressBar
              current={enrollment!.currentStreakCount}
              required={enrollment!.campaign?.ordersRequired ?? campaign.ordersRequired}
              completed={completed}
              recurrenceType={campaign.recurrenceType}
              rewardSteps={campaign.rewardSteps}
            />
          )}
        </div>
      )}

      <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-reward/30 to-transparent" />

      <div className="relative z-10 p-5 pt-4 mt-auto">
        <CampaignJoinButton
          campaign={campaign}
          enrollment={enrollment ?? undefined}
          enrolledInOtherCampaign={enrolledInOtherCampaign}
          isFailed={isFailed}
        />
      </div>
    </div>
  );
};
