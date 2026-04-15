/**
 * Grid compact de produse gratuite — marketing-optimized cu badge GRATIS și urgency.
 */
import React from 'react';
import { Gift } from 'lucide-react';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { texts } from '@/config/texts';
import { formatDisplayNumber } from '@/lib/utils';

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

function collectUniqueFreeCategories(
  summaries: Summary[]
): { key: string; categoryName: string; categoryIcon?: string | null }[] {
  const byCategory = new Map<string, { key: string; categoryName: string; categoryIcon?: string | null }>();

  for (const s of summaries) {
    // Prefer the campaign-level display name when present; otherwise take it from productDetails.
    const labelFromCampaign = s.categoryName ?? '';
    const firstDetail = s.productDetails?.[0];
    const labelFromDetails = firstDetail?.categoryName ?? '';

    const categoryLabel = labelFromCampaign || labelFromDetails;
    if (!categoryLabel) continue;

    if (!byCategory.has(categoryLabel)) {
      byCategory.set(categoryLabel, {
        key: categoryLabel,
        categoryName: categoryLabel,
        categoryIcon: firstDetail?.categoryIcon ?? null,
      });
    }
  }

  return Array.from(byCategory.values());
}

function getEffectiveMinOrder(summaries: Summary[]): number {
  if (summaries.length === 0) return 0;
  const values = summaries
    .map((s) => s.minOrderValue)
    .filter((v): v is number => typeof v === 'number' && v >= 0);
  return values.length === 0 ? 0 : Math.min(...values);
}

export const FreeProductsTierGrid: React.FC<{ summaries: Summary[] }> = ({ summaries }) => {
  const freeCategories = collectUniqueFreeCategories(summaries);
  if (freeCategories.length === 0) return null;

  const effectiveMin = getEffectiveMinOrder(summaries);
  const categoryLabel = freeCategories.map((c) => c.categoryName).join(', ');
  const hintText =
    effectiveMin > 0
      ? texts.freeProducts.rankInfoMinOrder
          .replace('{amount}', formatDisplayNumber(effectiveMin))
          .replace('{category}', categoryLabel)
      : texts.freeProducts.rankInfoNoMinOrder;

  return (
    <div className="mt-2 md:mt-3">
      {/* Layout pe coloană: info sus, produse jos */}
      <div className="grid grid-cols-1 items-stretch gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        <div className="flex min-w-0 flex-col justify-center gap-1.5 py-0.5 sm:gap-2 md:gap-3 md:py-1">
          <p className="mb-0 flex items-start gap-1.5 text-[11px] font-bold leading-tight text-primary sm:gap-2 sm:text-sm md:gap-2.5 md:text-base">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden />
            <span className="min-w-0">{texts.freeProducts.availableOnlyForYourRank}</span>
          </p>
          <p className="text-[9px] leading-snug text-muted-foreground sm:text-[10px] md:text-base md:leading-relaxed">
            {hintText}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2 md:gap-3 md:py-1">
          {freeCategories.map((c) => (
            <div
              key={c.key}
              className="relative flex min-w-0 items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-2 py-2 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 md:gap-4 md:rounded-2xl md:px-5 md:py-4"
            >
              <span className="absolute -right-0.5 -top-1.5 rounded-full bg-primary px-1.5 py-px text-[7px] font-bold uppercase text-primary-foreground shadow-sm sm:-right-1 sm:-top-2 sm:px-2 sm:py-0.5 sm:text-[8px] md:right-2 md:top-2 md:px-3 md:py-1 md:text-xs">
                Gratis
              </span>
              <span
                className="inline-flex shrink-0 origin-center scale-105 sm:scale-110 md:scale-[1.35]"
                title={c.categoryName}
              >
                <CategoryIconDisplay categoryName={c.categoryName} iconId={c.categoryIcon} size={26} />
              </span>
              <span
                className="min-w-0 truncate text-[10px] font-semibold leading-tight text-foreground sm:text-xs md:text-base"
                title={c.categoryName}
              >
                {c.categoryName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
