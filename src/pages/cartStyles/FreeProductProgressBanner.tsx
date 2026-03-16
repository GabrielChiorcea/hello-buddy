/**
 * FreeProductProgressBanner — Mesaj de progres spre produse gratuite în coș
 */

import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { texts } from '@/config/texts';
import type { FreeProductProgress } from './shared';

interface Props {
  progress: FreeProductProgress;
}

export const FreeProductProgressBanner: React.FC<Props> = ({ progress }) => {
  if (!progress) return null;

  const { remaining, unlocked, minOrderValue, paidSubtotal, productNames } = progress;
  const percent = Math.min(100, (paidSubtotal / minOrderValue) * 100);
  const productsLabel = productNames.length > 0 ? productNames.join(', ') : 'produse gratuite';

  if (unlocked) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
        <div className="flex items-center gap-2 text-success text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          <span>🎉 Ai deblocat {productsLabel} gratuit!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Gift className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-foreground">
          Mai adaugă <strong className="text-primary">{remaining.toFixed(2)} {texts.common.currency}</strong> pentru a primi <strong>{productsLabel}</strong> gratuit!
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
