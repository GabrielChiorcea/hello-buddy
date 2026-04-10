import React from 'react';
import { Calendar, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { texts } from '@/config/texts';

interface CampaignCompactPreviewProps {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  dateRange: string;
  points: number;
  progress: number;
  totalOrders: number;
  completedOrders: number;
  estimatedSavingsRon: number | null;
  isEnrolled?: boolean;
  isFailed?: boolean;
  onOpenDetail?: () => void;
}

const AnimatedHourglass: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      transformOrigin: '50% 50%',
      animation: 'streak-hourglass-flip 1.2s ease-in-out infinite',
    }}
    aria-hidden="true"
  >
    <path d="M7 3h10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M7 21h10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path
      d="M8 3v2.5c0 1.9 1.1 3.7 2.8 4.6L12 10.8l1.2-.7A5.3 5.3 0 0 0 16 5.5V3"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 21v-2.5c0-1.9-1.1-3.7-2.8-4.6L12 13.2l-1.2.7A5.3 5.3 0 0 0 8 18.5V21"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 8.7h3" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M10 15.3h4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

export const CampaignCompactPreview: React.FC<CampaignCompactPreviewProps> = ({
  title,
  subtitle,
  imageUrl,
  dateRange,
  points,
  progress,
  totalOrders,
  completedOrders,
  estimatedSavingsRon,
  isEnrolled = false,
  isFailed = false,
  onOpenDetail,
}) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <>
      <style>{`
        @keyframes streak-hourglass-flip {
          0%, 32% { transform: rotate(0deg); }
          45%, 55% { transform: rotate(180deg); }
          68%, 100% { transform: rotate(180deg); }
        }
        @keyframes streak-savings-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
      <button
        type="button"
        onClick={onOpenDetail}
        className={cn(
          'group relative w-full overflow-hidden rounded-[20px] border border-reward/35 bg-background text-left transition-all duration-200',
          'hover:-translate-y-0.5 hover:border-reward/70'
        )}
      >
      {isFailed && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/45 backdrop-blur-[1px]"
        >
          <span className="rounded-full border border-destructive/40 bg-destructive/85 px-3 py-1 text-xs font-bold uppercase tracking-wide text-destructive-foreground">
            {texts.streak.preview.lostOverlay}
          </span>
        </div>
      )}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className={cn('h-[110px] w-full object-cover', isFailed && 'grayscale opacity-60')}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={cn('h-[110px] w-full bg-muted', isFailed && 'opacity-60')} />
      )}
      <div className="px-4 pb-4 pt-[14px]">
        <div className={cn('flex items-start gap-3', isFailed && 'opacity-60')}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-reward to-reward-light">
            <Flame className="h-[18px] w-[18px] text-reward-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-foreground">{title}</p>
            {estimatedSavingsRon != null ? (
              <p className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full border border-reward/25 bg-reward/10 px-2 py-0.5 text-[11px] font-semibold text-reward">
                <Sparkles className="h-3 w-3 shrink-0 animate-pulse" />
                <span
                  className="truncate bg-gradient-to-r from-reward via-reward-light to-reward bg-[length:200%_100%] bg-clip-text text-transparent"
                  style={{ animation: 'streak-savings-shimmer 1.8s linear infinite' }}
                >
                  {texts.streak.preview.savingsLabel.replace('{amount}', estimatedSavingsRon.toFixed(0))}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="shrink-0 rounded-xl border border-reward/30 bg-reward/12 px-2.5 py-1 text-center">
            <p className="text-[20px] font-bold leading-none text-reward">{points}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">puncte</p>
          </div>
        </div>

        <div className={cn('mt-3', isFailed && 'opacity-60')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Progres</span>
            <span className="text-[11px] text-muted-foreground">{completedOrders} / {totalOrders} comenzi</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-[99px] bg-muted">
            <div
              className="h-full rounded-[99px] bg-gradient-to-r from-reward to-reward-light transition-all duration-500"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground', isFailed && 'opacity-60')}>
            <Calendar className="h-3 w-3 shrink-0 text-reward" />
            <span className="truncate">{dateRange}</span>
            <AnimatedHourglass className="h-4 w-4 shrink-0 self-center text-reward" />
          </span>
          <span className="relative z-30 inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-reward px-3.5 py-[7px] text-[12px] font-medium text-reward-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {isFailed
              ? texts.streak.preview.ctaUnlock
              : isEnrolled
                ? texts.streak.preview.ctaView
                : texts.streak.preview.ctaDetails}
          </span>
        </div>
      </div>
      </button>
    </>
  );
};
