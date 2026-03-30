/**
 * Grid compact de produse gratuite — marketing-optimized cu badge GRATIS și urgency.
 */
import React from 'react';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { texts } from '@/config/texts';

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
  const hintText =
    effectiveMin > 0
      ? texts.freeProducts.rankInfoMinOrder.replace('{amount}', String(effectiveMin))
      : texts.freeProducts.rankInfoNoMinOrder;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] text-muted-foreground">{hintText}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {freeCategories.map((c) => (
          <div
            key={c.key}
            className="relative flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2"
          >
          {/* GRATIS badge */}
            <span className="absolute -top-2 -right-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 uppercase shadow-sm">
              Gratis
            </span>
            <span className="shrink-0" title={c.categoryName}>
              <CategoryIconDisplay categoryName={c.categoryName} iconId={c.categoryIcon} size={24} />
            </span>
            <span
              className="text-[12px] font-semibold text-foreground truncate"
              title={c.categoryName}
            >
              {c.categoryName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
