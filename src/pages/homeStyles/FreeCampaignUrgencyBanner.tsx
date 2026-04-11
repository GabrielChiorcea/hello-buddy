/**
 * Countdown + urgency above tier accordion — uses campaign endDate (YYYY-MM-DD).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

/** Campanii plugin free-products: startDate/endDate există mereu (DB + GraphQL non-null). */
type Campaign = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  categoryName?: string | null;
  productDetails?: { categoryName?: string }[];
};

function categoryDisplayFromCampaigns(campaigns: Campaign[]): string {
  const labels = new Set<string>();
  for (const c of campaigns) {
    const fromCampaign = c.categoryName?.trim();
    const fromDetail = c.productDetails?.[0]?.categoryName?.trim();
    const label = fromCampaign || fromDetail;
    if (label) labels.add(label);
  }
  if (labels.size === 0) return '';
  return Array.from(labels).join(', ');
}

function endOfDayMs(dateStr: string): number {
  const parts = dateStr.slice(0, 10).split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const totalHours = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = String(totalHours).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function urgencyTier(ms: number): 'calm' | 'soon' | 'hot' | 'critical' {
  const h = ms / 3_600_000;
  if (h > 72) return 'calm';
  if (h > 24) return 'soon';
  if (h > 6) return 'hot';
  return 'critical';
}

export const FreeCampaignUrgencyBanner: React.FC<{
  campaigns: Campaign[];
  className?: string;
  /** Acțiune primară (ex. Comandă) — același rând cu mesajul pe sm+; sub mesaj pe mobil, fără bandă separată */
  action?: React.ReactNode;
}> = ({ campaigns, className, action }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const target = useMemo(() => {
    let best: { end: number } | null = null;
    for (const c of campaigns) {
      const end = endOfDayMs(c.endDate);
      if (Number.isNaN(end)) continue;
      if (!best || end < best.end) best = { end };
    }
    return best;
  }, [campaigns]);

  if (!target) return null;

  const remaining = target.end - now;
  if (remaining <= 0) return null;

  const tier = urgencyTier(remaining);
  const timeStr = formatCountdown(remaining);
  const categoryLabel = categoryDisplayFromCampaigns(campaigns);
  const offerPrefix = categoryLabel
    ? texts.home.heroFreeCampaignOfferExpiresWithCategory.replace('{category}', categoryLabel)
    : texts.home.heroFreeCampaignOfferExpiresFallback;

  const shell = cn(
    'relative rounded-xl border-2 px-3 pb-3 pt-5 shadow-lg md:rounded-2xl md:px-5 md:pb-4 md:pt-6 md:shadow-xl',
    tier === 'calm' && 'border-primary-foreground/35 bg-primary-foreground/12',
    tier === 'soon' && 'border-amber-300/70 bg-amber-400/15',
    tier === 'hot' && 'border-orange-400/90 bg-orange-500/20',
    tier === 'critical' && 'border-red-400/95 bg-red-600/25 ring-2 ring-red-400/40',
  );

  const badgeClass = cn(
    'absolute left-3 top-0 z-10 -translate-y-1/2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md md:left-4 md:px-3 md:py-1 md:text-xs',
    tier === 'calm' && 'border-primary-foreground/50 bg-primary-foreground text-primary',
    tier === 'soon' && 'border-amber-400/80 bg-amber-100 text-amber-950',
    tier === 'hot' && 'border-orange-300/90 bg-orange-100 text-orange-950',
    tier === 'critical' && 'border-red-200 bg-red-100 text-red-950',
  );

  return (
    <div className={cn(shell, 'mb-3', className)}>
      <span className={badgeClass}>{texts.home.heroFreeCampaignUrgencyKicker}</span>
      <div
        className={cn(
          'flex min-w-0 flex-col gap-3 md:gap-4',
          action != null && 'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center md:gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/90 sm:mt-0 md:h-6 md:w-6" aria-hidden />
          <p
            className={cn(
              'min-w-0 text-sm font-semibold leading-snug drop-shadow-sm md:text-base md:leading-snug',
              tier === 'critical' && 'text-red-100',
              tier === 'hot' && 'text-orange-100',
              (tier === 'soon' || tier === 'calm') && 'text-primary-foreground/90',
            )}
          >
            {offerPrefix}
            <span
              className={cn(
                'ml-1 inline tabular-nums text-lg font-bold sm:ml-1.5 md:text-2xl',
                tier === 'critical' && 'text-red-50',
                tier === 'hot' && 'text-orange-50',
                (tier === 'soon' || tier === 'calm') && 'text-primary-foreground',
              )}
            >
              {timeStr}
            </span>
          </p>
        </div>
        {action != null ? (
          <div className="w-full shrink-0 sm:w-auto">{action}</div>
        ) : null}
      </div>
    </div>
  );
};
