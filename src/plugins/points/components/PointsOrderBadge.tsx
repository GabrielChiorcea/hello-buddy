/**
 * Badge +X / -Y puncte pe comandă - folosit în Profile, AdminOrders
 */

import type { Order } from '@/types';

interface PointsOrderBadgeProps {
  order: Pick<Order, 'pointsEarned' | 'pointsUsed'>;
}

export function PointsOrderBadge({ order }: PointsOrderBadgeProps) {
  const earned = order.pointsEarned ?? 0;
  const used = order.pointsUsed ?? 0;

  if (earned === 0 && used === 0) return null;

  return (
    <div className="space-y-1 mb-4 text-sm text-muted-foreground">
      {earned > 0 && <p>+{earned} puncte câștigate</p>}
      {used > 0 && <p>-{used} puncte folosite</p>}
    </div>
  );
}
