import React from 'react';
import { Flame, PartyPopper } from 'lucide-react';
import type { StreakCampaign, StreakEnrollment } from '../types';
import { daysRemaining } from './campaignUtils';
import { StreakProgressBar } from './StreakProgressBar';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';

interface CampaignCompactPreviewProps {
  campaign: StreakCampaign;
  enrollment: StreakEnrollment | null;
  completed: boolean;
  isEnrolled: boolean;
  isFailed: boolean;
  failReason: 'broken' | 'impossible' | null;
  onOpenDetail?: () => void;
  tone?: 'gamified' | 'clean' | 'premium' | 'friendly';
}

export const CampaignCompactPreview: React.FC<CampaignCompactPreviewProps> = ({
  campaign,
  enrollment,
  completed,
  isEnrolled,
  isFailed,
  failReason,
  onOpenDetail,
  tone = 'clean',
}) => {
  const remaining = daysRemaining(campaign.endDate);
  const currentCount = enrollment?.currentStreakCount ?? 0;
  const required = enrollment?.campaign?.ordersRequired ?? campaign.ordersRequired;
  const isLastChance = !isFailed && remaining > 0 && remaining <= 2;
  const isUrgent = !isFailed && remaining > 2 && remaining <= 7;
  const rewardText = `${texts.streak.preview.earnPrefix} +${campaign.bonusPoints} ${texts.streak.preview.pointsSuffix}`;
  const ctaLabel = completed
    ? texts.streak.preview.ctaCompleted
    : isEnrolled
      ? texts.streak.preview.ctaActive
      : texts.streak.preview.ctaJoin;

  const toneClasses = {
    gamified: 'gamified-casino-card border-reward/30',
    clean: 'bg-card border-border',
    premium: 'bg-card border-border/60 shadow-md shadow-foreground/5',
    friendly: 'bg-accent/30 border-accent',
  }[tone];

  const statusLabel = completed
    ? texts.streak.preview.statusCompleted
    : isFailed
      ? texts.streak.preview.statusFailed
      : isLastChance
        ? texts.streak.preview.statusLastChance
        : isUrgent
          ? texts.streak.preview.statusUrgent
          : texts.streak.preview.statusLive;

  const rightLabel = isLastChance || isUrgent
    ? texts.streak.preview.daysLeft.replace('{days}', String(remaining))
    : ctaLabel;
  const previewImage = campaign.imageUrl ? getImageUrl(campaign.imageUrl) : null;

  if (tone === 'gamified') {
    return (
      <button
        type="button"
        onClick={onOpenDetail}
        className={cn(
          'group w-full rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] hover:border-primary/40',
          'min-h-[124px]',
          isFailed && 'opacity-70',
          toneClasses
        )}
      >
        <div className="relative flex h-full flex-col">
          {previewImage && (
            <div className="relative h-[104px] w-full shrink-0 overflow-hidden bg-muted/25 max-h-[34vw]">
              <img
                src={previewImage}
                alt={campaign.name}
                className="h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div className="flex h-full flex-col px-3 pb-3 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col items-start">
                <span className="text-3xl font-extrabold leading-none tracking-tight text-primary">+{campaign.bonusPoints}</span>
                <span className="mt-1 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  puncte bonus
                </span>
              </div>
              <span
                className={cn(
                  'inline-block self-start rounded-md px-2 py-0.5 text-[10px] font-medium leading-tight',
                  isLastChance
                    ? 'border border-destructive/25 bg-destructive/10 text-destructive'
                    : 'border border-primary/25 bg-primary/10 text-primary'
                )}
                role="status"
              >
                {isFailed && failReason ? texts.streak.preview.leave : rightLabel}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-foreground">
              {campaign.name}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{rewardText}</p>

            <StreakProgressBar
              className="mt-2"
              current={currentCount}
              required={required}
              completed={completed}
              recurrenceType={campaign.recurrenceType}
              rewardSteps={campaign.rewardSteps}
              variant="inline"
            />

            <div className="mt-3 pt-1 text-xs font-semibold text-primary">
              <span className="inline-flex items-center gap-1">{ctaLabel}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenDetail}
      className={cn(
        'group w-full rounded-2xl border p-3 text-left transition-all duration-300 hover:scale-[1.01] hover:border-primary/40',
        'min-h-[124px]',
        isFailed && 'opacity-70',
        toneClasses
      )}
    >
      <div className="flex h-full gap-3 sm:flex-row flex-col sm:items-center">
        <div className="flex items-center gap-2 sm:w-[120px]">
          {previewImage ? (
            <img
              src={previewImage}
              alt={campaign.name}
              className="h-10 w-10 rounded-xl border border-border/50 object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-reward/20 text-reward">
              {completed ? <PartyPopper className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
            </div>
          )}
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
            completed && 'bg-primary/20 text-primary',
            isFailed && 'bg-destructive/20 text-destructive',
            !completed && !isFailed && isLastChance && 'bg-destructive text-destructive-foreground',
            !completed && !isFailed && !isLastChance && 'bg-reward/20 text-foreground'
          )}>
            {statusLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">{rewardText}</p>
          <StreakProgressBar
            className="mt-2"
            current={currentCount}
            required={required}
            completed={completed}
            recurrenceType={campaign.recurrenceType}
            rewardSteps={campaign.rewardSteps}
            variant="inline"
          />
          {isEnrolled && !completed && !isFailed && currentCount > 0 && (
            <p className="mt-1 text-[11px] font-medium text-destructive">{texts.streak.preview.lossShort}</p>
          )}
        </div>

        <div className="flex items-center sm:justify-end">
          <span className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            isLastChance ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'
          )}>
            {isFailed && failReason ? texts.streak.preview.leave : rightLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
