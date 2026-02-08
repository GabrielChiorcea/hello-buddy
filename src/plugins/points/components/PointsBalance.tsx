/**
 * Card afișare puncte totale - folosit în Profile
 */

import { Gift } from 'lucide-react';

interface PointsBalanceProps {
  points: number;
}

export function PointsBalance({ points }: PointsBalanceProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-4">
      <Gift className="h-5 w-5 text-primary" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Puncte totale</p>
        <p className="text-2xl font-bold text-foreground">{points ?? 0}</p>
      </div>
    </div>
  );
}
