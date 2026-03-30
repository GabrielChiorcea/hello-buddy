/**
 * HomeMarketingCards — Engine component for Home marketing cards section.
 * Single engine, 4 style variants. Feature-flag aware.
 * Shows streak card + future combo card between rank and recommended.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, AlertTriangle, Trophy, Zap, Clock, TicketPercent } from 'lucide-react';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { useAppSelector } from '@/store';
import { useComponentStyle } from '@/config/componentStyle';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import { isConsecutiveStreakBroken, isImpossibleToComplete, daysRemaining } from './campaignUtils';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';
import type { StreakCampaign, StreakEnrollment } from '../types';

const GET_STREAK_CARD_IMAGE = gql`
  query GetStreakCardImage {
    appSetting(key: "streak_home_card_image")
  }
`;

type StreakStatus = 'active' | 'lost' | 'completed' | 'available' | 'none';

/** Bordură 1px cu token semantic (variabile CSS) — se actualizează cu ThemeName */
function streakHomeCardBorderClass(status: StreakStatus): string {
  switch (status) {
    case 'lost':
      return 'border-destructive';
    case 'completed':
      return 'border-reward';
    case 'active':
    case 'available':
      return 'border-primary';
    default:
      return 'border-border';
  }
}

interface StreakCardData {
  status: StreakStatus;
  statusText: string;
  bonusPoints: number;
  progress?: { current: number; total: number };
  daysLeft?: number;
  /** Zile până la finalul campaniei (available: minim pe toate campaniile active) — badge urgență gamified */
  daysUntilCampaignEnd?: number;
  campaignName?: string;
  imageUrl?: string;
}

function useStreakCardData(): StreakCardData | null {
  const { enabled } = usePluginEnabled('streak');
  const { isAuthenticated } = useAppSelector((s) => s.user);

  const { data: campaignsData } = useQuery<{ activeStreakCampaigns: StreakCampaign[] }>(
    ACTIVE_STREAK_CAMPAIGNS,
    { fetchPolicy: 'cache-and-network', skip: !enabled }
  );
  const { data: enrollmentData } = useQuery<{ myStreakEnrollment: StreakEnrollment | null }>(
    MY_STREAK_ENROLLMENT,
    { fetchPolicy: 'cache-and-network', skip: !enabled }
  );
  const { data: imageData } = useQuery<{ appSetting: string | null }>(
    GET_STREAK_CARD_IMAGE,
    { fetchPolicy: 'cache-first', skip: !enabled }
  );
  const rawImage = imageData?.appSetting || undefined;
  const imageUrl = rawImage ? getImageUrl(rawImage) : undefined;

  if (!enabled) return null;

  const campaigns = campaignsData?.activeStreakCampaigns ?? [];
  const enrollment = enrollmentData?.myStreakEnrollment ?? null;
  const enrolledCampaign = enrollment
    ? campaigns.find((c) => c.id === enrollment.campaignId) ?? enrollment.campaign ?? null
    : null;

  if (campaigns.length === 0) return null;

  const topBonus = campaigns.reduce((max, c) => Math.max(max, c.bonusPoints), 0);
  const minDaysUntilEnd = Math.min(...campaigns.map((c) => daysRemaining(c.endDate)));

  // Completed
  if (enrollment?.completedAt) {
    return {
      status: 'completed',
      statusText: texts.streak.homeCardCompleted,
      bonusPoints: enrolledCampaign?.bonusPoints ?? topBonus,
      campaignName: enrolledCampaign?.name,
      imageUrl,
    };
  }

  // Enrolled — check if lost
  if (enrollment && enrolledCampaign) {
    const broken = isConsecutiveStreakBroken(enrollment, enrolledCampaign);
    const impossible = isImpossibleToComplete(enrollment, enrolledCampaign);

    if (broken || impossible) {
      return {
        status: 'lost',
        statusText: texts.streak.homeCardLost,
        bonusPoints: enrolledCampaign.bonusPoints,
        progress: { current: enrollment.currentStreakCount, total: enrolledCampaign.ordersRequired },
        campaignName: enrolledCampaign.name,
        imageUrl,
      };
    }

    return {
      status: 'active',
      statusText: texts.streak.homeCardActive,
      bonusPoints: enrolledCampaign.bonusPoints,
      progress: { current: enrollment.currentStreakCount, total: enrolledCampaign.ordersRequired },
      daysLeft: daysRemaining(enrolledCampaign.endDate),
      campaignName: enrolledCampaign.name,
      imageUrl,
    };
  }

  // Not enrolled but campaigns exist
  if (isAuthenticated || campaigns.length > 0) {
    return {
      status: 'available',
      statusText: texts.streak.homeCardAvailable,
      bonusPoints: topBonus,
      daysUntilCampaignEnd: minDaysUntilEnd,
      imageUrl,
    };
  }

  return null;
}

