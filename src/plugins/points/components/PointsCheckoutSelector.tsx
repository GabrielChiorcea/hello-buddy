/**
 * Selector folosește puncte - folosit în Checkout
 */

import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PointsReward } from '../types';
import type { CheckoutData } from '@/types';

interface PointsCheckoutSelectorProps {
  userPoints: number;
  rewards: PointsReward[];
  formData: CheckoutData;
  onPointsChange: (pointsToUse: number | undefined) => void;
  currency?: string;
}

export function PointsCheckoutSelector({
  userPoints,
  rewards,
  formData,
  onPointsChange,
  currency = 'RON',
}: PointsCheckoutSelectorProps) {
  if (rewards.length === 0 || userPoints <= 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        Folosește puncte (ai {userPoints})
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={!formData.pointsToUse ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPointsChange(undefined)}
        >
          Nu folosi
        </Button>
        {rewards
          .filter((r) => r.pointsCost <= userPoints)
          .map((r) => (
            <Button
              key={r.id}
              type="button"
              variant={formData.pointsToUse === r.pointsCost ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPointsChange(r.pointsCost)}
            >
              {r.pointsCost} pt = -{r.discountAmount} {currency}
            </Button>
          ))}
      </div>
    </div>
  );
}
