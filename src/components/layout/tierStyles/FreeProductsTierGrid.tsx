/**
 * Free products rich cards — combined design with rank badges, product info,
 * countdown to campaign end and a primary CTA. Each campaign renders its own
 * self-contained card matching the marketing mock.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { texts } from '@/config/texts';
import { formatDisplayNumber } from '@/lib/utils';
import { AninnimatedHourglass } from '@/components/icons/AninnimatedHourglass';
import { routes } from '@/config/routes';

type Summary = {
  id: string;
  name: string;
  categoryName: string | null;
  products: string[];
  minOrderValue?: number;
  /** Plugin: campaniile au mereu interval în DB */
  startDate: string;
  endDate: string;
  productDetails?: { id: string; name: string; categoryName: string; categoryIcon?: string | null }[];
};

/** Sfârșit de zi local pentru `YYYY-MM-DD` (formatul folosit în DB pentru endDate). */
function endOfDayMs(dateStr: string): number {
  const parts = dateStr.slice(0, 10).split('-').map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

interface CountdownParts {
  d: number;
  h: number;
  m: number;
  s: number;
}

function diffParts(ms: number): CountdownParts {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
}

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center leading-none">
    <span className="text-base font-bold tabular-nums text-foreground md:text-xl">
      {String(value).padStart(2, '0')}
    </span>
    <span className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[10px]">
      {label}
    </span>
  </div>
);

const CountdownDisplay: React.FC<{ endDate: string }> = ({ endDate }) => {
  const endMs = useMemo(() => endOfDayMs(endDate), [endDate]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(endMs)) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [endMs]);

  const remaining = Number.isNaN(endMs) ? 0 : Math.max(0, endMs - now);
  const { d, h, m, s } = diffParts(remaining);

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <AninnimatedHourglass className="h-7 w-7 shrink-0 text-orange-500 md:h-9 md:w-9" />
      <div className="flex items-center gap-1 md:gap-1.5">
        <TimeUnit value={d} label={texts.freeProducts.countdownDays} />
        <span className="text-base font-bold text-muted-foreground md:text-xl">:</span>
        <TimeUnit value={h} label={texts.freeProducts.countdownHours} />
        <span className="text-base font-bold text-muted-foreground md:text-xl">:</span>
        <TimeUnit value={m} label={texts.freeProducts.countdownMinutes} />
        <span className="text-base font-bold text-muted-foreground md:text-xl">:</span>
        <TimeUnit value={s} label={texts.freeProducts.countdownSeconds} />
      </div>
    </div>
  );
};

const FreeProductCard: React.FC<{ summary: Summary }> = ({ summary }) => {
  const firstDetail = summary.productDetails?.[0];
  const label = (summary.categoryName?.trim() || firstDetail?.categoryName?.trim() || '').trim();
  const minOrderText =
    summary.minOrderValue && summary.minOrderValue > 0
      ? texts.freeProducts.minOrderToActivate.replace(
          '{amount}',
          formatDisplayNumber(summary.minOrderValue),
        )
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-sm md:p-5 md:shadow-md">
      {/* Header: rank + GRATIS badges */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary md:text-xs">
          {texts.freeProducts.yourRankBadge}
        </span>
        <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm md:text-xs">
          {texts.freeProducts.freeBadge}
        </span>
      </div>

      {/* Product info */}
      <div className="mt-3 flex items-center gap-2.5 md:mt-4 md:gap-3">
        <span className="inline-flex shrink-0 origin-center scale-110 md:scale-125">
          <CategoryIconDisplay
            categoryName={label}
            iconId={firstDetail?.categoryIcon}
            size={28}
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold leading-tight text-foreground md:text-lg" title={label}>
            {label}
          </h3>
          <p className="text-[11px] leading-snug text-muted-foreground md:text-sm">
            {texts.freeProducts.oneUnitAutoAdded}
          </p>
        </div>
      </div>

      <div className="my-3 h-px w-full bg-border/70 md:my-4" />

      {/* Countdown + CTA */}
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <CountdownDisplay endDate={summary.endDate} />
        <Link
          to={routes.catalog}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:h-11 md:px-6 md:text-sm"
        >
          {texts.freeProducts.orderCta}
        </Link>
      </div>

      {minOrderText && (
        <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground md:mt-4 md:text-sm">
          {minOrderText.split(/(\d+\s*RON)/).map((chunk, i) =>
            /\d+\s*RON/.test(chunk) ? (
              <span key={i} className="font-bold text-foreground">
                {chunk}
              </span>
            ) : (
              <React.Fragment key={i}>{chunk}</React.Fragment>
            ),
          )}
        </p>
      )}
    </div>
  );
};

export const FreeProductsTierGrid: React.FC<{ summaries: Summary[] }> = ({ summaries }) => {
  if (summaries.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {summaries.map((s) => (
        <FreeProductCard key={s.id} summary={s} />
      ))}
    </div>
  );
};