// ─── Style Variants ───

interface CardStyleProps {
  data: StreakCardData;
}

const CouponsPromoCard: React.FC = () => {
  const style = useComponentStyle();
  const cardClassByStyle = {
    gamified: 'relative overflow-hidden rounded-2xl border border-primary bg-gradient-to-br from-primary/5 to-accent/5 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.01]',
    clean: 'rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-md',
    premium: 'relative rounded-2xl border border-border bg-background/60 backdrop-blur-xl overflow-hidden transition-all hover:shadow-lg',
    friendly: 'rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden transition-all hover:shadow-md',
  } as const;

  return (
    <Link to={routes.coupons} className="block group mt-3">
      <div className={cardClassByStyle[style]}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TicketPercent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground leading-snug">Deblocheaza cupoane din puncte</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Activeaza cupoane si obtine reduceri pe produse direct in checkout.
              </p>
              <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2.5 flex items-center justify-center gap-2 font-semibold text-sm text-primary transition-colors group-hover:bg-primary/15">
                <span>Vezi cupoane</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

function streakStatusIcon(data: StreakCardData) {
  return data.status === 'lost'
    ? AlertTriangle
    : data.status === 'completed'
      ? Trophy
      : data.status === 'active'
        ? Flame
        : Zap;
}

function streakIconColor(data: StreakCardData): string {
  return data.status === 'lost'
    ? 'text-destructive'
    : data.status === 'completed'
      ? 'text-reward'
      : 'text-primary';
}

/** Banner imagine Home — același pentru toate variantele de stil */
const StreakCardImageBanner: React.FC<{ imageUrl?: string }> = ({ imageUrl }) => {
  if (!imageUrl) return null;
  return (
    <div className="h-24 w-full overflow-hidden">
      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
    </div>
  );
};

/** Conținut comun: icon, titlu, status, progres, puncte + CTA (ca la gamified) */
const StreakCardBody: React.FC<{ data: StreakCardData }> = ({ data }) => {
  const StatusIcon = streakStatusIcon(data);
  const iconColor = streakIconColor(data);

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center shadow-sm flex-shrink-0 ${iconColor}`}
        >
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground mb-0.5">{texts.streak.homeCardTitle}</h3>
          <p className="text-xs text-muted-foreground">{data.statusText}</p>

          {data.progress && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>
                  {data.progress.current}/{data.progress.total} comenzi
                </span>
                {data.daysLeft != null && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {data.daysLeft}z
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${data.status === 'lost' ? 'bg-destructive/60' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (data.progress.current / data.progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-bold text-primary">
              {texts.streak.homeCardPoints.replace('{points}', String(data.bonusPoints))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
              {texts.streak.homeCardCta}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Zile până la final campanie (doar gamified: available / active) */
function gamifiedUrgencyDays(data: StreakCardData): number | undefined {
  if (data.status === 'available') return data.daysUntilCampaignEnd;
  if (data.status === 'active') return data.daysLeft;
  return undefined;
}

type UrgencyTone = 'primary' | 'destructive';

/** Chip urgență: vizibil pentru ≤7 zile, fără animații agresive; culori din token-uri temă */
function gamifiedUrgencyChip(
  days: number | undefined
): { text: string; tone: UrgencyTone } | null {
  if (days == null || days > 7) return null;
  const t = texts.streak;
  if (days <= 1) return { text: t.homeGamifiedUrgencyLast, tone: 'destructive' };
  if (days === 2) return { text: t.homeGamifiedUrgencyTwo, tone: 'destructive' };
  return {
    text: t.homeGamifiedUrgencyDays.replace('{days}', String(days)),
    tone: 'primary',
  };
}

function urgencyChipClass(tone: UrgencyTone): string {
  return tone === 'destructive'
    ? 'border border-destructive/25 bg-destructive/10 text-destructive'
    : 'border border-primary/25 bg-primary/10 text-primary';
}

/** Card Home streak — gamified: hero +N, deal, chip urgență, CTA unic */
const GamifiedStreakCardBody: React.FC<{ data: StreakCardData }> = ({ data }) => {
  const pts = data.bonusPoints;
  const t = texts.streak;
  const urgency = gamifiedUrgencyChip(gamifiedUrgencyDays(data));

  let headline: string;
  let subline: string;
  let cta: string;

  switch (data.status) {
    case 'available':
      headline = t.homeGamifiedHeadlineAvailable;
      subline = t.homeGamifiedTrustAvailable;
      cta = t.homeGamifiedCtaAvailable;
      break;
    case 'active':
      headline = t.homeGamifiedHeadlineActive;
      subline = t.homeGamifiedSubActive;
      cta = t.homeGamifiedCtaActive;
      break;
    case 'lost':
      headline = t.homeGamifiedHeadlineLost;
      subline = data.statusText;
      cta = t.homeGamifiedCtaLost;
      break;
    case 'completed':
      headline = t.homeGamifiedHeadlineCompleted;
      subline = t.homeGamifiedSubCompleted;
      cta = t.homeGamifiedCtaCompleted;
      break;
    default:
      headline = t.homeCardTitle;
      subline = data.statusText;
      cta = t.homeCardCta;
  }

  return (
    <div className="p-4">
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center shrink-0 w-[4.75rem] pt-0.5">
          {urgency ? (
            <span
              className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium leading-tight ${urgencyChipClass(urgency.tone)}`}
              role="status"
            >
              {urgency.text}
            </span>
          ) : null}
          <span className="text-3xl font-extrabold tabular-nums text-primary leading-none tracking-tight">
            +{pts}
          </span>
          <span className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            {t.homeGamifiedDealUnit}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground leading-snug">{headline}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subline}</p>
          </div>

          {data.progress && (
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>
                  {data.progress.current}/{data.progress.total} comenzi
                </span>
                {data.daysLeft != null && (
                  <span className="flex items-center gap-0.5 tabular-nums">
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    {data.daysLeft}z
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${data.status === 'lost' ? 'bg-destructive/60' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, (data.progress.current / data.progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-1 rounded-lg bg-primary/10 px-3 py-2.5 flex items-center justify-center gap-2 font-semibold text-sm text-primary transition-colors group-hover:bg-primary/15">
            <span>{cta}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const GamifiedStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const statusSurface: Record<StreakStatus, string> = {
    active: 'bg-gradient-to-br from-primary/5 to-primary/10',
    lost: 'bg-gradient-to-br from-destructive/5 to-destructive/10',
    completed: 'bg-gradient-to-br from-reward/5 to-reward/10',
    available: 'bg-gradient-to-br from-primary/5 to-accent/5',
    none: '',
  };

  return (
    <Link to={routes.streak} className="block group">
      <div
        className={`relative overflow-hidden rounded-2xl border ${streakHomeCardBorderClass(data.status)} ${statusSurface[data.status]} transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.01]`}
      >
        <StreakCardImageBanner imageUrl={data.imageUrl} />
        <GamifiedStreakCardBody data={data} />
      </div>
    </Link>
  );
};

const CleanStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  return (
    <Link to={routes.streak} className="block group">
      <div
        className={`rounded-lg border ${streakHomeCardBorderClass(data.status)} bg-card overflow-hidden transition-all hover:shadow-md`}
      >
        <StreakCardImageBanner imageUrl={data.imageUrl} />
        <StreakCardBody data={data} />
      </div>
    </Link>
  );
};

const PremiumStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  return (
    <Link to={routes.streak} className="block group">
      <div
        className={`relative rounded-2xl border ${streakHomeCardBorderClass(data.status)} bg-background/60 backdrop-blur-xl overflow-hidden transition-all hover:shadow-lg`}
      >
        <StreakCardImageBanner imageUrl={data.imageUrl} />
        <StreakCardBody data={data} />
      </div>
    </Link>
  );
};

const FriendlyStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const surface = data.status === 'lost' ? 'bg-destructive/5' : 'bg-primary/5';

  return (
    <Link to={routes.streak} className="block group">
      <div
        className={`rounded-2xl border ${streakHomeCardBorderClass(data.status)} ${surface} overflow-hidden transition-all hover:shadow-md`}
      >
        <StreakCardImageBanner imageUrl={data.imageUrl} />
        <StreakCardBody data={data} />
      </div>
    </Link>
  );
};

const STYLE_CARDS = {
  gamified: GamifiedStreakCard,
  clean: CleanStreakCard,
  premium: PremiumStreakCard,
  friendly: FriendlyStreakCard,
} as const;

// ─── Main Component ───

export const HomeMarketingCards: React.FC = () => {
  const style = useComponentStyle();
  const streakData = useStreakCardData();

  // Nothing to show if streak plugin disabled or no campaigns
  if (!streakData) return null;

  const StyleCard = STYLE_CARDS[style];

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StyleCard data={streakData} />
            <CouponsPromoCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
