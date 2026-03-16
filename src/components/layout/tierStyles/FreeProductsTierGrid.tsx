/**
 * Grid compact de produse gratuite (iconița categoriei + nume) pentru blocul de tier.
 * Afișat sub "Ai produse gratuite active pentru nivelul tău: …"
 * Include mesaj despre prag minim și ce trebuie făcut.
 */
import React from 'react';
import { CategoryIconDisplay } from '@/config/categoryIcons';
import { Gift } from 'lucide-react';
import { texts } from '@/config/texts';

type Summary = {
  id: string;
  name: string;
  products: string[];
  minOrderValue?: number;
  productDetails?: { id: string; name: string; categoryName: string; categoryIcon?: string | null }[];
};

const DefaultIcon = Gift;

function collectUniqueProducts(summaries: Summary[]): { id: string; name: string; categoryName: string; categoryIcon?: string | null }[] {
  const byId = new Map<string, { id: string; name: string; categoryName: string; categoryIcon?: string | null }>();
  for (const s of summaries) {
    const details = s.productDetails ?? [];
    for (const p of details) {
      if (p?.id && !byId.has(p.id)) {
        byId.set(p.id, {
          id: p.id,
          name: p.name,
          categoryName: p.categoryName ?? '',
          categoryIcon: p.categoryIcon,
        });
      }
    }
  }
  let list = Array.from(byId.values());
  if (list.length === 0) {
    const namesSeen = new Set<string>();
    for (const s of summaries) {
      for (const name of s.products ?? []) {
        if (name && !namesSeen.has(name)) {
          namesSeen.add(name);
          list.push({ id: `name-${name}`, name, categoryName: '', categoryIcon: null });
        }
      }
    }
  }
  return list;
}

function getEffectiveMinOrder(summaries: Summary[]): number {
  if (summaries.length === 0) return 0;
  const values = summaries
    .map((s) => s.minOrderValue)
    .filter((v): v is number => typeof v === 'number' && v >= 0);
  return values.length === 0 ? 0 : Math.min(...values);
}

export const FreeProductsTierGrid: React.FC<{ summaries: Summary[] }> = ({ summaries }) => {
  const products = collectUniqueProducts(summaries);
  if (products.length === 0) return null;

  const effectiveMin = getEffectiveMinOrder(summaries);
  const hintText =
    effectiveMin > 0
      ? texts.freeProducts.rankInfoMinOrder.replace('{amount}', String(effectiveMin))
      : texts.freeProducts.rankInfoNoMinOrder;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] text-muted-foreground">{hintText}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-2 py-1.5"
        >
          <span className="text-lg shrink-0 text-primary" title={p.categoryName || p.name}>
            {p.categoryName || p.categoryIcon
              ? <CategoryIconDisplay categoryName={p.categoryName} iconId={p.categoryIcon} size={18} />
              : <DefaultIcon size={18} />}
          </span>
          <span className="text-[10px] font-medium text-foreground truncate" title={p.name}>
            {p.name}
          </span>
        </div>
      ))}
      </div>
      <p className="text-[10px] text-muted-foreground/80">{texts.freeProducts.rankInfoCta}</p>
    </div>
  );
};
