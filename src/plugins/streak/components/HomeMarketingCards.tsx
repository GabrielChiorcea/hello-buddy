/**
 * HomeMarketingCards — Engine component for Home marketing cards section.
 * Single engine, 4 style variants. Feature-flag aware.
 * Shows streak card + future combo card between rank and recommended.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, AlertTriangle, Trophy, Zap, Clock } from 'lucide-react';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { useAppSelector } from '@/store';
import { useComponentStyle } from '@/config/componentStyle';
import { ACTIVE_STREAK_CAMPAIGNS, MY_STREAK_ENROLLMENT } from '../queries';
import { isConsecutiveStreakBroken, isImpossibleToComplete, daysRemaining } from './campaignUtils';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import type { StreakCampaign, StreakEnrollment } from '../types';

type StreakStatus = 'active' | 'lost' | 'completed' | 'available' | 'none';

interface StreakCardData {
  status: StreakStatus;
  statusText: string;
  bonusPoints: number;
  progress?: { current: number; total: number };
  daysLeft?: number;
  campaignName?: string;
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

  if (!enabled) return null;

  const campaigns = campaignsData?.activeStreakCampaigns ?? [];
  const enrollment = enrollmentData?.myStreakEnrollment ?? null;
  const enrolledCampaign = enrollment
    ? campaigns.find((c) => c.id === enrollment.campaignId) ?? enrollment.campaign ?? null
    : null;

  if (campaigns.length === 0) return null;

  const topBonus = campaigns.reduce((max, c) => Math.max(max, c.bonusPoints), 0);

  // Completed
  if (enrollment?.completedAt) {
    return {
      status: 'completed',
      statusText: texts.streak.homeCardCompleted,
      bonusPoints: enrolledCampaign?.bonusPoints ?? topBonus,
      campaignName: enrolledCampaign?.name,
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
      };
    }

    return {
      status: 'active',
      statusText: texts.streak.homeCardActive,
      bonusPoints: enrolledCampaign.bonusPoints,
      progress: { current: enrollment.currentStreakCount, total: enrolledCampaign.ordersRequired },
      daysLeft: daysRemaining(enrolledCampaign.endDate),
      campaignName: enrolledCampaign.name,
    };
  }

  // Not enrolled but campaigns exist
  if (isAuthenticated || campaigns.length > 0) {
    return {
      status: 'available',
      statusText: texts.streak.homeCardAvailable,
      bonusPoints: topBonus,
    };
  }

  return null;
}

// ─── Style Variants ───

interface CardStyleProps {
  data: StreakCardData;
}

const GamifiedStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const statusColors: Record<StreakStatus, string> = {
    active: 'border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10',
    lost: 'border-destructive/40 bg-gradient-to-br from-destructive/5 to-destructive/10',
    completed: 'border-reward/40 bg-gradient-to-br from-reward/5 to-reward/10',
    available: 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5',
    none: '',
  };

  const StatusIcon = data.status === 'lost' ? AlertTriangle
    : data.status === 'completed' ? Trophy
    : data.status === 'active' ? Flame
    : Zap;

  const iconColor = data.status === 'lost' ? 'text-destructive'
    : data.status === 'completed' ? 'text-reward'
    : 'text-primary';

  return (
    <Link to={routes.streak} className="block group">
      <div className={`relative overflow-hidden rounded-2xl border-2 ${statusColors[data.status]} p-4 transition-all hover:shadow-lg hover:scale-[1.02]`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center shadow-sm flex-shrink-0 ${iconColor}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground mb-0.5">{texts.streak.homeCardTitle}</h3>
            <p className="text-xs text-muted-foreground">{data.statusText}</p>

            {data.progress && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{data.progress.current}/{data.progress.total} comenzi</span>
                  {data.daysLeft != null && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{data.daysLeft}z</span>}
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
    </Link>
  );
};

const CleanStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const StatusIcon = data.status === 'lost' ? AlertTriangle : data.status === 'completed' ? Trophy : Flame;

  return (
    <Link to={routes.streak} className="block group">
      <div className="rounded-lg border border-border/50 p-4 hover:border-primary/30 transition-all">
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-4 w-4 flex-shrink-0 ${data.status === 'lost' ? 'text-destructive' : 'text-primary'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{texts.streak.homeCardTitle}</p>
            <p className="text-xs text-muted-foreground">{data.statusText}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        {data.progress && (
          <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${data.status === 'lost' ? 'bg-destructive/50' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (data.progress.current / data.progress.total) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
};

const PremiumStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const StatusIcon = data.status === 'lost' ? AlertTriangle : data.status === 'completed' ? Trophy : Flame;

  return (
    <Link to={routes.streak} className="block group">
      <div className="relative rounded-2xl border border-border/20 bg-background/60 backdrop-blur-xl p-5 hover:shadow-lg transition-all">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.status === 'lost' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <StatusIcon className={`h-5 w-5 ${data.status === 'lost' ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground tracking-tight">{texts.streak.homeCardTitle}</p>
            <p className="text-xs text-muted-foreground">{data.statusText}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
        {data.progress && (
          <div className="mt-3 h-1 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full ${data.status === 'lost' ? 'bg-destructive/40' : 'bg-primary/70'}`}
              style={{ width: `${Math.min(100, (data.progress.current / data.progress.total) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
};

const FriendlyStreakCard: React.FC<CardStyleProps> = ({ data }) => {
  const StatusIcon = data.status === 'lost' ? AlertTriangle : data.status === 'completed' ? Trophy : Flame;

  return (
    <Link to={routes.streak} className="block group">
      <div className={`rounded-2xl border p-4 transition-all hover:shadow-md ${data.status === 'lost' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${data.status === 'lost' ? 'text-destructive' : 'text-primary'}`} />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{texts.streak.homeCardTitle}</p>
            <p className="text-xs text-muted-foreground">{data.statusText}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {data.progress && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${data.status === 'lost' ? 'bg-destructive/60' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (data.progress.current / data.progress.total) * 100)}%` }}
            />
          </div>
        )}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
};
