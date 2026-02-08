/**
 * Detalii puncte pe comandă - pentru secțiunea total/rezumat (AdminOrders)
 */

import type { Order } from '@/types';

interface PointsOrderDetailsProps {
  order: Pick<Order, 'pointsEarned' | 'pointsUsed' | 'discountFromPoints'>;
  currency?: string;
}

export function PointsOrderDetails({ order, currency = 'RON' }: PointsOrderDetailsProps) {
  const used = order.pointsUsed ?? 0;
  const earned = order.pointsEarned ?? 0;
  const discount = order.discountFromPoints ?? 0;

  if (used === 0 && earned === 0) return null;

  return (
    <>
      {used > 0 && (
        <div className="flex justify-between text-primary">
          <span>Reducere puncte ({used} pt)</span>
          <span>-{discount} {currency}</span>
        </div>
      )}
      {earned > 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>Puncte câștigate</span>
          <span>+{earned}</span>
        </div>
      )}
    </>
  );
}
